package com.muma.catalog.services;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.muma.catalog.models.Component;
import com.muma.catalog.models.Variant;
import com.muma.catalog.repositories.VariantRepo;

import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
public class VariantService {

    private final VariantRepo variantRepository;

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

    /**
     * Reemplaza los componentes de la variante.
     * Los componentes deben tener variant ya asignada (p. ej. desde ComponentService.createForVariant).
     */
    @Transactional
    public Variant setComponents(UUID variantId, List<Component> components) {
        Variant variant = variantRepository.findById(variantId)
                .orElseThrow(() -> new IllegalStateException("Variant not found"));
        variant.getComponents().clear();
        if (components != null) {
            for (Component c : components) {
                c.setVariant(variant);
                variant.getComponents().add(c);
            }
        }
        return variantRepository.save(variant);
    }

    /**
     * Clona una variante (solo metadatos; componentes se asignan aparte).
     * Usado para P1/P2/P3 cuando se necesita copia por proyecto.
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
                        .sourceVariantId(source.getId())
                        .build());
    }

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
