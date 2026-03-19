package com.muma.products.dtos;

import java.util.List;

public record CreateBaseInitialVariantInput(
        String sapRef,
        String image,
        String model,
        List<CreateBaseInitialComponentInput> components) {
}
