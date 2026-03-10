package com.muma.catalog.graphql;

public record UpdateVariantQuoteQuantityInput(
        String projectId,
        String variantId,
        Integer quantity) {}
