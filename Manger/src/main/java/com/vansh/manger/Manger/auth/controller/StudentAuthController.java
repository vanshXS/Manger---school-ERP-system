package com.vansh.manger.Manger.auth.controller;


import com.vansh.manger.Manger.auth.dto.AuthLoginDTO;
import com.vansh.manger.Manger.auth.dto.ForgetPasswordRequest;
import com.vansh.manger.Manger.auth.dto.ForgetResetPassword;
import com.vansh.manger.Manger.auth.dto.ResetPasswordRequest;
import com.vansh.manger.Manger.auth.entity.RefreshToken;
import com.vansh.manger.Manger.auth.service.RefreshTokenService;
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
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.beans.factory.annotation.Value;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/auth/student")
@RequiredArgsConstructor
public class StudentAuthController {

    @Value("${COOKIE_SECURE:false}") // Defaults to false for local testing
    private boolean isSecure;

    private final UserRepo userRepo;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final RefreshTokenService refreshTokenService;
    private final JavaMailSender mailsender;


    @PostMapping("/login")
    public ResponseEntity<AuthResponseDTO> login(@RequestBody @Valid AuthLoginDTO loginDTO, HttpServletResponse response) {

        try {
            Authentication auth = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginDTO.getEmail() + ":ROLE_W_SPLIT:" + Roles.STUDENT.name(), loginDTO.getPassword())
            );
            CurrentUserPrincipal user = (CurrentUserPrincipal) auth.getPrincipal();
            if (!user.role().equals(Roles.STUDENT)) {
                return ResponseEntity.status(403).build();
            }

            String accessToken = jwtUtil.generateAccessToken(user);
            String refreshToken = jwtUtil.generateRefreshToken(user);

            refreshTokenService.createRefreshToken(
                    user.userId(), refreshToken, Instant.now().plusMillis(TimeUnit.DAYS.toMillis(7))
            );


            AuthResponseDTO responseDTO = new AuthResponseDTO(accessToken, refreshToken, user.role().name());

            ResponseCookie cookie = ResponseCookie.from("studentRefreshToken", refreshToken)
                    .httpOnly(true)
                    .secure(isSecure)
                    .path("/")
                    .sameSite(isSecure ? "None" : "Lax")
                    .maxAge(TimeUnit.DAYS.toSeconds(7))
                    .build();

            response.addHeader("Set-Cookie", cookie.toString());

            return ResponseEntity.ok(responseDTO);

        }catch(BadCredentialsException e) {
                return ResponseEntity.status(403).build();
        }
    }

    @PostMapping(value = "/refresh", produces = "application/json")
    public ResponseEntity<?> refreshToken(HttpServletRequest request, HttpServletResponse response) {

        String refreshToken = null;

        if(request.getCookies() != null) {
            for(Cookie cookie : request.getCookies()) {
                if("studentRefreshToken".equals(cookie.getName())){
                    refreshToken = cookie.getValue();
                    break;
                }
            }
        }

        if(refreshToken == null || refreshToken.isEmpty()) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid refresh Token"));
        }

        Optional<RefreshToken> tokenOpt = refreshTokenService.findByToken(refreshToken);

        if(tokenOpt.isEmpty()) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        RefreshToken verifiedToken = refreshTokenService.verifyExpiration(tokenOpt.get());

        User user = verifiedToken.getUser();

        if(!user.getRoles().equals(Roles.STUDENT)){
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Invalid refresh token"));
        }

        String accessToken = jwtUtil.generateAccessToken(user, user.getRoles().name());

        TokenRefreshResponseDTO tokenRefreshResponseDTO = new TokenRefreshResponseDTO(accessToken, user.getRoles().name());

        ResponseCookie responseCookie = ResponseCookie.from("studentRefreshToken", refreshToken)
                .httpOnly(true)
                .secure(isSecure)
                .maxAge(TimeUnit.DAYS.toSeconds(7))
                .path("/")
                .sameSite(isSecure ? "None" : "Lax")
                .build();
        response.addHeader("Set-Cookie", responseCookie.toString());

        return ResponseEntity.status(HttpStatus.CREATED).body(tokenRefreshResponseDTO);

    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request, HttpServletResponse response) {

        String refreshToken = null;

        if(request.getCookies() != null){
            for(Cookie cookie : request.getCookies()) {
                if("studentRefreshToken".equals(cookie.getName())) {
                    refreshToken = cookie.getValue();
                    break;
                }
            }
        }
        if (refreshTokenValidator(response, refreshToken, refreshTokenService, "studentRefreshToken", isSecure))
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Token failed"));
        return ResponseEntity.status(HttpStatus.CREATED).body(null);
    }

    // Change password (while logged in)
    @PostMapping("/change-password")
    public ResponseEntity<String> changePassword(@RequestBody @Valid ResetPasswordRequest request) {

        User user = userRepo.findByEmailAndRoles(request.getEmail(), Roles.STUDENT)
                .orElseThrow(() -> new RuntimeException("User with this email not registered"));

        if (!user.getRoles().equals(Roles.STUDENT)) {
            return ResponseEntity.badRequest().body("This is not a student account");
        }

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            return ResponseEntity.badRequest().body("Old password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepo.save(user);

        return new ResponseEntity<>("Password changed successfully!", HttpStatus.ACCEPTED);
    }

    // forget password(send otp)
    @PostMapping("/forget-password")
    public ResponseEntity<String> forgetPassword(@RequestBody @Valid ForgetPasswordRequest request) {

        User user = userRepo.findByEmailAndRoles(request.getEmail(), Roles.STUDENT)
                .orElseThrow(() -> new RuntimeException("User not found"));



        if (!user.getRoles().equals(Roles.STUDENT)) {
            return ResponseEntity.status(403).body("Not a Student account");
        }

        String otp = String.valueOf(new SecureRandom().nextInt(900000) + 100000);
        user.setResetOtp(otp);
        user.setOtpExpiry(LocalDateTime.now().plusMinutes(10));
        userRepo.save(user);

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(user.getEmail());
        message.setSubject("Student Password Reset OTP");
        message.setText("Your OTP is: " + otp + "\nIt will expire in 10 minutes.");
        mailsender.send(message);

        return ResponseEntity.ok("OTP sent to registered email!");
    }

    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPasswordWithOtp(@RequestBody @Valid ForgetResetPassword request) {

        User user = userRepo.findByEmailAndRoles(request.getEmail(), Roles.STUDENT)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        if (!user.getRoles().equals(Roles.STUDENT)) {
            return ResponseEntity.status(403).body("Not a Student account");
        }

        if (user.getResetOtp() == null || !user.getResetOtp().equals(request.getOtp())) {
            return ResponseEntity.badRequest().body("Invalid OTP");
        }
        if (user.getOtpExpiry().isBefore(LocalDateTime.now())) {
            return ResponseEntity.badRequest().body("OTP expired");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setResetOtp(null);
        user.setOtpExpiry(null);
        userRepo.save(user);

        return ResponseEntity.ok("Password reset successful");
    }

    static boolean refreshTokenValidator(HttpServletResponse response, String refreshToken, RefreshTokenService refreshTokenService, String cookieName, boolean isSecure) {
        if(refreshToken == null || refreshToken.isEmpty()) {
            return true;
        }

        refreshTokenService.deleteByToken(refreshToken);

        ResponseCookie clearCookie = ResponseCookie.from(cookieName, "")
                .httpOnly(true)
                .secure(isSecure)
                .sameSite(isSecure ? "None" : "Lax")
                .path("/")
                .maxAge(0)
                .build();
        response.addHeader("Set-Cookie", clearCookie.toString());
        return false;
    }


}