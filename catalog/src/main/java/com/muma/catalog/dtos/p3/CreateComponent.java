package com.muma.catalog.dtos.p3;

import java.util.UUID;

/** P3: componentes manuales sin SAP. name obligatorio, value opcional. */
public record CreateComponent(
    UUID componentId,
    String componentName,
    String componentValue
) {}