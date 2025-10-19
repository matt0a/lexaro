package com.lexaro.api;

import com.lexaro.api.config.FeaturesProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
@EnableConfigurationProperties(FeaturesProperties.class)
public class LexaroApiApplication {

	public static void main(String[] args) {
		SpringApplication.run(LexaroApiApplication.class, args);
	}

}
