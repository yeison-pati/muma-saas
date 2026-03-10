package com.muma.catalog.graphql;

public record UpdateBaseInput(
        String id,
        String name,
        String image,
        String model,
        String category,
        String subcategory,
        String space,
        String line,
        String baseMaterial) {}
