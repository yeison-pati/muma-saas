package com.muma.products.dtos;

import java.util.List;
import java.util.UUID;

public record CreateVariantInput(
        UUID baseId,
        String sapRef,
        String image,
        String model,
        List<CreateBaseInitialComponentInput> components) {
}
