package com.vansh.manger.Manger.Config;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Test configuration for EnrollmentService tests.
 * Provides test-specific beans and configurations.
 */
@TestConfiguration
@Profile("test")
public class EnrollmentServiceTestConfig {

    /**
     * Provides a password encoder for testing purposes.
     * Uses a consistent strength for predictable behavior in tests.
     */
    @Bean
    @Primary
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(8); // Lower strength for faster tests
    }
}
