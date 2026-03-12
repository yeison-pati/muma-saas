package com.muma.document.config.security;

import java.util.Collection;
import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import reactor.core.publisher.Mono;

@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

        @Bean
        public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {

                http
                                .cors(cors -> {
                                })
                                .csrf(csrf -> csrf.disable())
                                .headers(headers -> headers
                                                .contentSecurityPolicy(
                                                                csp -> csp.policyDirectives("default-src 'self'"))
                                                .frameOptions(frame -> frame.disable()))
                                .authorizeExchange(auth -> auth
                                                .pathMatchers(HttpMethod.OPTIONS).permitAll()
                                                .pathMatchers("/mediaFiles/**")
                                                .hasAnyRole("ADMIN", "QUOTER", "DESIGNER", "SALES", "DEVELOPMENT")
                                                .pathMatchers("/files/**").hasRole("SALES")
                                                .anyExchange().authenticated())
                                .oauth2ResourceServer(oauth2 -> oauth2
                                                .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthConverter())));

                return http.build();
        }

        @Bean
        public Converter<Jwt, Mono<AbstractAuthenticationToken>> jwtAuthConverter() {

                return jwt -> {
                        List<String> roles = jwt.getClaimAsStringList("roles");

                        Collection<? extends GrantedAuthority> authorities = roles == null
                                        ? List.of()
                                        : roles.stream()
                                                        .map(role -> "ROLE_" + role)
                                                        .map(SimpleGrantedAuthority::new)
                                                        .toList();
                        ;

                        return Mono.just(
                                        new JwtAuthenticationToken(jwt, authorities));
                };
        }
}
