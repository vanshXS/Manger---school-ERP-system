package com.vansh.manger.Manger.common.config;


import com.cloudinary.Cloudinary;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import java.util.Map;

@Configuration
@Slf4j
public class CloudinaryConfig {


    @Value("${cloudinary.cloud-name}")
    private String cloudinaryName;

    @Value("${cloudinary.api-key}")
    private String apiKey;

    @Value("${cloudinary.api-secret}")
    private String apiSecret;



    @Bean
    public Cloudinary cloudinaryConfiguration() {


        return new Cloudinary(
                Map.of(
                        "cloud_name", cloudinaryName,
                        "api_key", apiKey,
                        "api_secret", apiSecret

                )
        );
    }


}
