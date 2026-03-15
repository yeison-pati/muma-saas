package com.muma.products.controllers;

import java.util.Optional;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.muma.products.models.Base;
import com.muma.products.services.BaseService;

import lombok.RequiredArgsConstructor;

/**
 * REST API para que Catalog consuma bases (imágenes, metadatos).
 */
@RestController
@RequestMapping("/bases")
@RequiredArgsConstructor
public class BaseApiController {

    private final BaseService baseService;

    @GetMapping("/code/{code}")
    public ResponseEntity<BaseResponse> getBaseByCode(@PathVariable String code) {
        return baseService.findByCode(code)
                .map(b -> ResponseEntity.ok(new BaseResponse(
                        b.getId(),
                        b.getCode(),
                        b.getName(),
                        b.getImage(),
                        b.getCategory(),
                        b.getSubcategory(),
                        b.getLine(),
                        b.getSpace())))
                .orElse(ResponseEntity.notFound().build());
    }

    public record BaseResponse(UUID id, String code, String name, String image,
            String category, String subcategory, String line, String space) {}
}
