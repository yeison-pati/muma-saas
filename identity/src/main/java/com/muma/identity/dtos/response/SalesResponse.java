package com.muma.identity.dtos.response;

import java.io.Serializable;

public record SalesResponse(
    UserResponse user,
    Integer requested,
    Integer effective
) implements Serializable {
}