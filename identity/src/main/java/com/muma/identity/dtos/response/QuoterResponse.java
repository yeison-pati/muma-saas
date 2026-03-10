package com.muma.identity.dtos.response;

import java.io.Serializable;

public record QuoterResponse(
        UserResponse user,
        Integer quoted,
        Integer projects,
        Integer products) implements Serializable {
}