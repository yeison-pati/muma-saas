package com.muma.identity.dtos.response;

import java.io.Serializable;

public record DesignerResponse(
    UserResponse user,
    Integer created,
    Integer edited
) implements Serializable {
}