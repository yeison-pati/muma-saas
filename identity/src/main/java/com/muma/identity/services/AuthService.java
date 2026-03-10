package com.muma.identity.services;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.muma.identity.dtos.auth.TokenResponse;
import com.muma.identity.dtos.response.UserResponse;
import com.muma.identity.exception.AuthException;
import com.muma.identity.repositories.UserRepository;
import com.muma.identity.services.auth.JwtService;

import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public TokenResponse signIn(String email, String rawPassword) {
        var user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AuthException("Credenciales inválidas"));
        if (!passwordEncoder.matches(rawPassword, user.getPassword())) {
            throw new AuthException("Credenciales inválidas");
        }
        return new TokenResponse(
                new UserResponse(user),
                jwtService.generateToken(user));
    }
}
