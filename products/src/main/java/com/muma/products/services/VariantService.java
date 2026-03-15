package com.muma.products.services;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.muma.products.dtos.CreateBaseInitialComponentInput;
import com.muma.products.dtos.CreateVariantInput;
import com.muma.products.dtos.UpdateVariantInput;
import com.muma.products.models.Base;
import com.muma.products.models.Component;
import com.muma.products.models.Variant;
import com.muma.products.repositories.BaseRepository;
import com.muma.products.repositories.VariantRepository;

import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
public class VariantService {

    private final VariantRepository variantRepository;
    private final BaseRepository baseRepository;
    private final ComponentService componentService;

    @Transactional
    public Variant create(Base base, String sapRef) {
        return variantRepository.save(
                Variant.builder()
                        .id(UUID.randomUUID())
                        .base(base)
                        .sapRef(sapRef)
                        .sapCode((sapRef != null && !sapRef.isBlank()) ? sapRef : null)
                        .status("DRAFT")
                        .build());
    }

    @Transactional
    public Variant create(CreateVariantInput input) {
        Base base = baseRepository.findById(input.baseId())
                .orElseThrow(() -> new IllegalStateException("Base not found"));
        long count = variantRepository.countByBaseId(base.getId());
        String sapRef = input.sapRef() != null && !input.sapRef().isBlank()
                ? input.sapRef()
                : base.getCode() + "-V" + (count + 1);
        Variant variant = create(base, sapRef);
        List<CreateBaseInitialComponentInput> components = input.components();
        if (components != null && !components.isEmpty()) {
            List<Component> comps = new ArrayList<>();
            for (CreateBaseInitialComponentInput c : components) {
                if (c.componentId() == null && !hasSapRefOrCode(c.componentSapRef(), c.componentSapCode())) continue;
                String sapRefC, sapCode, name;
                if (c.componentId() != null) {
                    var orig = componentService.findById(c.componentId()).orElse(null);
                    sapRefC = orig != null ? orig.getSapRef() : (c.componentSapRef() != null ? c.componentSapRef() : sapRef + "-c");
                    sapCode = orig != null ? orig.getSapCode() : (c.componentSapCode() != null ? c.componentSapCode() : sapRefC);
                    name = orig != null ? orig.getName() : (c.componentName() != null && !c.componentName().isBlank() ? c.componentName().trim() : sapRefC);
                } else {
                    sapCode = c.componentSapCode() != null && !c.componentSapCode().isBlank()
                            ? c.componentSapCode().trim()
                            : (c.componentSapRef() != null ? c.componentSapRef().trim() : sapRef + "-c");
                    sapRefC = c.componentSapRef() != null ? c.componentSapRef().trim() : sapCode;
                    name = (c.componentName() != null && !c.componentName().isBlank()) ? c.componentName().trim() : sapRefC;
                }
                String val = c.componentValue() != null ? c.componentValue() : "";
                comps.add(componentService.createForVariant(variant, sapRefC, sapCode, name, val, val));
            }
            setComponents(variant.getId(), comps);
        }
        return findByIdWithComponents(variant.getId()).orElse(variant);
    }

    private static boolean hasSapRefOrCode(String sapRef, String sapCode) {
        return (sapRef != null && !sapRef.isBlank()) || (sapCode != null && !sapCode.isBlank());
    }

    @Transactional
    public Variant update(UpdateVariantInput input) {
        Variant variant = variantRepository.findByIdWithComponents(input.id())
                .orElseThrow(() -> new IllegalStateException("Variant not found"));
        if (input.sapRef() != null) {
            String ref = input.sapRef().isBlank() ? null : input.sapRef().trim();
            variant.setSapRef(ref);
            variant.setSapCode(ref);
        }
        if (input.components() != null) {
            variant.getComponents().clear();
            for (CreateBaseInitialComponentInput c : input.components()) {
                if (c.componentId() == null && !hasSapRefOrCode(c.componentSapRef(), c.componentSapCode())) continue;
                String sapRefC, sapCode, name, val;
                if (c.componentId() != null) {
                    var orig = componentService.findById(c.componentId()).orElse(null);
                    sapRefC = orig != null ? orig.getSapRef() : (c.componentSapRef() != null ? c.componentSapRef() : variant.getSapRef() + "-c");
                    sapCode = orig != null ? orig.getSapCode() : (c.componentSapCode() != null ? c.componentSapCode() : sapRefC);
                    name = orig != null ? orig.getName() : (c.componentName() != null && !c.componentName().isBlank() ? c.componentName().trim() : sapRefC);
                    val = orig != null ? orig.getValue() : (c.componentValue() != null ? c.componentValue() : "");
                } else {
                    sapCode = c.componentSapCode() != null && !c.componentSapCode().isBlank()
                            ? c.componentSapCode().trim()
                            : (c.componentSapRef() != null ? c.componentSapRef().trim() : variant.getSapRef() + "-c");
                    sapRefC = c.componentSapRef() != null ? c.componentSapRef().trim() : sapCode;
                    name = (c.componentName() != null && !c.componentName().isBlank()) ? c.componentName().trim() : sapRefC;
                    val = c.componentValue() != null ? c.componentValue() : "";
                }
                Component comp = componentService.createForVariant(variant, sapRefC, sapCode, name, val, val);
                variant.getComponents().add(comp);
            }
        }
        return variantRepository.save(variant);
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

    public List<Variant> findByBaseId(UUID baseId) {
        return variantRepository.findByBaseIdWithComponents(baseId);
    }

    @Transactional
    public void deleteById(UUID id) {
        variantRepository.deleteById(id);
    }

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
