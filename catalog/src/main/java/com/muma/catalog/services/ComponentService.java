package com.muma.catalog.services;

import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.muma.catalog.models.Component;
import com.muma.catalog.repositories.ComponentRepo;

import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
public class ComponentService {

    private final ComponentRepo componentRepository;

    /**
     * Crea componente desde diseñador.
     * name = componentSapRef (nombre para mostrar).
     * sapRef y sapCode = códigos reales. Si componentSapCode viene, usarlo para ambos.
     * Si no, generar sapRef = variantSapRef + "-" + componentSapRef para no usar el nombre como código.
     */
    @Transactional
    public Component createForDesigner(String sapRef, String componentSapCode, String variantSapRef) {
        String name = sapRef != null && !sapRef.isBlank() ? sapRef.trim() : "component-" + UUID.randomUUID();
        String code;
        if (componentSapCode != null && !componentSapCode.isBlank()) {
            code = componentSapCode.trim();
        } else {
            code = (variantSapRef != null && !variantSapRef.isBlank())
                    ? variantSapRef.trim() + "-" + name
                    : name;
        }
        return componentRepository.save(
                Component.builder()
                        .id(UUID.randomUUID())
                        .sapRef(code)
                        .sapCode(code)
                        .name(name)
                        .build());
    }

    /**
     * Crea componente desde P3: sin sapRef ni sapCode.
     */
    @Transactional
    public Component createForP3(String name) {
        String display = name != null && !name.isBlank() ? name : "component-" + UUID.randomUUID();
        return componentRepository.save(
                Component.builder()
                        .id(UUID.randomUUID())
                        .sapRef(null)
                        .sapCode(null)
                        .name(display)
                        .build());
    }

    public Optional<Component> findById(UUID id) {
        return componentRepository.findById(id);
    }

    /**
     * Crea una nueva instancia de componente con los códigos indicados.
     * Usado cuando se edita un componente: no modifica el original para no afectar otras variantes.
     */
    @Transactional
    public Component createCopyWithCodes(String name, String sapRef, String sapCode) {
        String ref = sapRef != null && !sapRef.isBlank() ? sapRef.trim() : name;
        String code = sapCode != null && !sapCode.isBlank() ? sapCode.trim() : ref;
        String displayName = name != null && !name.isBlank() ? name.trim() : "component-" + UUID.randomUUID();
        return componentRepository.save(
                Component.builder()
                        .id(UUID.randomUUID())
                        .name(displayName)
                        .sapRef(code)
                        .sapCode(code)
                        .build());
    }

    /**
     * Flujo diseñador: reutiliza solo por ID o crea nuevo. Nunca modifica componentes existentes.
     * Si componentId != null y hay nuevos códigos: crea NUEVA instancia (no actualiza la original).
     * Si componentId != null y no hay cambios: reutiliza el existente.
     * Si componentId == null: crea nuevo (requiere componentSapRef o componentSapCode).
     */
    public Component findOrCreateForDesigner(UUID componentId, String componentSapRef, String componentSapCode, String variantSapRef) {
        if (componentId != null) {
            Component comp = findById(componentId).orElseThrow(() -> new IllegalStateException("Component not found: " + componentId));
            String code = (componentSapCode != null && !componentSapCode.isBlank()) ? componentSapCode.trim()
                    : (componentSapRef != null && !componentSapRef.isBlank()) ? componentSapRef.trim() : null;
            if (code != null) {
                String name = comp.getName() != null && !comp.getName().isBlank() ? comp.getName() : (comp.getSapRef() != null ? comp.getSapRef() : code);
                return createCopyWithCodes(name, code, code);
            }
            return comp;
        }
        String code = (componentSapCode != null && !componentSapCode.isBlank()) ? componentSapCode.trim() : null;
        String ref = (componentSapRef != null && !componentSapRef.isBlank()) ? componentSapRef.trim() : null;
        if (code != null || ref != null) {
            return createForDesigner(ref != null ? ref : (code != null ? code : ""), componentSapCode, variantSapRef);
        }
        throw new IllegalArgumentException("Se requiere componentId o (componentSapRef/componentSapCode) para crear");
    }

    /**
     * Flujo P3: reutiliza solo por ID o crea nuevo. No busca por nombre.
     */
    public Component findOrCreateForP3(UUID componentId, String componentSapRef) {
        if (componentId != null) {
            return findById(componentId).orElseThrow(() -> new IllegalStateException("Component not found: " + componentId));
        }
        if (componentSapRef != null && !componentSapRef.isBlank()) {
            return createForP3(componentSapRef.trim());
        }
        throw new IllegalArgumentException("Se requiere componentId o componentSapRef para crear");
    }

    /**
     * Flujo comercial (variante estándar): reutiliza por ID o crea con sapRef + sapCode de la variante.
     * No hay componentSapCode del diseñador, se usa variantSapRef.
     */
    public Component findOrCreateForVariant(UUID componentId, String componentSapRef, String variantSapRef) {
        return findOrCreateForDesigner(componentId, componentSapRef, null, variantSapRef);
    }

    /**
     * Crea nueva instancia de componente para proyecto con valor editado.
     * sapRef del original, sapCode=null, name del original. No modifica el componente original.
     */
    @Transactional
    public Component createForModifiedVariant(String sapRefFromOriginal, String nameFromOriginal) {
        String ref = (sapRefFromOriginal != null && !sapRefFromOriginal.isBlank())
                ? sapRefFromOriginal.trim()
                : "modified-" + UUID.randomUUID();
        String name = (nameFromOriginal != null && !nameFromOriginal.isBlank())
                ? nameFromOriginal.trim()
                : ref;
        return componentRepository.save(
                Component.builder()
                        .id(UUID.randomUUID())
                        .sapRef(ref)
                        .sapCode(null)
                        .name(name)
                        .build());
    }
}
