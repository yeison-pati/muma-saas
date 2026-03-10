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
}
