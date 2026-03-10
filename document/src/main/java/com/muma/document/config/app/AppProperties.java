package com.muma.document.config.app;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "storage")
public record AppProperties (S3 s3, Images images) {

    public record S3 (
        String endpoint,
        String publicEndpoint,
        String user,
        String pass,
        Buckets buckets
    ) {
        public record Buckets (
            String images,
            String models
        ) {}
    }

    /**
     * Base URL pública que envía el front (ej. http://localhost:8000/images).
     * Base interna: host que el contenedor document SÍ puede alcanzar (ej. http://caddy:8000/images).
     * Desde dentro del contenedor, localhost apunta al propio contenedor, no al host.
     */
    public record Images(String publicBaseUrl, String internalBaseUrl) {}
}
