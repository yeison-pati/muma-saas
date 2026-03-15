package com.muma.products.controllers;

import java.util.List;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.muma.products.services.VariantService;

import lombok.RequiredArgsConstructor;

/**
 * REST API para que Catalog consuma variantes originales (comparación, copias).
 */
@RestController
@RequestMapping("/variants")
@RequiredArgsConstructor
public class VariantApiController {

    private static final Logger log = LoggerFactory.getLogger(VariantApiController.class);

    private final VariantService variantService;

    @GetMapping("/{id}")
    public ResponseEntity<VariantResponse> getVariant(@PathVariable UUID id) {
        log.info("[VariantApi] GET /variants/{}", id);
        var opt = variantService.findByIdWithComponents(id);
        if (opt.isEmpty()) {
            log.warn("[VariantApi] GET /variants/{} NOT FOUND", id);
            return ResponseEntity.notFound().build();
        }
        var v = opt.get();
        var comps = v.getComponents().stream()
                .map(c -> new ComponentDto(c.getId(), c.getSapRef(), c.getSapCode(),
                        c.getName(), c.getValue(), c.getOriginalValue()))
                .toList();
        var base = v.getBase();
        log.info("[VariantApi] GET /variants/{} found baseCode={}", id, base != null ? base.getCode() : null);
        return ResponseEntity.ok(new VariantResponse(
                v.getId(),
                base != null ? base.getCode() : null,
                v.getSapRef(),
                v.getSapCode(),
                comps,
                base != null ? base.getName() : null,
                base != null ? base.getImage() : null,
                base != null ? base.getCategory() : null,
                base != null ? base.getSubcategory() : null,
                base != null ? base.getLine() : null,
                base != null ? base.getSpace() : null));
    }

    public record VariantResponse(UUID id, String baseCode, String sapRef, String sapCode, List<ComponentDto> components,
            String baseName, String baseImage, String category, String subcategory, String line, String space) {}
    public record ComponentDto(UUID id, String sapRef, String sapCode, String name, String value, String originalValue) {}
}
