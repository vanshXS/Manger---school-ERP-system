package com.vansh.manger.Manger.common.config;

import org.springframework.stereotype.Component;

import java.security.SecureRandom;

/**
 * Generates cryptographically secure random passwords.
 *
 * <p><b>DIP</b> — now a Spring-managed {@code @Component} so services
 * depend on the injected abstraction rather than instantiating via {@code new}.</p>
 */
@Component
public class RandomPasswordGenerator {


    public String generateRandomPassword() {

        int length = 8;
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
        SecureRandom random = new SecureRandom();
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < length; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        return sb.toString();
    }

}
