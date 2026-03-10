package com.muma.identity.dtos.session;

public record LoginRequest(
    String email,
    String password
) {
}
