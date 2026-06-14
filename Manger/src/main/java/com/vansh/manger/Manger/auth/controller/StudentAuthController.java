package com.vansh.manger.Manger.auth.controller;

import com.vansh.manger.Manger.auth.dto.AuthLoginDTO;
import com.vansh.manger.Manger.auth.dto.ForgetPasswordRequest;
import com.vansh.manger.Manger.auth.dto.ForgetResetPassword;
import com.vansh.manger.Manger.auth.dto.ResetPasswordRequest;
import com.vansh.manger.Manger.auth.service.AuthService;
import com.vansh.manger.Manger.common.entity.Roles;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth/student")
@RequiredArgsConstructor
public class StudentAuthController {

    private final AuthService authService;
    private static final String COOKIE_NAME = "studentRefreshToken";

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody @Valid AuthLoginDTO loginDTO, HttpServletResponse response) {
        return authService.login(loginDTO, Roles.STUDENT, COOKIE_NAME, response);
    }

    @PostMapping(value = "/refresh", produces = "application/json")
    public ResponseEntity<?> refreshToken(HttpServletRequest request, HttpServletResponse response) {
        return authService.refreshToken(request, response, Roles.STUDENT, COOKIE_NAME);
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request, HttpServletResponse response) {
        return authService.logout(request, response, COOKIE_NAME);
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody @Valid ResetPasswordRequest request) {
        return authService.changePassword(request, Roles.STUDENT);
    }

    @PostMapping("/forget-password")
    public ResponseEntity<?> forgetPassword(@RequestBody @Valid ForgetPasswordRequest request) {
        return authService.forgetPassword(request, Roles.STUDENT, "Student");
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPasswordWithOtp(@RequestBody @Valid ForgetResetPassword request) {
        return authService.resetPassword(request, Roles.STUDENT);
    }
}