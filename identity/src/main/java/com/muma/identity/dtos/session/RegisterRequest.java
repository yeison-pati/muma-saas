package com.muma.identity.dtos.session;

//CORREGIR no va id, ES IGUAL A user update
public record RegisterRequest(
    String name,
    String email,
    String phone,
    String password,
    String role,

    String jobTitle,
    Boolean isLeader,
    String creator
) {
}
