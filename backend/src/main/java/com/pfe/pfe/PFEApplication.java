package com.pfe.pfe;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableAsync           // Pour les notifications asynchrones
@EnableScheduling      // Pour les tâches planifiées (rappels, etc)
@EnableCaching        // Pour mettre en cache les données
public class PFEApplication {

	public static void main(String[] args) {
		SpringApplication.run(PFEApplication.class, args);
	}

}
