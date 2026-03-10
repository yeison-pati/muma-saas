package com.muma.catalog.graphql;

import java.util.List;

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
        String creatorId,
        List<CreateBaseInitialVariantInput> initialVariants) {}
