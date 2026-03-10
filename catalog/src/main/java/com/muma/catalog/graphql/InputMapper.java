package com.muma.catalog.graphql;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import com.muma.catalog.dtos.components.CreateComponent;
import com.muma.catalog.dtos.p3.CreateP3Request;
import com.muma.catalog.dtos.products.CreateBase;
import com.muma.catalog.dtos.products.CreateBaseInitialComponent;
import com.muma.catalog.dtos.products.CreateBaseInitialVariant;
import com.muma.catalog.dtos.products.CreateVariant;
import com.muma.catalog.dtos.projects.CreateProject;
import com.muma.catalog.dtos.products.QuoteVariant;

final class InputMapper {

    static CreateProject toCreateProject(CreateProjectInput input) {
        if (input == null) return null;
        List<CreateVariant> variants = input.variants() == null ? List.of()
                : input.variants().stream().map(InputMapper::toCreateVariant).collect(Collectors.toList());
        List<CreateP3Request> p3s = input.p3s() == null ? List.of()
                : input.p3s().stream().map(InputMapper::toP3).collect(Collectors.toList());
        return new CreateProject(
                input.name(),
                input.client(),
                input.region(),
                input.salesName(),
                input.salesEmail(),
                input.salesPhone(),
                input.salesSignature(),
                input.salesJobTitle(),
                input.salesId() != null ? UUID.fromString(input.salesId()) : null,
                input.quoterName(),
                input.quoterEmail(),
                input.quoterId() != null ? UUID.fromString(input.quoterId()) : null,
                variants,
                p3s);
    }

    private static CreateVariant toCreateVariant(CreateVariantInput in) {
        if (in == null) return null;
        List<CreateComponent> components = in.components() == null ? List.of()
                : in.components().stream().map(InputMapper::toComponent).collect(Collectors.toList());
        return new CreateVariant(
                in.variantId() != null ? UUID.fromString(in.variantId()) : null,
                in.baseCode(),
                in.variantSapRef(),
                in.type(),
                in.comments(),
                components);
    }

    private static CreateComponent toComponent(CreateComponentInput in) {
        if (in == null) return null;
        return new CreateComponent(
                in.componentId() != null ? UUID.fromString(in.componentId()) : null,
                in.componentSapRef(),
                in.componentValue(),
                Boolean.TRUE.equals(in.modified()),
                in.componentName());
    }

    private static CreateP3Request toP3(CreateP3Input in) {
        if (in == null) return null;
        List<com.muma.catalog.dtos.p3.CreateComponent> components = in.components() == null ? List.of()
                : in.components().stream().map(InputMapper::toP3Component).collect(Collectors.toList());
        return new CreateP3Request(components, in.comment(), in.image());
    }

    private static com.muma.catalog.dtos.p3.CreateComponent toP3Component(CreateComponentInput in) {
        if (in == null) return null;
        String name = (in.componentName() != null && !in.componentName().isBlank())
                ? in.componentName().trim()
                : (in.componentSapRef() != null ? in.componentSapRef().trim() : "component");
        return new com.muma.catalog.dtos.p3.CreateComponent(
                in.componentId() != null ? UUID.fromString(in.componentId()) : null,
                name,
                in.componentValue());
    }

    static QuoteVariant toQuoteVariant(QuoteVariantInput input) {
        if (input == null) return null;
        return new QuoteVariant(
                UUID.fromString(input.projectId()),
                UUID.fromString(input.variantId()),
                input.value(),
                input.elaborationTime(),
                input.criticalMaterial(),
                input.price(),
                UUID.fromString(input.quoterId()));
    }

    static CreateBase toCreateBase(CreateBaseInput input) {
        if (input == null) return null;
        List<CreateBaseInitialVariant> initialVariants = input.initialVariants() == null ? List.of()
                : input.initialVariants().stream()
                        .map(InputMapper::toCreateBaseInitialVariant)
                        .collect(Collectors.toList());
        return new CreateBase(
                input.code(),
                input.name(),
                input.image(),
                input.model(),
                input.category(),
                input.subcategory(),
                input.space(),
                input.line(),
                input.baseMaterial(),
                input.creatorName(),
                input.creatorId() != null ? UUID.fromString(input.creatorId()) : null,
                initialVariants);
    }

    private static CreateBaseInitialVariant toCreateBaseInitialVariant(CreateBaseInitialVariantInput in) {
        if (in == null) return null;
        List<CreateBaseInitialComponent> components = in.components() == null ? List.of()
                : in.components().stream()
                        .map(InputMapper::toCreateBaseInitialComponent)
                        .collect(Collectors.toList());
        return new CreateBaseInitialVariant(in.sapRef(), components);
    }

    static CreateBaseInitialComponent toCreateBaseInitialComponent(CreateBaseInitialComponentInput in) {
        if (in == null) return null;
        return new CreateBaseInitialComponent(
                in.componentId() != null ? UUID.fromString(in.componentId()) : null,
                in.componentName(),
                in.componentSapRef(),
                in.componentSapCode(),
                in.componentValue());
    }
}
