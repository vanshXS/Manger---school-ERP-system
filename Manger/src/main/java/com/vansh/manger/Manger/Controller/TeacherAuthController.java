package com.vansh.manger.Manger.Controller;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

import com.vansh.manger.Manger.Config.JwtUtil;
import com.vansh.manger.Manger.DTO.*;
import com.vansh.manger.Manger.Entity.RefreshToken;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
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

import com.vansh.manger.Manger.Entity.Roles;
import com.vansh.manger.Manger.Entity.User;
import com.vansh.manger.Manger.Repository.UserRepo;
import com.vansh.manger.Manger.Service.RefreshTokenService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/auth/teacher")
@RequiredArgsConstructor
public class TeacherAuthController {

    private final UserRepo userRepo;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final RefreshTokenService refreshTokenService;
    private final JavaMailSender mailsender;

    @PostMapping("/login")
    public ResponseEntity<AuthResponseDTO> login(@RequestBody @Valid AdminLoginDTO teacherLogin, HttpServletResponse response) {

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(teacherLogin.getEmail(), teacherLogin.getPassword()));

            User user = (User) authentication.getPrincipal();

            if (!user.getRoles().equals(Roles.TEACHER)) {
                return ResponseEntity.status(403).build();

            }
            String accessToken = jwtUtil.generateAccessToken(user, user.getRoles().name());
            String refreshToken = jwtUtil.generateRefreshToken(user, user.getRoles().name());

            refreshTokenService.createRefreshToken(
                    user.getId(),
                    refreshToken,
                    Instant.now().plusMillis(7 * 24 * 60 * 60 * 1000) // 7 days
            );

            AuthResponseDTO responseDTO = new AuthResponseDTO(
                    accessToken,
                    refreshToken,
                    user.getRoles().name()
            );

            ResponseCookie cookie = ResponseCookie.from("refreshToken", refreshToken)
                    .httpOnly(true)
                    .secure(false)
                    .path("/")
                    .maxAge(7 * 24 * 60 * 60)
                    .sameSite("Strict")
                    .build();
            response.addHeader("Set-Cookie", cookie.toString());

            return ResponseEntity.ok(responseDTO);

        }catch(BadCredentialsException e){
            return ResponseEntity.status(403).build();
        }
    }


   @PostMapping(value = "/refresh", produces = "application/json")
   public ResponseEntity<?> refreshToken(HttpServletRequest request, HttpServletResponse response) {

        String refreshToken = null;
        if(request.getCookies() != null) {
            for(Cookie cookie : request.getCookies()) {
                if("refreshToken".equals(cookie.getName())){
                    refreshToken = cookie.getValue();
                    break;
                }
            }
        }

        if(refreshToken == null || refreshToken.isEmpty()) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid refresh token"));
        }

        Optional<RefreshToken> tokenOpt = refreshTokenService.findByToken(refreshToken);

        if(tokenOpt.isEmpty()) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        RefreshToken verifiedToken = refreshTokenService.verifyExpiration(tokenOpt.get());

        User user = verifiedToken.getUser();

        if(!user.getRoles().equals(Roles.TEACHER)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Invalid refresh token"));
        }

        String accessToken =  jwtUtil.generateAccessToken(user, user.getRoles().name());

       TokenRefreshResponseDTO tokenRefreshResponseDTO = new TokenRefreshResponseDTO(accessToken, user.getRoles().name());

       ResponseCookie responseCookie = ResponseCookie.from("refreshToken", refreshToken)
               .httpOnly(true)
               .secure(false)
               .maxAge(7*24*60*60)
               .path("/")
               .sameSite("Strict")
               .build();

       response.addHeader("Set-Cookie", responseCookie.toString());

       return ResponseEntity.status(HttpStatus.CREATED).body(tokenRefreshResponseDTO);

   }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request, HttpServletResponse response) {

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
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Token failed"));

        }
        //delete the refreshToken from the database

        refreshTokenService.deleteByToken(refreshToken);

        //Clear the refresh token from the cookie
        ResponseCookie clearCookie = ResponseCookie.from("refreshToken")
                .httpOnly(true)
                .secure(false)
                .sameSite("Strict")
                .path("/")
                .maxAge(0)
                .build();

        response.addHeader("Set-Cookie", clearCookie.toString());
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("refreshToken", refreshToken));

    }



    // Change password (while logged in)
    @PostMapping("/change-password")
    public ResponseEntity<String> resetPassword(@RequestBody @Valid ResetPasswordRequest request) {

        User user = userRepo.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User with this email not registered"));

        if (!user.getRoles().equals(Roles.TEACHER)) {
            return ResponseEntity.badRequest().body("This is not a teacher account");
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

        User user = userRepo.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!user.getRoles().equals(Roles.TEACHER)) {
            return ResponseEntity.status(403).body("Not a Teacher account");
        }

        String otp = String.valueOf(new SecureRandom().nextInt(900000) + 100000);
        user.setResetOtp(otp);
        user.setOtpExpiry(LocalDateTime.now().plusMinutes(10));
        userRepo.save(user);

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(user.getEmail());
        message.setSubject("Teacher Password Reset OTP");
        message.setText("Your OTP is: " + otp + "\nIt will expire in 10 minutes.");
        mailsender.send(message);

        return ResponseEntity.ok("OTP sent to registered email!");

    }

    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPasswordWithOtp(@RequestBody @Valid ForgetResetPassword request) {

        User user = userRepo.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Teacher not found"));

        if (!user.getRoles().equals(Roles.TEACHER)) {
            return ResponseEntity.status(403).body("Not a Teacher account");
        }

        // Validate OTP
        if (user.getResetOtp() == null || !user.getResetOtp().equals(request.getOtp())) {
            return ResponseEntity.badRequest().body("Invalid OTP");
        }
        if (user.getOtpExpiry().isBefore(LocalDateTime.now())) {
            return ResponseEntity.badRequest().body("OTP expired");
        }

        // Update password
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setResetOtp(null);
        user.setOtpExpiry(null);
        userRepo.save(user);

        return ResponseEntity.ok("Password reset successful");
    }
}
