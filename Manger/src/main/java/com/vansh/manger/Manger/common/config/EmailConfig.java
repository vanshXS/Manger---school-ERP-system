package com.vansh.manger.Manger.common.config;

import com.vansh.manger.Manger.common.service.EmailSender;
import com.vansh.manger.Manger.common.service.GMailEmailService;
import com.vansh.manger.Manger.common.service.ResendEmailService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;

@Configuration
public class EmailConfig {

//    @Bean
//    public EmailSender gmailEmailSender(JavaMailSender javaMailSender) {
//        return new GMailEmailService(javaMailSender);
//    }

    @Bean
    public EmailSender renderEmailSender(@Value("${resend.api.key}") String apiKey) {
        return new ResendEmailService(apiKey);
    }
}
