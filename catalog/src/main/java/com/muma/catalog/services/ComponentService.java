package com.muma.catalog.services;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.muma.catalog.models.Component;
import com.muma.catalog.models.Variant;
import com.muma.catalog.models.VariantQuote;
import com.muma.catalog.repositories.ComponentRepo;

import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
public class ComponentService {

    private final ComponentRepo componentRepository;

    /**
     * Crea componente para una Variant del catálogo (diseñador).
     * value y originalValue iguales si es nuevo.
     */
    @Transactional
    public Component createForVariant(Variant variant, String sapRef, String sapCode, String name, String value, String originalValue) {
        String ref = (sapRef != null && !sapRef.isBlank()) ? sapRef.trim() : "c-" + UUID.randomUUID();
        String code = (sapCode != null && !sapCode.isBlank()) ? sapCode.trim() : ref;
        String display = (name != null && !name.isBlank()) ? name.trim() : ref;
        String val = value != null ? value : "";
        String orig = originalValue != null ? originalValue : val;
        return componentRepository.save(
                Component.builder()
                        .id(UUID.randomUUID())
                        .sapRef(ref)
                        .sapCode(code)
                        .name(display)
                        .value(val)
                        .originalValue(orig)
                        .variant(variant)
                        .variantQuote(null)
                        .build());
    }

    /**
     * Crea override de componente en VariantQuote (edición en proyecto).
     * Conserva sapRef del original; sapCode se oculta si value != originalValue.
     */
    @Transactional
    public Component createOverride(VariantQuote variantQuote, String sapRef, String name, String value, String originalValue) {
        String ref = (sapRef != null && !sapRef.isBlank()) ? sapRef.trim() : "override-" + UUID.randomUUID();
        String display = (name != null && !name.isBlank()) ? name.trim() : ref;
        String val = value != null ? value : "";
        String orig = originalValue != null ? originalValue : val;
        return componentRepository.save(
                Component.builder()
                        .id(UUID.randomUUID())
                        .sapRef(ref)
                        .sapCode(null)
                        .name(display)
                        .value(val)
                        .originalValue(orig)
                        .variant(null)
                        .variantQuote(variantQuote)
                        .build());
    }

    /**
     * Crea componente P3 (sin SAP) para variante de proyecto.
     */
    @Transactional
    public Component createForP3Variant(Variant variant, String name, String value) {
        String display = (name != null && !name.isBlank()) ? name.trim() : "p3-" + UUID.randomUUID();
        String val = value != null ? value : "";
        return componentRepository.save(
                Component.builder()
                        .id(UUID.randomUUID())
                        .sapRef(null)
                        .sapCode(null)
                        .name(display)
                        .value(val)
                        .originalValue(val)
                        .variant(variant)
                        .variantQuote(null)
                        .build());
    }

    @Transactional
    public Component save(Component component) {
        return componentRepository.save(component);
    }

    public Optional<Component> findById(UUID id) {
        return componentRepository.findById(id);
    }

    /** Busca original por id en la lista de componentes de la variante. */
    public static Optional<Component> findOriginalById(List<Component> originals, UUID id) {
        if (originals == null || id == null) return Optional.empty();
        return originals.stream().filter(c -> id.equals(c.getId())).findFirst();
    }

    /** Busca original por sapRef. */
    public static Optional<Component> findOriginalBySapRef(List<Component> originals, String sapRef) {
        if (originals == null || sapRef == null || sapRef.isBlank()) return Optional.empty();
        String r = sapRef.trim();
        return originals.stream().filter(c -> r.equals(c.getSapRef())).findFirst();
    }
}
