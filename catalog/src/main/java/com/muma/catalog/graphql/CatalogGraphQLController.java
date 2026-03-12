package com.muma.catalog.graphql;

import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

import com.muma.catalog.dtos.projects.ProjectResponse;
import com.muma.catalog.dtos.products.BaseResponse;
import com.muma.catalog.dtos.products.CreateBaseInitialComponent;
import com.muma.catalog.dtos.products.VariantResponse;
import com.muma.catalog.models.Base;
import com.muma.catalog.models.Project;
import com.muma.catalog.services.BaseService;
import com.muma.catalog.services.CatalogService;
import com.muma.catalog.services.ProjectService;

import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class CatalogGraphQLController {

    private final CatalogService catalogService;
    private final ProjectService projectService;
    private final BaseService baseService;

    @QueryMapping
    public List<ProjectResponse> projects() {
        return catalogService.getProjectsAndVariants();
    }

    @QueryMapping
    public List<BaseResponse> products() {
        return catalogService.getVariants();
    }

    @QueryMapping
    public List<ProjectResponse> projectsBySales(@Argument("salesId") String salesId) {
        return catalogService.getProjectsBySalesAndVariants(UUID.fromString(salesId));
    }

    @QueryMapping
    public List<ProjectResponse> projectsByQuoter(@Argument("quoterId") String quoterId) {
        return catalogService.getProjectsByQuoterAndVariants(UUID.fromString(quoterId));
    }

    @QueryMapping
    public List<ProjectResponse> projectsEffective() {
        return catalogService.getEffectiveProjects();
    }

    @MutationMapping
    public Project createProject(@Argument("input") CreateProjectInput input) {
        return catalogService.createProject(InputMapper.toCreateProject(input));
    }

    @MutationMapping
    public Project updateProject(@Argument("input") UpdateProjectInput input) {
        Project p = projectService.getById(UUID.fromString(input.id()));
        if (input.name() != null) p.setName(input.name());
        if (input.client() != null) p.setClient(input.client());
        if (input.region() != null) p.setRegion(input.region());
        if (input.state() != null) p.setState(input.state());
        if (input.totalCost() != null) p.setTotalCost(input.totalCost());
        if (input.estimatedTime() != null) p.setEstimatedTime(input.estimatedTime());
        return projectService.update(p);
    }

    @MutationMapping
    public Boolean reOpenProject(@Argument("projectId") String projectId) {
        return catalogService.reOpenProject(UUID.fromString(projectId));
    }

    @MutationMapping
    public Boolean updateVariantAndReopen(@Argument("input") UpdateVariantAndReopenInput input) {
        var components = input.components() == null ? null
                : input.components().stream()
                        .map(c -> {
                            Boolean mod = c.modified();
                            boolean modifiedVal = mod != null && mod;
                            var dto = new com.muma.catalog.dtos.components.ComponentIdValue(
                                    c.componentId() != null ? java.util.UUID.fromString(c.componentId()) : null,
                                    c.componentSapRef(),
                                    c.componentName(),
                                    c.value(),
                                    modifiedVal);
                            System.out.println("[BACK] Controller recibe comp: sapRef=" + c.componentSapRef() + " value=" + c.value() + " modified(raw)=" + mod + " modifiedVal=" + modifiedVal);
                            return dto;
                        })
                        .collect(Collectors.toList());
        System.out.println("[BACK] updateVariantAndReopen projectId=" + input.projectId() + " variantId=" + input.variantId() + " componentsCount=" + (components != null ? components.size() : 0));
        return catalogService.updateVariantAndReopen(
                UUID.fromString(input.projectId()),
                UUID.fromString(input.variantId()),
                input.quantity(),
                input.comments(),
                input.type(),
                components);
    }

    @MutationMapping
    public Boolean makeProjectEffective(@Argument("projectId") String projectId) {
        return projectService.makeEffectiveOnly(UUID.fromString(projectId));
    }

    @MutationMapping
    public Boolean deleteProject(@Argument("projectId") String projectId) {
        return catalogService.deleteProject(UUID.fromString(projectId));
    }

    @MutationMapping
    public Boolean quoteVariant(@Argument("input") QuoteVariantInput input) {
        catalogService.quoteVariant(InputMapper.toQuoteVariant(input));
        return true;
    }

    @MutationMapping
    public Boolean updateVariantQuoteQuantity(@Argument("input") UpdateVariantQuoteQuantityInput input) {
        return catalogService.updateVariantQuoteQuantity(
                UUID.fromString(input.projectId()),
                UUID.fromString(input.variantId()),
                input.quantity());
    }

    @MutationMapping
    public Boolean removeVariantFromProject(
            @Argument("projectId") String projectId,
            @Argument("variantId") String variantId) {
        return catalogService.removeVariantFromProject(
                UUID.fromString(projectId),
                UUID.fromString(variantId));
    }

    @MutationMapping
    public Boolean makeVariantQuoteEffective(
            @Argument("projectId") String projectId,
            @Argument("variantId") String variantId,
            @Argument("effective") Boolean effective) {
        return catalogService.makeVariantQuoteEffective(
                UUID.fromString(projectId),
                UUID.fromString(variantId),
                effective != null && effective);
    }

    @MutationMapping
    public Boolean toggleP3P5(
            @Argument("projectId") String projectId,
            @Argument("variantId") String variantId) {
        return catalogService.toggleP3P5(UUID.fromString(projectId), UUID.fromString(variantId));
    }

    @MutationMapping
    public Base createBase(@Argument("input") CreateBaseInput input) {
        return baseService.create(InputMapper.toCreateBase(input));
    }

    @MutationMapping
    public Base updateBase(@Argument("input") UpdateBaseInput input) {
        return baseService.updateFields(
                UUID.fromString(input.id()),
                input.name(),
                input.image(),
                input.model(),
                input.category(),
                input.subcategory(),
                input.space(),
                input.line(),
                input.baseMaterial());
    }

    @MutationMapping
    public Boolean deleteBase(@Argument("baseId") String baseId) {
        catalogService.deleteBaseCascade(UUID.fromString(baseId));
        return true;
    }

    @MutationMapping
    public VariantResponse addVariantToBase(@Argument("input") AddVariantToBaseInput input) {
        List<CreateBaseInitialComponent> components = input.components() == null
                ? List.<CreateBaseInitialComponent>of()
                : input.components().stream()
                        .map(InputMapper::toCreateBaseInitialComponent)
                        .filter(Objects::nonNull)
                        .collect(Collectors.toList());
        return catalogService.addVariantToBase(input.baseCode(), input.sapRef(), components);
    }

    @MutationMapping
    public VariantResponse updateVariant(@Argument("input") UpdateVariantInput input) {
        List<CreateBaseInitialComponent> components = input.components() == null
                ? List.<CreateBaseInitialComponent>of()
                : input.components().stream()
                        .map(InputMapper::toCreateBaseInitialComponent)
                        .filter(Objects::nonNull)
                        .collect(Collectors.toList());
        return catalogService.updateVariant(
                UUID.fromString(input.id()),
                input.sapRef(),
                components);
    }

    @MutationMapping
    public Boolean deleteVariant(@Argument("variantId") String variantId) {
        catalogService.deleteVariant(UUID.fromString(variantId));
        return true;
    }
}
