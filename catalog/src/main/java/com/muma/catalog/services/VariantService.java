package com.muma.catalog.services;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.muma.catalog.models.ComponentValue;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.muma.catalog.models.ComponentValue;
import com.muma.catalog.models.Variant;
import com.muma.catalog.repositories.VariantRepo;

import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
public class VariantService {

    private final VariantRepo variantRepository;

    /**
     * Crea una variante. baseCode: código de la base (imágenes, etc.), null solo para P3.
     * sapRef/sapCode: SAP que asigna el diseñador; si sapRef viene, sapCode = sapRef inicialmente.
     */
    @Transactional
    public Variant create(String baseCode, String sapRef) {
        return variantRepository.save(
                Variant.builder()
                        .id(UUID.randomUUID())
                        .baseCode(baseCode)
                        .sapRef(sapRef)
                        .sapCode((sapRef != null && !sapRef.isBlank()) ? sapRef : null)
                        .status("DRAFT")
                        .build());
    }

    public Optional<Variant> findById(UUID id) {
        return variantRepository.findById(id);
    }

    public Optional<Variant> findByIdWithComponents(UUID id) {
        return variantRepository.findByIdWithComponents(id);
    }

    public List<Variant> findAll() {
        return variantRepository.findAll();
    }

    public List<Variant> findAllWithComponents() {
        return variantRepository.findAllWithComponents();
    }

    public List<Variant> findByBaseCode(String baseCode) {
        return variantRepository.findByBaseCodeWithComponents(baseCode);
    }

    @Transactional
    public void deleteById(UUID id) {
        variantRepository.deleteById(id);
    }

    @Transactional
    public void modifyComponentValue(UUID variantId, UUID componentId, String value) {
        Variant variant = variantRepository.findById(variantId)
                .orElseThrow(() -> new IllegalStateException("Variant not found"));
        variant.getComponentValues().stream()
                .filter(cv -> cv.getComponent().getId().equals(componentId))
                .findFirst()
                .ifPresent(cv -> cv.setValue(value));
        variantRepository.save(variant);
    }

    @Transactional
    public Variant updateComponentValues(UUID variantId, List<ComponentValue> values) {
        Variant variant = variantRepository.findById(variantId)
                .orElseThrow(() -> new IllegalStateException("Variant not found"));
        variant.getComponentValues().clear();
        variant.getComponentValues().addAll(values);
        return variantRepository.save(variant);
    }

    /**
     * Clona una variante: crea nueva entidad con mismo baseCode, sapRef, sapCode.
     * Los component values se asignan después en processStandardVariant.
     * Usado al añadir variante a proyecto para que cada proyecto tenga su propia copia.
     */
    @Transactional
    public Variant cloneVariant(Variant source) {
        return variantRepository.save(
                Variant.builder()
                        .id(UUID.randomUUID())
                        .baseCode(source.getBaseCode())
                        .sapRef(source.getSapRef())
                        .sapCode(source.getSapCode())
                        .status(source.getStatus())
                        .build());
    }

    /**
     * Actualiza sapRef y sapCode de la variante. Al editar el SAP, ambos se sincronizan.
     */
    @Transactional
    public Variant updateSapRef(UUID variantId, String sapRef) {
        Variant variant = variantRepository.findById(variantId)
                .orElseThrow(() -> new IllegalStateException("Variant not found"));
        String ref = (sapRef != null && !sapRef.isBlank()) ? sapRef.trim() : null;
        variant.setSapRef(ref);
        variant.setSapCode(ref);
        return variantRepository.save(variant);
    }
}
