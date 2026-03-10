package com.muma.document.config.security;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.config.CorsRegistry;
import org.springframework.web.reactive.config.WebFluxConfigurer;

@Configuration
public class CorsConfig implements WebFluxConfigurer {

        @Override
        public void addCorsMappings(CorsRegistry registry) {

                registry.addMapping("/**")
                                .allowedOriginPatterns(
                                                "http://localhost:*",
                                                "http://127.0.0.1:*")

                                .allowedMethods(
                                                "GET",
                                                "POST",
                                                "PUT",
                                                "PATCH",
                                                "DELETE",
                                                "OPTIONS")
                                .allowedHeaders("*")
                                .allowCredentials(true) // OBLIGATORIO con "*"
                                .maxAge(3600);
        }
}
