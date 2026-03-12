package com.muma.catalog.dtos.products;

import java.util.List;
import java.util.UUID;

import com.muma.catalog.dtos.components.ComponentResponse;
import com.muma.catalog.models.VariantQuote;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ProjectVariantResponse {
    private UUID id;
    private String sapRef;
    private String sapCode;
    private String type;
    private String criticalMaterial;
    private String comments;
    private Integer elaborationTime;
    private Integer quantity;
    private Integer price;
    private List<ComponentResponse> components;
    private String baseCode;
    private String baseName;
    private String baseImage;
    private String category;
    private String subcategory;
    private String line;
    private String space;
    private boolean effective;

    public ProjectVariantResponse(UUID id, String sapRef, String sapCode, VariantQuote variantQuote, List<ComponentResponse> components,
            String baseCode, String baseName, String baseImage, String category, String subcategory, String line, String space) {
        this.id = id;
        this.sapRef = sapRef;
        this.sapCode = sapCode;
        this.type = variantQuote != null ? variantQuote.getType() : null;
        this.criticalMaterial = variantQuote != null ? variantQuote.getCriticalMaterial() : null;
        this.comments = variantQuote != null ? variantQuote.getComments() : null;
        this.elaborationTime = variantQuote != null ? variantQuote.getElaborationTime() : null;
        this.quantity = variantQuote != null ? variantQuote.getQuantity() : null;
        this.price = variantQuote != null ? variantQuote.getPrice() : null;
        this.effective = variantQuote != null && variantQuote.isEffective();
        this.components = components;
        this.baseCode = baseCode;
        this.baseName = baseName;
        this.baseImage = baseImage;
        this.category = category;
        this.subcategory = subcategory;
        this.line = line;
        this.space = space;
    }
}
