package com.vansh.manger.Manger.Controller;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

import com.vansh.manger.Manger.Config.JwtUtil;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.vansh.manger.Manger.DTO.AdminLoginDTO;
import com.vansh.manger.Manger.DTO.AdminRegisterationDTO;
import com.vansh.manger.Manger.DTO.AuthResponseDTO;
import com.vansh.manger.Manger.DTO.ForgetPasswordRequest;
import com.vansh.manger.Manger.DTO.ForgetResetPassword;
import com.vansh.manger.Manger.DTO.ResetPasswordRequest;
import com.vansh.manger.Manger.DTO.TokenRefreshResponseDTO;
import com.vansh.manger.Manger.Entity.RefreshToken;
import com.vansh.manger.Manger.Entity.Roles;
import com.vansh.manger.Manger.Entity.User;
import com.vansh.manger.Manger.Repository.UserRepo;
import com.vansh.manger.Manger.Service.RefreshTokenService;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/auth/admin")
@RequiredArgsConstructor
@Slf4j
public class AdminAuthController {

    private final UserRepo userRepo;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final RefreshTokenService refreshTokenService;
    private final JavaMailSender mailsender;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody @Valid AdminRegisterationDTO adminRegisterationDTO) {
        try {
            if (userRepo.findByEmail(adminRegisterationDTO.getEmail()).isPresent()) {
                return ResponseEntity
                        .status(HttpStatus.CONFLICT)
                        .body(Map.of("error", "Admin with this email already exists"));
            }

            User admin = User.builder()
                    .email(adminRegisterationDTO.getEmail())
                    .roles(Roles.ADMIN)
                    .password(passwordEncoder.encode(adminRegisterationDTO.getPassword()))
                    .fullName(adminRegisterationDTO.getFullName())
                    .build();

            userRepo.save(admin);

            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(Map.of("message", "Admin registered successfully"));
        } catch (Exception e) {
            log.error("Registration failed for email: {}", adminRegisterationDTO.getEmail(), e);
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Registration failed. Please try again."));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody @Valid AdminLoginDTO adminLoginDTO, HttpServletResponse response) {
        try {
            // Authenticate user
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            adminLoginDTO.getEmail(),
                            adminLoginDTO.getPassword()));

            User user = (User) authentication.getPrincipal();

            // Verify admin role
            if (!Roles.ADMIN.equals(user.getRoles())) {
                return ResponseEntity
                        .status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "This account is not an admin account"));
            }

            // Generate tokens
            String accessToken = jwtUtil.generateAccessToken(user, user.getRoles().name());
            String refreshToken = jwtUtil.generateRefreshToken(user, user.getRoles().name());

            // Save refresh token in database
            refreshTokenService.createRefreshToken(
                    user.getId(),
                    refreshToken,
                    Instant.now().plusMillis(7L * 24 * 60 * 60 * 1000) // 7 days
            );

            // Create response DTO
            AuthResponseDTO responseDTO = new AuthResponseDTO(
                    accessToken,
                    refreshToken,
                    user.getRoles().name());

            // Set refresh token as HTTP-only cookie
            ResponseCookie refreshCookie = ResponseCookie.from("refreshToken", refreshToken)
                    .httpOnly(true)
                    .secure(false) // Set to true in production with HTTPS
                    .path("/")
                    .maxAge(7 * 24 * 60 * 60) // 7 days
                    .sameSite("Strict")
                    .build();

            response.addHeader("Set-Cookie", refreshCookie.toString());

            log.info("Admin logged in successfully: {}", user.getEmail());

            return ResponseEntity.ok(responseDTO);

        } catch (BadCredentialsException e) {
            log.warn("Failed login attempt for email: {}", adminLoginDTO.getEmail());
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid email or password"));
        } catch (AuthenticationException e) {
            log.error("Authentication error for email: {}", adminLoginDTO.getEmail(), e);
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Authentication failed"));
        } catch (Exception e) {
            log.error("Login failed for user: {}", adminLoginDTO.getEmail(), e);
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Login failed. Please try again."));
        }
    }

    @PostMapping(value = "/refresh", produces = "application/json")
    public ResponseEntity<?> refreshToken(HttpServletRequest request, HttpServletResponse response) {
        try {
            // Extract refresh token from cookie
            String refreshToken = null;
            if (request.getCookies() != null) {
                for (Cookie cookie : request.getCookies()) {
                    if ("refreshToken".equals(cookie.getName())) {
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

            // Find and verify the refresh token
            Optional<RefreshToken> tokenOpt = refreshTokenService.findByToken(refreshToken);

            if (tokenOpt.isEmpty()) {
                log.warn("Invalid refresh token attempted");
                return ResponseEntity
                        .status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Invalid refresh token"));
            }

            // Verify token expiration
            RefreshToken verifiedToken = refreshTokenService.verifyExpiration(tokenOpt.get());
            User user = verifiedToken.getUser();

            // Verify user is still an admin
            if (!Roles.ADMIN.equals(user.getRoles())) {
                return ResponseEntity
                        .status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "User is not an admin"));
            }

            // Generate new access token
            String newAccessToken = jwtUtil.generateAccessToken(user, user.getRoles().name());

            // Create response DTO
            TokenRefreshResponseDTO responseDTO = new TokenRefreshResponseDTO(
                    newAccessToken,
                    user.getRoles().name());

            // Extend refresh token cookie expiry
            ResponseCookie refreshCookie = ResponseCookie.from("refreshToken", refreshToken)
                    .httpOnly(true)
                    .secure(false) // Set to true in production
                    .path("/")
                    .maxAge(7 * 24 * 60 * 60) // 7 days
                    .sameSite("Strict")
                    .build();

            response.addHeader("Set-Cookie", refreshCookie.toString());

            log.info("Token refreshed for user: {}", user.getEmail());

            return ResponseEntity.ok(responseDTO);

        } catch (RuntimeException e) {
            log.error("Token refresh failed: {}", e.getMessage());

            // Clear invalid cookie
            ResponseCookie clearCookie = ResponseCookie.from("refreshToken", "")
                    .httpOnly(true)
                    .secure(false)
                    .path("/")
                    .maxAge(0)
                    .sameSite("Strict")
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

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request, HttpServletResponse response) {
        try {
            // Extract and delete refresh token from database
            String refreshToken = null;
            if (request.getCookies() != null) {
                for (Cookie cookie : request.getCookies()) {
                    if ("refreshToken".equals(cookie.getName())) {
                        refreshToken = cookie.getValue();
                        break;
                    }
                }
            }

            // Delete refresh token from database if it exists
            if (refreshToken != null && !refreshToken.isEmpty()) {
                refreshTokenService.deleteByToken(refreshToken);
            }

            // Clear refresh token cookie
            ResponseCookie clearCookie = ResponseCookie.from("refreshToken", "")
                    .httpOnly(true)
                    .secure(false) // Set to true in production
                    .path("/")
                    .maxAge(0)
                    .sameSite("Strict")
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

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody @Valid ResetPasswordRequest request) {
        try {
            User user = userRepo.findByEmail(request.getEmail())
                    .orElseThrow(() -> new RuntimeException("User with this email not registered"));

            if (!Roles.ADMIN.equals(user.getRoles())) {
                return ResponseEntity
                        .status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "This is not an admin account"));
            }

            if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
                return ResponseEntity
                        .status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Old password is incorrect"));
            }

            // Validate new password is different from old
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

    @PostMapping("/forget-password")
    public ResponseEntity<?> forgetPassword(@RequestBody @Valid ForgetPasswordRequest request) {
        try {
            User user = userRepo.findByEmail(request.getEmail())
                    .orElseThrow(() -> new RuntimeException("This email is not registered"));

            if (!Roles.ADMIN.equals(user.getRoles())) {
                return ResponseEntity
                        .status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Not an admin account"));
            }

            // Generate 6-digit OTP
            String otp = String.format("%06d", new SecureRandom().nextInt(1000000));

            user.setResetOtp(otp);
            user.setOtpExpiry(LocalDateTime.now().plusMinutes(10));
            userRepo.save(user);

            // Send email
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setTo(user.getEmail());
                message.setSubject("Admin Password Reset OTP");
                message.setText("Your OTP for password reset is: " + otp +
                        "\n\nThis OTP will expire in 10 minutes." +
                        "\n\nIf you did not request this, please ignore this email.");
                mailsender.send(message);

                log.info("OTP sent successfully to: {}", user.getEmail());
            } catch (Exception emailException) {
                log.error("Failed to send OTP email to: {}", user.getEmail(), emailException);
                // Rollback OTP setting
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

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody @Valid ForgetResetPassword request) {
        try {
            User user = userRepo.findByEmail(request.getEmail())
                    .orElseThrow(() -> new RuntimeException("Admin not found"));

            if (!Roles.ADMIN.equals(user.getRoles())) {
                return ResponseEntity
                        .status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Not an admin account"));
            }

            // Validate OTP exists
            if (user.getResetOtp() == null || user.getResetOtp().trim().isEmpty()) {
                return ResponseEntity
                        .status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "No OTP request found. Please request a new OTP."));
            }

            // Validate OTP match
            if (!user.getResetOtp().equals(request.getOtp())) {
                return ResponseEntity
                        .status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Invalid OTP"));
            }

            // Validate OTP expiry
            if (user.getOtpExpiry() == null || user.getOtpExpiry().isBefore(LocalDateTime.now())) {
                // Clear expired OTP
                user.setResetOtp(null);
                user.setOtpExpiry(null);
                userRepo.save(user);

                return ResponseEntity
                        .status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "OTP has expired. Please request a new one."));
            }

            // Update password and clear OTP
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