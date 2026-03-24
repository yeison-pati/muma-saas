package com.muma.identity.graphql;

public record UserUpdateInput(
        String id,
        String name,
        String email,
        String phone,
        String password,
        String role,

        String jobTitle,
        Boolean isLeader) {
}
