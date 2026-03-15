package com.muma.products.services;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.muma.products.dtos.CreateBaseInput;
import com.muma.products.dtos.CreateBaseInitialComponentInput;
import com.muma.products.dtos.CreateBaseInitialVariantInput;
import com.muma.products.dtos.UpdateBaseInput;
import com.muma.products.models.Base;
import com.muma.products.models.Component;
import com.muma.products.models.Variant;
import com.muma.products.repositories.BaseRepository;

import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
public class BaseService {

    private final BaseRepository baseRepository;
    private final VariantService variantService;
    private final ComponentService componentService;

    @Transactional
    public Base create(CreateBaseInput input) {
        Base base = baseRepository.save(
                Base.builder()
                        .id(UUID.randomUUID())
                        .code(input.code())
                        .name(input.name())
                        .image(input.image())
                        .model(input.model())
                        .category(input.category())
                        .subcategory(input.subcategory())
                        .space(input.space())
                        .line(input.line())
                        .baseMaterial(input.baseMaterial())
                        .creatorName(input.creatorName())
                        .creatorId(input.creatorId())
                        .createdAt(LocalDateTime.now())
                        .build());

        List<CreateBaseInitialVariantInput> initialVariants = input.initialVariants();
        if (initialVariants != null && !initialVariants.isEmpty()) {
            for (int i = 0; i < initialVariants.size(); i++) {
                createInitialVariant(base, initialVariants.get(i), i + 1);
            }
        } else {
            createInitialVariant(base, new CreateBaseInitialVariantInput(null, List.of()), 1);
        }
        return base;
    }

    private void createInitialVariant(Base base, CreateBaseInitialVariantInput iv, int variantIndex) {
        String sapRef = iv.sapRef() != null && !iv.sapRef().isBlank()
                ? iv.sapRef()
                : base.getCode() + "-V" + variantIndex;
        Variant variant = variantService.create(base, sapRef);
        List<CreateBaseInitialComponentInput> components = iv.components();
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
            variantService.setComponents(variant.getId(), comps);
        }
    }

    private static boolean hasSapRefOrCode(String sapRef, String sapCode) {
        return (sapRef != null && !sapRef.isBlank()) || (sapCode != null && !sapCode.isBlank());
    }

    public Optional<Base> findByCode(String code) {
        return baseRepository.findByCode(code);
    }

    public List<Base> findAll() {
        return baseRepository.findAll();
    }

    public Optional<Base> findById(UUID id) {
        return baseRepository.findById(id);
    }

    @Transactional
    public Base update(UpdateBaseInput input) {
        Base base = baseRepository.findById(input.id())
                .orElseThrow(() -> new IllegalStateException("Base not found"));
        if (input.name() != null) base.setName(input.name());
        if (input.image() != null) base.setImage(input.image());
        if (input.model() != null) base.setModel(input.model());
        if (input.category() != null) base.setCategory(input.category());
        if (input.subcategory() != null) base.setSubcategory(input.subcategory());
        if (input.space() != null) base.setSpace(input.space());
        if (input.line() != null) base.setLine(input.line());
        if (input.baseMaterial() != null) base.setBaseMaterial(input.baseMaterial());
        return baseRepository.save(base);
    }

    @Transactional
    public void delete(UUID id) {
        Base base = baseRepository.findById(id)
                .orElseThrow(() -> new IllegalStateException("Base not found"));
        baseRepository.delete(base);
    }
}
