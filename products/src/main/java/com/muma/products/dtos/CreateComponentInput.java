package com.muma.products.dtos;

import java.util.UUID;

public record CreateComponentInput(
        UUID variantId,
        String sapRef,
        String sapCode,
        String name,
        String value) {
}
