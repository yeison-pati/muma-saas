package com.muma.catalog.graphql;

import java.util.List;

public record UpdateVariantAndReopenInput(
    String projectId,
    String variantId,
    Integer quantity,
    String comments,
    String type,
    List<ComponentIdValueInput> components
) {}
