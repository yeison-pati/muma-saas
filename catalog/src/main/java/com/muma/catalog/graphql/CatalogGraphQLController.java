package com.muma.catalog.graphql;

import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

import com.muma.catalog.dtos.projects.ProjectResponse;
import com.muma.catalog.dtos.products.TypologyStandardResponse;
import com.muma.catalog.models.Project;
import com.muma.catalog.services.CatalogService;
import com.muma.catalog.services.ProjectService;

import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class CatalogGraphQLController {

    private static final Logger log = LoggerFactory.getLogger(CatalogGraphQLController.class);

    private final CatalogService catalogService;
    private final ProjectService projectService;

    @QueryMapping
    public List<ProjectResponse> projects() {
        return catalogService.getProjectsAndVariants();
    }

    @QueryMapping
    public List<ProjectResponse> projectsBySales(@Argument("salesId") String salesId) {
        if (salesId == null || salesId.isBlank()) {
            log.warn("[projectsBySales] salesId vacío");
            return List.of();
        }
        try {
            return catalogService.getProjectsBySalesAndVariants(UUID.fromString(salesId));
        } catch (IllegalArgumentException e) {
            log.warn("[projectsBySales] salesId inválido: {}", salesId, e);
            return List.of();
        } catch (Exception e) {
            log.error("[projectsBySales] salesId={} error", salesId, e);
            throw e;
        }
    }

    @QueryMapping
    public List<ProjectResponse> projectsByQuoter(@Argument("quoterId") String quoterId) {
        if (quoterId == null || quoterId.isBlank()) return List.of();
        try {
            return catalogService.getProjectsByQuoterAndVariants(UUID.fromString(quoterId));
        } catch (IllegalArgumentException e) {
            log.warn("[projectsByQuoter] quoterId inválido: {}", quoterId, e);
            return List.of();
        }
    }

    @QueryMapping
    public List<ProjectResponse> projectsEffective() {
        return catalogService.getEffectiveProjects();
    }

    @QueryMapping
    public List<ProjectResponse> projectsForDevelopment() {
        return catalogService.getProjectsForDevelopment();
    }

    @QueryMapping
    public List<ProjectResponse> projectsByAssignedQuoter(@Argument("quoterId") String quoterId) {
        return catalogService.getProjectsByAssignedQuoter(UUID.fromString(quoterId));
    }

    @QueryMapping
    public List<ProjectResponse> projectsByAssignedDesigner(@Argument("designerId") String designerId) {
        return catalogService.getProjectsByAssignedDesigner(UUID.fromString(designerId));
    }

    @QueryMapping
    public List<ProjectResponse> projectsByAssignedDevelopment(@Argument("userId") String userId) {
        if (userId == null || userId.isBlank()) {
            log.warn("[projectsByAssignedDevelopment] userId vacío");
            return List.of();
        }
        try {
            return catalogService.getProjectsByAssignedDevelopment(UUID.fromString(userId));
        } catch (IllegalArgumentException e) {
            log.warn("[projectsByAssignedDevelopment] userId inválido: {}", userId, e);
            return List.of();
        }
    }

    @QueryMapping
    public List<ProjectResponse> projectsForAssignment(@Argument("role") String role) {
        return catalogService.getProjectsForAssignment(role);
    }

    @QueryMapping
    public List<TypologyStandardResponse> typologyStandards() {
        return catalogService.getTypologyStandards();
    }

    @MutationMapping
    public Project createProject(@Argument("input") CreateProjectInput input) {
        var variants = input.variants();
        int n = variants != null ? variants.size() : 0;
        log.info("[createProject] RECIBIDO variants={} p3s={}", n, input.p3s() != null ? input.p3s().size() : 0);
        if (variants != null) {
            for (int i = 0; i < variants.size(); i++) {
                var v = variants.get(i);
                log.info("[createProject] variant[{}] variantId={} baseCode={} type={}", i, v.variantId(), v.baseCode(), v.type());
            }
        }
        log.info("[createProject] llamando catalogService.createProject");
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
    public Boolean quitarProjectEffective(@Argument("projectId") String projectId) {
        return projectService.quitarEffectiveOnly(UUID.fromString(projectId));
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
    public Boolean markVariantAsDesigned(
            @Argument("projectId") String projectId,
            @Argument("variantId") String variantId,
            @Argument("designerId") String designerId) {
        return catalogService.markVariantAsDesigned(
                UUID.fromString(projectId),
                UUID.fromString(variantId),
                UUID.fromString(designerId));
    }

    @MutationMapping
    public Boolean markVariantAsDeveloped(
            @Argument("projectId") String projectId,
            @Argument("variantId") String variantId,
            @Argument("developmentUserId") String developmentUserId) {
        return catalogService.markVariantAsDeveloped(
                UUID.fromString(projectId),
                UUID.fromString(variantId),
                UUID.fromString(developmentUserId));
    }

    @MutationMapping
    public Boolean assignVariantToUser(
            @Argument("projectId") String projectId,
            @Argument("variantId") String variantId,
            @Argument("assigneeId") String assigneeId,
            @Argument("roleType") String roleType) {
        return catalogService.assignVariantToUser(
                UUID.fromString(projectId),
                UUID.fromString(variantId),
                UUID.fromString(assigneeId),
                roleType);
    }
}
