package com.vansh.manger.Manger;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class MangerApplication {

	public static void main(String[] args) {
		SpringApplication.run(MangerApplication.class, args);
	}

}
