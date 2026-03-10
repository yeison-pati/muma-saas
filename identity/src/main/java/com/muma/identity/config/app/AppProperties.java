package com.muma.identity.config.app;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app")
public record AppProperties (
    String publicEndpoint
) {
    
}
