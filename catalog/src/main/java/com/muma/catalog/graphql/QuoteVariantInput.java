package com.muma.catalog.graphql;

public record QuoteVariantInput(
        String projectId,
        String variantId,
        String quoterId,
        String value,
        Integer elaborationTime,
        String criticalMaterial,
        Integer price) {}
