package com.muma.catalog.dtos.products;

import java.util.UUID;

public record CreateBase(
        String code,
        String name,
        String image,
        String model,
        String category,
        String subcategory,
        String space,
        String line,
        String baseMaterial,
        String creatorName,
        UUID creatorId,
        java.util.List<CreateBaseInitialVariant> initialVariants) {

    public CreateBase(String code, String name, String image, String category, String subcategory,
            String space, String line, String baseMaterial, String creatorName, UUID creatorId) {
        this(code, name, image, null, category, subcategory, space, line, baseMaterial, creatorName, creatorId, java.util.List.of());
    }
}
