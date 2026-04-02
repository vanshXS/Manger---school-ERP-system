package com.vansh.manger.Manger.common.service;

public interface EmailSender {
    /**
     * Send a welcome email to a newly created user with their raw password.
     */
    void sendNewUserWelcomeEmail(String toEmail, String fullName, String rawPassword);

    /**
     * Send a password reset email to a user with their new temporary password.
     */
    void sendPasswordResetEmail(String toEmail, String fullName, String newRawPassword);

    /**
     * Send a PDF marksheet to a student.
     */
    void sendMarksheet(String to, byte[] pdfBytes, String studentName, String examName, String rollNo, String subjectName);
}
