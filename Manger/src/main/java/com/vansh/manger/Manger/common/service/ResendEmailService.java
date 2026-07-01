package com.vansh.manger.Manger.common.service;

import com.resend.Resend;
import com.resend.core.exception.ResendException;
import com.resend.services.emails.model.CreateEmailOptions;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;

@Slf4j
public class ResendEmailService implements EmailSender {

    private final Resend resend;

    @Value("${RESEND_FROM_EMAIL}")
    private String fromEmail;

    public ResendEmailService(String apiKey) {
        this.resend = new Resend(apiKey);
    }

    @Async
    @Override
    public void sendNewUserWelcomeEmail(String toEmail, String fullName, String rawPassword) {
        String html = generateHtmlTemplate(
                "Welcome to Manger",
                "Hello " + fullName + ",",
                "An account has been created for you on the <strong>Manger</strong> school portal.",
                "Your login details are:",
                "<li><strong>Email:</strong> " + toEmail + "</li>" +
                        "<li><strong>Temporary Password:</strong> " + rawPassword + "</li>",
                "Please log in and change your password at your earliest convenience."
        );
        sendHtmlEmail(toEmail, "Welcome to Manger - Your School Portal Account", html);
    }

    @Async
    @Override
    public void sendPasswordResetEmail(String toEmail, String fullName, String newRawPassword) {
        String html = generateHtmlTemplate(
                "Password Reset Success",
                "Hello " + fullName + ",",
                "Your password has been reset by an administrator.",
                "Your new temporary password is:",
                "<li><strong>New Password:</strong> " + newRawPassword + "</li>",
                "Please log in and change this password immediately."
        );
        sendHtmlEmail(toEmail, "Manger - Your Password Has Been Reset", html);
    }

    @Async
    @Override
    public void sendMarksheet(String to, byte[] pdfBytes, String studentName,
                              String examName, String rollNo, String subjectName) {
        String html = generateHtmlTemplate(
                "Marksheet Recorded",
                "Dear " + studentName + " (Roll No: " + rollNo + "),",
                "Your marks for <strong>" + subjectName + "</strong> (" + examName + ") have been recorded.",
                "Please find your marksheet attached.",
                "",
                "Best regards, The Manger Team"
        );
        sendHtmlEmail(to, examName + " | Your Marksheet for " + subjectName, html);
    }

    @Async
    @Override
    public void sendOtpEmail(String toEmail, String otp, String subjectPrefix) {
        String html = generateHtmlTemplate(
                subjectPrefix + " Password Reset",
                "Hello,",
                "We received a request to reset your password on the <strong>Manger</strong> school portal.",
                "Your OTP (One-Time Password) is:",
                "<li><strong style='font-size: 22px; letter-spacing: 3px;'>" + otp + "</strong></li>",
                "This OTP will expire in <strong>10 minutes</strong>.<br/><br/>If you did not request this, please ignore this email."
        );
        sendHtmlEmail(toEmail, subjectPrefix + " Password Reset OTP", html);
    }

    private void sendHtmlEmail(String to, String subject, String html) {
        try {
            CreateEmailOptions params = CreateEmailOptions.builder()
                    .from(fromEmail)
                    .to(to)
                    .subject(subject)
                    .html(html)
                    .build();

            resend.emails().send(params);
            log.info("Email sent successfully to {}", to);
        } catch (ResendException e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
            throw new RuntimeException("Failed to send email: " + e.getMessage());
        }
    }

    private String generateHtmlTemplate(String title, String greeting, String mainText, String listHeader, String listItems, String closingText) {
        return "<!DOCTYPE html>" +
                "<html>" +
                "<head>" +
                "    <style>" +
                "        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f7f9; margin: 0; padding: 0; }" +
                "        .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #e1e8ed; }" +
                "        .header { background-color: #21618C; color: #ffffff; padding: 30px; text-align: center; }" +
                "        .header h1 { margin: 0; font-size: 24px; letter-spacing: 1px; text-transform: uppercase; }" +
                "        .content { padding: 40px; }" +
                "        .greeting { font-size: 18px; font-weight: bold; margin-bottom: 20px; color: #2c3e50; }" +
                "        .main-text { margin-bottom: 25px; font-size: 16px; }" +
                "        .details-box { background-color: #f8fbff; border-left: 4px solid #21618C; padding: 20px; margin-bottom: 25px; border-radius: 0 4px 4px 0; }" +
                "        .details-box p { margin: 0 0 10px 0; font-weight: bold; color: #21618C; }" +
                "        .details-list { list-style: none; padding: 0; margin: 0; }" +
                "        .details-list li { margin-bottom: 10px; font-size: 15px; }" +
                "        .footer { background-color: #fdfdfe; color: #7f8c8d; padding: 20px; text-align: center; font-size: 12px; border-top: 1px solid #eee; }" +
                "        .button { display: inline-block; padding: 12px 25px; background-color: #21618C; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 20px; }" +
                "    </style>" +
                "</head>" +
                "<body>" +
                "    <div class='container'>" +
                "        <div class='header'>" +
                "            <h1>MANGER</h1>" +
                "            <p style='margin: 5px 0 0 0; font-size: 14px; opacity: 0.8;'>Virtual School Manager</p>" +
                "        </div>" +
                "        <div class='content'>" +
                "            <div class='greeting'>" + greeting + "</div>" +
                "            <div class='main-text'>" + mainText + "</div>" +
                "            <div class='details-box'>" +
                "                <p>" + listHeader + "</p>" +
                "                <ul class='details-list'>" + listItems + "</ul>" +
                "            </div>" +
                "            <div class='main-text'>" + closingText + "</div>" +
                "            <div style='text-align: center;'>" +
                "                <a href='#' class='button'>Go to Portal</a>" +
                "            </div>" +
                "        </div>" +
                "        <div class='footer'>" +
                "            &copy; " + java.time.Year.now().getValue() + " MANGER School ERP. All rights reserved.<br/>" +
                "            This is an automated message, please do not reply." +
                "        </div>" +
                "    </div>" +
                "</body>" +
                "</html>";
    }
}