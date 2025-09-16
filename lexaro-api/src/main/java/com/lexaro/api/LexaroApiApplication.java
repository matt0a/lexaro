package com.lexaro.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class LexaroApiApplication {

	public static void main(String[] args) {
		SpringApplication.run(LexaroApiApplication.class, args);
	}

}
