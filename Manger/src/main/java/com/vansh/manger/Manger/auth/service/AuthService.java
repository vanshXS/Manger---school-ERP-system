package com.vansh.manger.Manger.auth.service;

import com.vansh.manger.Manger.auth.dto.AuthLoginDTO;
import com.vansh.manger.Manger.auth.dto.ForgetPasswordRequest;
import com.vansh.manger.Manger.auth.dto.ForgetResetPassword;
import com.vansh.manger.Manger.auth.dto.ResetPasswordRequest;
import com.vansh.manger.Manger.auth.entity.RefreshToken;
import com.vansh.manger.Manger.common.config.JwtUtil;
import com.vansh.manger.Manger.common.dto.AuthResponseDTO;
import com.vansh.manger.Manger.common.dto.TokenRefreshResponseDTO;
import com.vansh.manger.Manger.common.entity.Roles;
import com.vansh.manger.Manger.common.entity.User;
import com.vansh.manger.Manger.common.repository.UserRepo;
import com.vansh.manger.Manger.common.security.CurrentUserPrincipal;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import com.vansh.manger.Manger.common.service.EmailSender;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    @Value("${COOKIE_SECURE:false}")
    private boolean isSecure;

    private final UserRepo userRepo;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final RefreshTokenService refreshTokenService;
    private final EmailSender emailSender;

    public ResponseEntity<?> login(AuthLoginDTO authLoginDTO, Roles role, String cookieName, HttpServletResponse response) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            authLoginDTO.getEmail() + ":ROLE_W_SPLIT:" + role.name(),
                            authLoginDTO.getPassword()));

            CurrentUserPrincipal user = (CurrentUserPrincipal) authentication.getPrincipal();

            if (!role.equals(user.role())) {
                return ResponseEntity
                        .status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "This account is not a " + role.name().toLowerCase() + " account"));
            }

            String accessToken = jwtUtil.generateAccessToken(user);
            String refreshToken = jwtUtil.generateRefreshToken(user);

            refreshTokenService.createRefreshToken(
                    user.userId(),
                    refreshToken,
                    Instant.now().plusMillis(7L * 24 * 60 * 60 * 1000) // 7 days
            );

            AuthResponseDTO responseDTO = new AuthResponseDTO(
                    accessToken,
                    refreshToken,
                    user.role().name());

            ResponseCookie refreshCookie = ResponseCookie.from(cookieName, refreshToken)
                    .httpOnly(true)
                    .secure(isSecure)
                    .path("/")
                    .maxAge(7 * 24 * 60 * 60)
                    .sameSite(isSecure ? "None" : "Lax")
                    .build();

            response.addHeader("Set-Cookie", refreshCookie.toString());
            log.info("{} logged in successfully: {}", role.name(), user.email());
            return ResponseEntity.ok(responseDTO);

        } catch (BadCredentialsException e) {
            log.warn("Failed login attempt for email: {}", authLoginDTO.getEmail());
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid email or password"));
        } catch (Exception e) {
            log.error("Login failed for user: {}", authLoginDTO.getEmail(), e);
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Login failed. Please try again."));
        }
    }

    public ResponseEntity<?> refreshToken(HttpServletRequest request, HttpServletResponse response, Roles role, String cookieName) {
        try {
            String refreshToken = null;
            if (request.getCookies() != null) {
                for (Cookie cookie : request.getCookies()) {
                    if (cookieName.equals(cookie.getName())) {
                        refreshToken = cookie.getValue();
                        break;
                    }
                }
            }

            if (refreshToken == null || refreshToken.isEmpty()) {
                return ResponseEntity
                        .status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "No refresh token found"));
            }

            Optional<RefreshToken> tokenOpt = refreshTokenService.findByToken(refreshToken);

            if (tokenOpt.isEmpty()) {
                log.warn("Invalid refresh token attempted");
                return ResponseEntity
                        .status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Invalid refresh token"));
            }

            RefreshToken verifiedToken = refreshTokenService.verifyExpiration(tokenOpt.get());
            User user = verifiedToken.getUser();

            if (!role.equals(user.getRoles())) {
                return ResponseEntity
                        .status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "User is not a " + role.name().toLowerCase()));
            }

            String newAccessToken = jwtUtil.generateAccessToken(user, user.getRoles().name());

            TokenRefreshResponseDTO responseDTO = new TokenRefreshResponseDTO(
                    newAccessToken,
                    user.getRoles().name());

            ResponseCookie refreshCookie = ResponseCookie.from(cookieName, refreshToken)
                    .httpOnly(true)
                    .secure(isSecure)
                    .path("/")
                    .maxAge(7 * 24 * 60 * 60)
                    .sameSite(isSecure ? "None" : "Lax")
                    .build();

            response.addHeader("Set-Cookie", refreshCookie.toString());
            log.info("Token refreshed for user: {}", user.getEmail());
            return ResponseEntity.ok(responseDTO);

        } catch (RuntimeException e) {
            log.error("Token refresh failed: {}", e.getMessage());
            ResponseCookie clearCookie = ResponseCookie.from(cookieName, "")
                    .httpOnly(true)
                    .secure(isSecure)
                    .path("/")
                    .maxAge(0)
                    .sameSite(isSecure ? "None" : "Lax")
                    .build();
            response.addHeader("Set-Cookie", clearCookie.toString());
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid or expired refresh token"));
        } catch (Exception e) {
            log.error("Token refresh error", e);
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Token refresh failed"));
        }
    }

    public ResponseEntity<?> logout(HttpServletRequest request, HttpServletResponse response, String cookieName) {
        try {
            String refreshToken = null;
            if (request.getCookies() != null) {
                for (Cookie cookie : request.getCookies()) {
                    if (cookieName.equals(cookie.getName())) {
                        refreshToken = cookie.getValue();
                        break;
                    }
                }
            }

            if (refreshToken != null && !refreshToken.isEmpty()) {
                refreshTokenService.deleteByToken(refreshToken);
            }

            ResponseCookie clearCookie = ResponseCookie.from(cookieName, "")
                    .httpOnly(true)
                    .secure(isSecure)
                    .path("/")
                    .maxAge(0)
                    .sameSite(isSecure ? "None" : "Lax")
                    .build();

            response.addHeader("Set-Cookie", clearCookie.toString());
            log.info("User logged out successfully");
            return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
        } catch (Exception e) {
            log.error("Logout error", e);
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Logout failed"));
        }
    }

    public ResponseEntity<?> changePassword(ResetPasswordRequest request, Roles role) {
        try {
            User user = userRepo.findByEmailAndRoles(request.getEmail(), role)
                    .orElseThrow(() -> new RuntimeException("User with this email not registered"));

            if (!role.equals(user.getRoles())) {
                return ResponseEntity
                        .status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "This is not a " + role.name().toLowerCase() + " account"));
            }

            if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
                return ResponseEntity
                        .status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Old password is incorrect"));
            }

            if (request.getOldPassword().equals(request.getNewPassword())) {
                return ResponseEntity
                        .status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "New password must be different from old password"));
            }

            user.setPassword(passwordEncoder.encode(request.getNewPassword()));
            userRepo.save(user);
            log.info("Password changed successfully for: {}", user.getEmail());
            return ResponseEntity.ok(Map.of("message", "Password changed successfully"));

        } catch (RuntimeException e) {
            log.error("Password change failed: {}", e.getMessage());
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Password change error", e);
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Password change failed"));
        }
    }

    public ResponseEntity<?> forgetPassword(ForgetPasswordRequest request, Roles role, String subjectPrefix) {
        try {
            User user = userRepo.findByEmailAndRoles(request.getEmail(), role)
                    .orElseThrow(() -> new RuntimeException("This email is not registered"));

            if (!role.equals(user.getRoles())) {
                return ResponseEntity
                        .status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Not a " + role.name().toLowerCase() + " account"));
            }

            String otp = String.format("%06d", new SecureRandom().nextInt(1000000));
            user.setResetOtp(otp);
            user.setOtpExpiry(LocalDateTime.now().plusMinutes(10));
            userRepo.save(user);

            try {
                emailSender.sendOtpEmail(user.getEmail(), otp, subjectPrefix);
                log.info("OTP sent successfully to: {}", user.getEmail());
            } catch (Exception emailException) {
                log.error("Failed to send OTP email to: {}", user.getEmail(), emailException);
                user.setResetOtp(null);
                user.setOtpExpiry(null);
                userRepo.save(user);
                return ResponseEntity
                        .status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of("error", "Failed to send OTP email. Please try again."));
            }

            return ResponseEntity.ok(Map.of("message", "OTP sent to registered email"));

        } catch (RuntimeException e) {
            log.error("Forget password failed: {}", e.getMessage());
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Forget password error", e);
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to process request"));
        }
    }

    public ResponseEntity<?> resetPassword(ForgetResetPassword request, Roles role) {
        try {
            User user = userRepo.findByEmailAndRoles(request.getEmail(), role)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            if (!role.equals(user.getRoles())) {
                return ResponseEntity
                        .status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Not a " + role.name().toLowerCase() + " account"));
            }

            if (user.getResetOtp() == null || user.getResetOtp().trim().isEmpty()) {
                return ResponseEntity
                        .status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "No OTP request found. Please request a new OTP."));
            }

            if (!user.getResetOtp().equals(request.getOtp())) {
                return ResponseEntity
                        .status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Invalid OTP"));
            }

            if (user.getOtpExpiry() == null || user.getOtpExpiry().isBefore(LocalDateTime.now())) {
                user.setResetOtp(null);
                user.setOtpExpiry(null);
                userRepo.save(user);
                return ResponseEntity
                        .status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "OTP has expired. Please request a new one."));
            }

            user.setPassword(passwordEncoder.encode(request.getNewPassword()));
            user.setResetOtp(null);
            user.setOtpExpiry(null);
            userRepo.save(user);
            log.info("Password reset successful for: {}", user.getEmail());
            return ResponseEntity.ok(Map.of("message", "Password reset successful"));

        } catch (RuntimeException e) {
            log.error("Password reset failed: {}", e.getMessage());
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Password reset error", e);
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Password reset failed"));
        }
    }
}
