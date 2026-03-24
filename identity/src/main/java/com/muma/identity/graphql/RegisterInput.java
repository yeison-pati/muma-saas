package com.muma.identity.graphql;

public record RegisterInput(
        String name,
        String email,
        String phone,
        String password,
        String role,

        String jobTitle,
        Boolean isLeader,
        String creator) {
}
