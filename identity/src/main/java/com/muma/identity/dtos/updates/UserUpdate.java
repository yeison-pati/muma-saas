package com.muma.identity.dtos.updates;

import java.util.UUID;

//CORREGIR eS IGUAL A REGISTER REQUEST
public record UserUpdate(
    UUID id,
    String name,
    String email,
    String phone,
    String password,
    String role,

    String jobTitle,
    Boolean isLeader
) {
}