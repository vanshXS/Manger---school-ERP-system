package com.vansh.manger.Manger.common.service;

import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Implementation of EmailSender using JavaMailSender (typically for SMTP/Gmail).
 */
@RequiredArgsConstructor
@Slf4j
public class GMailEmailService implements EmailSender {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String senderEmail;

    @Async
    @Override
    public void sendNewUserWelcomeEmail(String toEmail, String fullName, String rawPassword) {
        String htmlContent = generateHtmlTemplate(
                "Welcome to Manger",
                "Hello " + fullName + ",",
                "An account has been created for you on the <strong>Manger</strong> school portal.",
                "Your login details are:",
                "<li><strong>Email:</strong> " + toEmail + "</li>" +
                "<li><strong>Temporary Password:</strong> " + rawPassword + "</li>",
                "Please log in and change your password at your earliest convenience."
        );

        sendHtmlEmail(toEmail, "Welcome to Manger - Your School Portal Account", htmlContent);
    }

    @Async
    @Override
    public void sendPasswordResetEmail(String toEmail, String fullName, String newRawPassword) {
        String htmlContent = generateHtmlTemplate(
                "Password Reset Success",
                "Hello " + fullName + ",",
                "An administrator has successfully reset the password for your account.",
                "Your new temporary password is:",
                "<li><strong>New Password:</strong> " + newRawPassword + "</li>",
                "Please log in and change this password immediately to secure your account."
        );

        sendHtmlEmail(toEmail, "Manger - Your Password Has Been Reset", htmlContent);
    }

    @Async
    @Override
    public void sendMarksheet(String to, byte[] pdfBytes, String studentName, String examName, String rollNo, String subjectName) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            String htmlContent = generateHtmlTemplate(
                    "Marksheet Recorded",
                    "Dear " + studentName + " (Roll No: " + rollNo + "),",
                    "Your marks for <strong>" + subjectName + "</strong> (" + examName + ") have been recorded.",
                    "Please find your marksheet attached below.",
                    "",
                    "Best regards, <br/>The Manger Team"
            );

            helper.setFrom(senderEmail);
            helper.setTo(to);
            helper.setSubject(examName + " | Your Marksheet for " + subjectName);
            helper.setText(htmlContent, true);
            helper.addAttachment("Marksheet_" + studentName.replace(" ", "_") + ".pdf", new ByteArrayResource(pdfBytes));
            mailSender.send(message);
        } catch (Exception e) {
            log.error("Failed to send marksheet email to {}: {}", to, e.getMessage());
            throw new RuntimeException("Failed to send marksheet email: " + e.getMessage());
        }
    }

    private void sendHtmlEmail(String to, String subject, String htmlContent) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(senderEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            
            mailSender.send(message);
        } catch (Exception e) {
            log.error("Failed to send HTML email to {}: {}", to, e.getMessage());
            throw new RuntimeException("Failed to send HTML email: " + e.getMessage());
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

