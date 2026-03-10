package com.muma.catalog.dtos.products;

import java.util.List;
import java.util.UUID;

import com.muma.catalog.dtos.components.ComponentResponse;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class VariantResponse {
    private UUID id;
    private String sapRef;
    private String sapCode;
    private List<ComponentResponse> components;
}
