package com.vansh.manger.Manger.common.config;

import com.vansh.manger.Manger.common.service.EmailSender;
import com.vansh.manger.Manger.common.service.ResendEmailService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class EmailConfig {

    @Bean
    public EmailSender resendEmailSender(@Value("${RESEND_API_KEY}") String apiKey) {
        return new ResendEmailService(apiKey);
    }
}
