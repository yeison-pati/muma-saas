package com.muma.catalog.dtos.products;

import java.util.List;
import java.util.UUID;


import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class BaseResponse {
    private UUID id;

    private String code; // identidad funcional

    private String name;
    private String image; // Key de la imagen
    private String model; // Key del modelo 3D
    private String category;
    private String subcategory;
    private String space;
    private String line;
    private String baseMaterial;
    List<VariantResponse> variants;
}
