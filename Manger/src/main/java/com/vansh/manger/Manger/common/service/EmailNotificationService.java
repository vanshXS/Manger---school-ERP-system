package com.vansh.manger.Manger.common.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailNotificationService {

    private final EmailSender emailSender;
    private final ActivityLogService activityLogService;

    @Async
    public void sendNewUserWelcomeEmailSafe(String email, String name, String rawPassword, String roleName) {
        try {
            emailSender.sendNewUserWelcomeEmail(email, name, rawPassword);
            log.info("Welcome email sent successfully to {} ({})", email, roleName);
        } catch (Exception e) {
            log.error("CRITICAL: Failed to send welcome email for {} ({}): {}", name, email, e.getMessage());
            activityLogService.logActivity(
                    "EMAIL_FAILED: Failed to send welcome email to " + email + ". Reason: " + e.getMessage(),
                    "System"
            );
        }
    }

    @Async
    public void sendPasswordResetEmailSafe(String email, String name, String newPassword, String roleName) {
        try {
            emailSender.sendPasswordResetEmail(email, name, newPassword);
            log.info("Password reset email sent successfully to {} ({})", email, roleName);
        } catch (Exception e) {
            log.error("CRITICAL: Failed to send password reset email for {} ({}): {}", name, email, e.getMessage());
            activityLogService.logActivity(
                    "EMAIL_FAILED: Failed to send password reset email to " + email + ". Reason: " + e.getMessage(),
                    "System"
            );
        }
    }
}
