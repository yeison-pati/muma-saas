package com.muma.catalog.dtos.products;

/**
 * Componente inicial para una variante al crear base.
 * componentId = existente; componentSapRef = ref para buscar o crear.
 * componentSapCode = código SAP que asigna el diseñador (va a sapCode del Component).
 * componentValue = valor (ej: Rojo, Mate).
 */
public record CreateBaseInitialComponent(
        java.util.UUID componentId,
        String componentSapRef,
        String componentSapCode,
        String componentValue) {}
