package com.muma.catalog.dtos.components;

import java.util.UUID;

public record VariantComponentDTO(
        UUID variantId,
        UUID componentId,
        String componentSapRef,
        String componentName,
        String value) {
}
