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
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/auth/teacher")
@RequiredArgsConstructor
public class TeacherAuthController {

    private final AuthService authService;
    private static final String COOKIE_NAME = "teacherRefreshToken";

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody @Valid AuthLoginDTO teacherLogin, HttpServletResponse response) {
        return authService.login(teacherLogin, Roles.TEACHER, COOKIE_NAME, response);
    }

    @PostMapping(value = "/refresh", produces = "application/json")
    public ResponseEntity<?> refreshToken(HttpServletRequest request, HttpServletResponse response) {
        return authService.refreshToken(request, response, Roles.TEACHER, COOKIE_NAME);
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request, HttpServletResponse response) {
        return authService.logout(request, response, COOKIE_NAME);
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody @Valid ResetPasswordRequest request) {
        return authService.changePassword(request, Roles.TEACHER);
    }

    @PostMapping("/forget-password")
    public ResponseEntity<?> forgetPassword(@RequestBody @Valid ForgetPasswordRequest request) {
        return authService.forgetPassword(request, Roles.TEACHER, "Teacher");
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPasswordWithOtp(@RequestBody @Valid ForgetResetPassword request) {
        return authService.resetPassword(request, Roles.TEACHER);
    }
}