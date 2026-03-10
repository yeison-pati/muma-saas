package com.muma.catalog.dtos.products;

/**
 * Componente inicial para una variante al crear base.
 * componentId = existente; componentName = nombre display; componentSapRef/componentSapCode = SAP (independiente del nombre).
 */
public record CreateBaseInitialComponent(
        java.util.UUID componentId,
        String componentName,
        String componentSapRef,
        String componentSapCode,
        String componentValue) {}
