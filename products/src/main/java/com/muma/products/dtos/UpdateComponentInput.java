package com.muma.products.dtos;

import java.util.UUID;

public record UpdateComponentInput(
        UUID id,
        String sapRef,
        String sapCode,
        String name,
        String value) {
}
