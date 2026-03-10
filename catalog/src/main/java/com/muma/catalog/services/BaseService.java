package com.muma.catalog.services;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.muma.catalog.dtos.products.CreateBase;
import com.muma.catalog.dtos.products.CreateBaseInitialComponent;
import com.muma.catalog.dtos.products.CreateBaseInitialVariant;
import com.muma.catalog.models.Base;
import com.muma.catalog.models.Component;
import com.muma.catalog.models.ComponentValue;
import com.muma.catalog.models.Variant;
import com.muma.catalog.repositories.BaseRepo;

import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
public class BaseService {

    private final BaseRepo baseRepository;
    private final VariantService variantService;
    private final ComponentService componentService;

    @Transactional
    public Base create(CreateBase createBase) {
        Base base = baseRepository.save(
                Base.builder()
                        .id(UUID.randomUUID())
                        .code(createBase.code())
                        .name(createBase.name())
                        .image(createBase.image())
                        .model(createBase.model())
                        .category(createBase.category())
                        .subcategory(createBase.subcategory())
                        .space(createBase.space())
                        .line(createBase.line())
                        .baseMaterial(createBase.baseMaterial())
                        .creatorName(createBase.creatorName())
                        .creatorId(createBase.creatorId())
                        .createdAt(LocalDateTime.now())
                        .build());

        List<CreateBaseInitialVariant> initialVariants = createBase.initialVariants();
        if (initialVariants != null && !initialVariants.isEmpty()) {
            for (int i = 0; i < initialVariants.size(); i++) {
                createInitialVariant(base.getCode(), initialVariants.get(i), i + 1);
            }
        } else {
            createInitialVariant(base.getCode(), new CreateBaseInitialVariant(null, List.of()), 1);
        }
        return base;
    }

    private void createInitialVariant(String baseCode, CreateBaseInitialVariant iv, int variantIndex) {
        String sapRef = iv.sapRef() != null && !iv.sapRef().isBlank() ? iv.sapRef() : baseCode + "-V" + variantIndex;
        Variant variant = variantService.create(baseCode, sapRef);
        List<CreateBaseInitialComponent> components = iv.components();
        if (components != null && !components.isEmpty()) {
            List<ComponentValue> values = new ArrayList<>();
            for (CreateBaseInitialComponent c : components) {
                if (c.componentId() != null || hasSapRefOrCode(c.componentSapRef(), c.componentSapCode())) {
                    Component comp = componentService.findOrCreateForDesigner(c.componentId(), c.componentSapRef(), c.componentSapCode(), sapRef);
                    values.add(new ComponentValue(comp, c.componentValue() != null ? c.componentValue() : ""));
                }
            }
            variantService.updateComponentValues(variant.getId(), values);
        }
    }

    private static boolean hasSapRefOrCode(String sapRef, String sapCode) {
        return (sapRef != null && !sapRef.isBlank()) || (sapCode != null && !sapCode.isBlank());
    }

    public Optional<Base> findByCode(String code) {
        return baseRepository.findByCode(code);
    }

    public Base findOrCreate(CreateBase createBase) {
        return findByCode(createBase.code()).orElseGet(() -> create(createBase));
    }

    public List<Base> findAll() {
        return baseRepository.findAll();
    }

    public Optional<Base> findById(UUID id) {
        return baseRepository.findById(id);
    }

    @Transactional
    public Base update(UUID id, CreateBase updateDTO) {
        Base base = baseRepository.findById(id)
                .orElseThrow(() -> new IllegalStateException("Base not found"));
        base.setName(updateDTO.name());
        base.setImage(updateDTO.image());
        base.setModel(updateDTO.model());
        base.setCategory(updateDTO.category());
        base.setSubcategory(updateDTO.subcategory());
        base.setSpace(updateDTO.space());
        base.setLine(updateDTO.line());
        base.setBaseMaterial(updateDTO.baseMaterial());
        return baseRepository.save(base);
    }

    @Transactional
    public Base updateFields(UUID id, String name, String image, String model,
            String category, String subcategory, String space, String line, String baseMaterial) {
        Base base = baseRepository.findById(id)
                .orElseThrow(() -> new IllegalStateException("Base not found"));
        if (name != null) base.setName(name);
        if (image != null) base.setImage(image);
        if (model != null) base.setModel(model);
        if (category != null) base.setCategory(category);
        if (subcategory != null) base.setSubcategory(subcategory);
        if (space != null) base.setSpace(space);
        if (line != null) base.setLine(line);
        if (baseMaterial != null) base.setBaseMaterial(baseMaterial);
        return baseRepository.save(base);
    }

    @Transactional
    public void delete(UUID id) {
        baseRepository.deleteById(id);
    }
}
