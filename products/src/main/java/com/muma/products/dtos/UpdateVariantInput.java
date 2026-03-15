package com.muma.products.dtos;

import java.util.List;
import java.util.UUID;

public record UpdateVariantInput(
        UUID id,
        String sapRef,
        List<CreateBaseInitialComponentInput> components) {
}
