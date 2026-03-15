package com.muma.products.services;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.muma.products.dtos.CreateComponentInput;
import com.muma.products.dtos.UpdateComponentInput;
import com.muma.products.models.Component;
import com.muma.products.models.Variant;
import com.muma.products.repositories.ComponentRepository;
import com.muma.products.repositories.VariantRepository;

import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
public class ComponentService {

    private final ComponentRepository componentRepository;
    private final VariantRepository variantRepository;

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
                        .build());
    }

    @Transactional
    public Component create(CreateComponentInput input) {
        Variant variant = variantRepository.findById(input.variantId())
                .orElseThrow(() -> new IllegalStateException("Variant not found"));
        String val = input.value() != null ? input.value() : "";
        return createForVariant(variant, input.sapRef(), input.sapCode(), input.name(), val, val);
    }

    public Optional<Component> findById(UUID id) {
        return componentRepository.findById(id);
    }

    public List<Component> findByVariantId(UUID variantId) {
        return componentRepository.findByVariantId(variantId);
    }

    @Transactional
    public Component update(UpdateComponentInput input) {
        Component comp = componentRepository.findById(input.id())
                .orElseThrow(() -> new IllegalStateException("Component not found"));
        if (input.sapRef() != null) comp.setSapRef(input.sapRef().trim());
        if (input.sapCode() != null) comp.setSapCode(input.sapCode().trim());
        if (input.name() != null) comp.setName(input.name().trim());
        if (input.value() != null) comp.setValue(input.value());
        return componentRepository.save(comp);
    }

    @Transactional
    public void delete(UUID id) {
        componentRepository.deleteById(id);
    }
}
