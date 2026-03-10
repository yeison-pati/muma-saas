package com.muma.identity.dtos.auth;

import com.muma.identity.dtos.response.UserResponse;

public record TokenResponse(
        UserResponse user,
        String token) {
}