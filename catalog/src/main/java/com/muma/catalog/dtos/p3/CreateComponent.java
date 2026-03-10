package com.muma.catalog.dtos.p3;

import java.util.UUID;

public record CreateComponent(
    UUID componentId,
    String componentSapRef,
    String componentValue
) {}