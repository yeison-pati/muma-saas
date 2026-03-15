package com.muma.catalog.graphql;

import java.util.List;

public record CreateVariantInput(
        String variantId,
        String baseCode,
        String variantSapRef,
        String type,
        String comments,
        Integer quantity,
        String image,
        List<CreateComponentInput> components) {}
