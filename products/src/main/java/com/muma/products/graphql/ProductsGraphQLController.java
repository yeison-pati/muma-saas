package com.muma.products.graphql;

import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

import com.muma.products.dtos.CreateBaseInitialComponentInput;
import com.muma.products.models.Base;
import com.muma.products.models.Component;
import com.muma.products.models.Variant;
import com.muma.products.services.BaseService;
import com.muma.products.services.ComponentService;
import com.muma.products.services.VariantService;

import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class ProductsGraphQLController {

    private final BaseService baseService;
    private final VariantService variantService;
    private final ComponentService componentService;

    @QueryMapping
    public List<Base> bases() {
        return baseService.findAll();
    }

    @QueryMapping
    public List<ProductDto> products() {
        return baseService.findAll().stream()
                .map(base -> {
                    List<Variant> variants = variantService.findByBaseId(base.getId());
                    return new ProductDto(
                            base.getId(),
                            base.getCode(),
                            base.getName(),
                            base.getCategory(),
                            base.getSubcategory(),
                            base.getSpace(),
                            base.getLine(),
                            base.getBaseMaterial(),
                            variants);
                })
                .filter(p -> p.variants() != null && !p.variants().isEmpty())
                .toList();
    }

    @QueryMapping
    public List<Variant> variantsByBase(@Argument("baseId") String baseId) {
        return variantService.findByBaseId(UUID.fromString(baseId));
    }

    @QueryMapping
    public List<Component> componentsByVariant(@Argument("variantId") String variantId) {
        return componentService.findByVariantId(UUID.fromString(variantId));
    }

    @MutationMapping
    public Base createBase(@Argument("input") CreateBaseGraphQLInput input) {
        return baseService.create(InputMapper.toCreateBaseInput(input));
    }

    @MutationMapping
    public Base updateBase(@Argument("input") UpdateBaseGraphQLInput input) {
        return baseService.update(InputMapper.toUpdateBaseInput(input));
    }

    @MutationMapping
    public Boolean deleteBase(@Argument("baseId") String baseId) {
        baseService.delete(UUID.fromString(baseId));
        return true;
    }

    @MutationMapping
    public Variant createVariant(@Argument("input") CreateVariantGraphQLInput input) {
        return variantService.create(InputMapper.toCreateVariantInput(input));
    }

    @MutationMapping
    public Variant updateVariant(@Argument("input") UpdateVariantGraphQLInput input) {
        return variantService.update(InputMapper.toUpdateVariantInput(input));
    }

    @MutationMapping
    public Boolean deleteVariant(@Argument("variantId") String variantId) {
        variantService.deleteById(UUID.fromString(variantId));
        return true;
    }

    @MutationMapping
    public Component createComponent(@Argument("input") CreateComponentGraphQLInput input) {
        return componentService.create(InputMapper.toCreateComponentInput(input));
    }

    @MutationMapping
    public Component updateComponent(@Argument("input") UpdateComponentGraphQLInput input) {
        return componentService.update(InputMapper.toUpdateComponentInput(input));
    }

    @MutationMapping
    public Boolean deleteComponent(@Argument("componentId") String componentId) {
        componentService.delete(UUID.fromString(componentId));
        return true;
    }

    public record CreateBaseGraphQLInput(
            String code,
            String name,
            String category,
            String subcategory,
            String space,
            String line,
            String baseMaterial,
            String creatorName,
            String creatorId,
            List<CreateBaseInitialVariantGraphQLInput> initialVariants) {
    }

    public record CreateBaseInitialVariantGraphQLInput(
            String sapRef,
            String image,
            String model,
            List<CreateBaseInitialComponentGraphQLInput> components) {
    }

    public record CreateBaseInitialComponentGraphQLInput(
            String componentId,
            String componentName,
            String componentSapRef,
            String componentSapCode,
            String componentValue) {
    }

    public record UpdateBaseGraphQLInput(
            String id,
            String name,
            String category,
            String subcategory,
            String space,
            String line,
            String baseMaterial) {
    }

    public record CreateVariantGraphQLInput(
            String baseId,
            String sapRef,
            String image,
            String model,
            List<CreateBaseInitialComponentGraphQLInput> components) {
    }

    public record UpdateVariantGraphQLInput(
            String id,
            String sapRef,
            String image,
            String model,
            List<CreateBaseInitialComponentGraphQLInput> components) {
    }

    public record CreateComponentGraphQLInput(
            String variantId,
            String sapRef,
            String sapCode,
            String name,
            String value) {
    }

    public record UpdateComponentGraphQLInput(
            String id,
            String sapRef,
            String sapCode,
            String name,
            String value) {
    }

    /** DTO para query products: base con variantes anidadas. */
    public record ProductDto(
            java.util.UUID id,
            String code,
            String name,
            String category,
            String subcategory,
            String space,
            String line,
            String baseMaterial,
            List<Variant> variants) {
    }

    static final class InputMapper {

        static com.muma.products.dtos.CreateBaseInput toCreateBaseInput(CreateBaseGraphQLInput input) {
            if (input == null) return null;
            List<com.muma.products.dtos.CreateBaseInitialVariantInput> initialVariants =
                    input.initialVariants() == null ? List.of()
                            : input.initialVariants().stream()
                                    .map(InputMapper::toCreateBaseInitialVariantInput)
                                    .filter(Objects::nonNull)
                                    .collect(Collectors.toList());
            return new com.muma.products.dtos.CreateBaseInput(
                    input.code(),
                    input.name(),
                    input.category(),
                    input.subcategory(),
                    input.space(),
                    input.line(),
                    input.baseMaterial(),
                    input.creatorName(),
                    input.creatorId() != null ? UUID.fromString(input.creatorId()) : null,
                    initialVariants);
        }

        static com.muma.products.dtos.CreateBaseInitialVariantInput toCreateBaseInitialVariantInput(
                CreateBaseInitialVariantGraphQLInput in) {
            if (in == null) return null;
            List<com.muma.products.dtos.CreateBaseInitialComponentInput> components =
                    in.components() == null ? List.of()
                            : in.components().stream()
                                    .map(InputMapper::toCreateBaseInitialComponentInput)
                                    .filter(Objects::nonNull)
                                    .collect(Collectors.toList());
            return new com.muma.products.dtos.CreateBaseInitialVariantInput(
                    in.sapRef(), in.image(), in.model(), components);
        }

        static com.muma.products.dtos.CreateBaseInitialComponentInput toCreateBaseInitialComponentInput(
                CreateBaseInitialComponentGraphQLInput in) {
            if (in == null) return null;
            return new com.muma.products.dtos.CreateBaseInitialComponentInput(
                    in.componentId() != null && !in.componentId().isBlank() ? UUID.fromString(in.componentId()) : null,
                    in.componentName(),
                    in.componentSapRef(),
                    in.componentSapCode(),
                    in.componentValue());
        }

        static com.muma.products.dtos.UpdateBaseInput toUpdateBaseInput(UpdateBaseGraphQLInput input) {
            if (input == null) return null;
            return new com.muma.products.dtos.UpdateBaseInput(
                    UUID.fromString(input.id()),
                    input.name(),
                    input.category(),
                    input.subcategory(),
                    input.space(),
                    input.line(),
                    input.baseMaterial());
        }

        static com.muma.products.dtos.CreateVariantInput toCreateVariantInput(CreateVariantGraphQLInput input) {
            if (input == null) return null;
            List<com.muma.products.dtos.CreateBaseInitialComponentInput> components =
                    input.components() == null ? List.of()
                            : input.components().stream()
                                    .map(InputMapper::toCreateBaseInitialComponentInput)
                                    .filter(Objects::nonNull)
                                    .collect(Collectors.toList());
            return new com.muma.products.dtos.CreateVariantInput(
                    UUID.fromString(input.baseId()),
                    input.sapRef(),
                    input.image(),
                    input.model(),
                    components);
        }

        static com.muma.products.dtos.UpdateVariantInput toUpdateVariantInput(UpdateVariantGraphQLInput input) {
            if (input == null) return null;
            List<com.muma.products.dtos.CreateBaseInitialComponentInput> components =
                    input.components() == null ? null
                            : input.components().stream()
                                    .map(InputMapper::toCreateBaseInitialComponentInput)
                                    .filter(Objects::nonNull)
                                    .collect(Collectors.toList());
            return new com.muma.products.dtos.UpdateVariantInput(
                    UUID.fromString(input.id()),
                    input.sapRef(),
                    input.image(),
                    input.model(),
                    components);
        }

        static com.muma.products.dtos.CreateComponentInput toCreateComponentInput(CreateComponentGraphQLInput input) {
            if (input == null) return null;
            return new com.muma.products.dtos.CreateComponentInput(
                    UUID.fromString(input.variantId()),
                    input.sapRef(),
                    input.sapCode(),
                    input.name(),
                    input.value());
        }

        static com.muma.products.dtos.UpdateComponentInput toUpdateComponentInput(UpdateComponentGraphQLInput input) {
            if (input == null) return null;
            return new com.muma.products.dtos.UpdateComponentInput(
                    UUID.fromString(input.id()),
                    input.sapRef(),
                    input.sapCode(),
                    input.name(),
                    input.value());
        }
    }
}
