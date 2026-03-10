package com.muma.catalog.dtos.components;

import java.util.UUID;

public record CreateComponent(
    UUID componentId,
    String componentSapRef,
    String componentValue,
    Boolean modified,
    String componentName
) {}
