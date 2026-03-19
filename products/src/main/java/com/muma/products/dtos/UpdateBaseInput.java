package com.muma.products.dtos;

import java.util.UUID;

public record UpdateBaseInput(
        UUID id,
        String name,
        String category,
        String subcategory,
        String space,
        String line,
        String baseMaterial) {
}
