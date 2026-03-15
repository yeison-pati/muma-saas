package com.muma.products.dtos;

import java.util.List;
import java.util.UUID;

public record CreateBaseInput(
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
        List<CreateBaseInitialVariantInput> initialVariants) {
}
