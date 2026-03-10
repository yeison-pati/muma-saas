package com.muma.catalog.dtos.components;

import java.util.UUID;

public record ComponentIdValue(UUID componentId, String componentSapRef, String componentName, String value, Boolean modified) {}
