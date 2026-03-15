package com.muma.products.dtos;

import java.util.UUID;

public record CreateBaseInitialComponentInput(
        UUID componentId,
        String componentName,
        String componentSapRef,
        String componentSapCode,
        String componentValue) {
}
