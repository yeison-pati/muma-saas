package com.muma.catalog.dtos.products;

import java.util.UUID;

public record QuoteVariant(
    UUID projectId,
    UUID variantId,
    String value,
    Integer elaborationTime,
    String criticalMaterial,
    Integer price,
    UUID quoterId
) {
    
}
