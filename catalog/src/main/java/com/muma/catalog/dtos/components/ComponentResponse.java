package com.muma.catalog.dtos.components;

import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ComponentResponse {
    private UUID id;
    private String sapRef;
    private String sapCode;
    private String name;
    private String value;
    /** Valor original; si value != originalValue, no mostrar sapCode (solo sapRef) */
    private String originalValue;
    /** Valor original del catálogo (variant). Usar para "revertir y tener 2 códigos" cuando hay override. */
    private String catalogOriginalValue;
}
