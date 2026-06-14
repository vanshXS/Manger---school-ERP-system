package com.vansh.manger.Manger.auth.controller;

import com.vansh.manger.Manger.auth.dto.AuthLoginDTO;
import com.vansh.manger.Manger.auth.dto.AuthRegisterationDTO;
import com.vansh.manger.Manger.auth.dto.ForgetPasswordRequest;
import com.vansh.manger.Manger.auth.dto.ForgetResetPassword;
import com.vansh.manger.Manger.auth.dto.ResetPasswordRequest;
import com.vansh.manger.Manger.auth.service.AuthService;
import com.vansh.manger.Manger.common.entity.Roles;
import com.vansh.manger.Manger.common.entity.User;
import com.vansh.manger.Manger.common.repository.UserRepo;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/auth/admin")
@RequiredArgsConstructor
@Slf4j
public class AdminAuthController {

    private final UserRepo userRepo;
    private final PasswordEncoder passwordEncoder;
    private final AuthService authService;
    private static final String COOKIE_NAME = "adminRefreshToken";

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody @Valid AuthRegisterationDTO authRegisterationDTO) {
        try {
            if (userRepo.findByEmailAndRoles(authRegisterationDTO.getEmail(), Roles.ADMIN).isPresent()) {
                return ResponseEntity
                        .status(HttpStatus.CONFLICT)
                        .body(Map.of("error", "Admin with this email already exists"));
            }

            User admin = User.builder()
                    .email(authRegisterationDTO.getEmail())
                    .roles(Roles.ADMIN)
                    .password(passwordEncoder.encode(authRegisterationDTO.getPassword()))
                    .fullName(authRegisterationDTO.getFullName())
                    .build();

            userRepo.save(admin);

            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(Map.of("message", "Admin registered successfully"));
        } catch (Exception e) {
            log.error("Registration failed for email: {}", authRegisterationDTO.getEmail(), e);
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Registration failed. Please try again."));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody @Valid AuthLoginDTO authLoginDTO, HttpServletResponse response) {
        return authService.login(authLoginDTO, Roles.ADMIN, COOKIE_NAME, response);
    }

    @PostMapping(value = "/refresh", produces = "application/json")
    public ResponseEntity<?> refreshToken(HttpServletRequest request, HttpServletResponse response) {
        return authService.refreshToken(request, response, Roles.ADMIN, COOKIE_NAME);
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request, HttpServletResponse response) {
        return authService.logout(request, response, COOKIE_NAME);
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody @Valid ResetPasswordRequest request) {
        return authService.changePassword(request, Roles.ADMIN);
    }

    @PostMapping("/forget-password")
    public ResponseEntity<?> forgetPassword(@RequestBody @Valid ForgetPasswordRequest request) {
        return authService.forgetPassword(request, Roles.ADMIN, "Admin");
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody @Valid ForgetResetPassword request) {
        return authService.resetPassword(request, Roles.ADMIN);
    }
}