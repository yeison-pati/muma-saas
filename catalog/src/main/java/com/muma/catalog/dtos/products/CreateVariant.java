package com.muma.catalog.dtos.products;

import java.util.List;
import java.util.UUID;

import com.muma.catalog.dtos.components.CreateComponent;

public record CreateVariant(
    UUID variantId,
    String baseCode,
    String variantSapRef,
    String type,
    String comments,
    Integer quantity,
    String image,
    List<CreateComponent> components
) {}
