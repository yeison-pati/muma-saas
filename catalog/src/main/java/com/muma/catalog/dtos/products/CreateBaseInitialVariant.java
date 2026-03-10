package com.muma.catalog.dtos.products;

import java.util.List;

/**
 * Variante inicial al crear una base.
 * Incluye componentes con nombre y valor.
 */
public record CreateBaseInitialVariant(
        String sapRef,
        List<CreateBaseInitialComponent> components) {
}
