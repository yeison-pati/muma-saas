package com.muma.catalog.services;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.muma.catalog.dtos.components.ComponentResponse;
import com.muma.catalog.dtos.components.ModifyComponent;
import com.muma.catalog.dtos.components.VariantComponentDTO;
import com.muma.catalog.dtos.p3.CreateP3Request;
import com.muma.catalog.dtos.products.BaseResponse;
import com.muma.catalog.dtos.products.CreateBaseInitialComponent;
import com.muma.catalog.dtos.products.CreateVariant;
import com.muma.catalog.dtos.products.ProjectVariantResponse;
import com.muma.catalog.dtos.products.QuoteVariant;
import com.muma.catalog.dtos.products.VariantResponse;
import com.muma.catalog.dtos.components.ComponentIdValue;
import com.muma.catalog.dtos.projects.CreateProject;
import com.muma.catalog.dtos.projects.ProjectResponse;
import com.muma.catalog.events.services.ProductEventPublisher;
import com.muma.catalog.events.services.ProjectEventPublisher;
import com.muma.catalog.models.Base;
import com.muma.catalog.models.Component;
import com.muma.catalog.models.ComponentValue;
import com.muma.catalog.models.Project;
import com.muma.catalog.models.Variant;
import com.muma.catalog.models.VariantQuote;
import com.muma.catalog.repositories.ProjectRepository;
import com.muma.catalog.repositories.VariantQuoteRepo;

import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
public class CatalogService {

    private final VariantService variantService;
    private final ComponentService componentService;
    private final VariantQuoteService variantQuoteService;
    private final ProjectService projectService;
    private final BaseService baseService;
    private final ProjectEventPublisher projectEventPublisher;
    private final ProductEventPublisher productEventPublisher;
    private final ProjectRepository projectRepository;
    private final VariantQuoteRepo variantQuoteRepo;

    @Transactional
    @CacheEvict(value = {"projects", "products"}, allEntries = true)
    public Project createProject(CreateProject createProject) {
        boolean hasVariants = createProject.variants() != null && !createProject.variants().isEmpty();
        boolean hasP3s = createProject.p3s() != null && !createProject.p3s().isEmpty();

        if (!hasVariants && !hasP3s) {
            throw new IllegalArgumentException("At least one variant or P3 is required to create a project");
        }

        String consecutive = projectService.generateNextConsecutivo();
        Project projectSaved = projectService.create(createProject, consecutive);

        if (hasVariants) {
            for (CreateVariant variantDto : createProject.variants()) {
                processStandardVariant(variantDto, projectSaved.getId(), createProject.quoterId());
            }
        }
        if (hasP3s) {
            for (CreateP3Request p3 : createProject.p3s()) {
                processP3(p3, projectSaved.getId(), createProject.quoterId());
            }
        }

        int totalItems = (hasVariants ? createProject.variants().size() : 0) + (hasP3s ? createProject.p3s().size() : 0);
        projectEventPublisher.projectCreated(
                projectSaved.getId(),
                projectSaved.getCreatedAt(),
                projectSaved.getSalesId(),
                projectSaved.getQuoterId(),
                totalItems);

        return projectRepository.findById(projectSaved.getId()).orElse(projectSaved);
    }

    /**
     * Si variantId != null y NO hay modificaciones (type no es p1/p2): reutiliza la variante existente.
     * Si hay modificaciones (p1/p2): crea variante nueva (clon) para no tocar la original.
     */
    private void processStandardVariant(CreateVariant variantDto, UUID projectId, UUID quoterId) {
        String type = variantDto.type() != null ? variantDto.type().trim().toLowerCase() : "";
        boolean hasModifications = "p1".equals(type) || "p2".equals(type);
        Variant sourceVariant = variantDto.variantId() != null
                ? variantService.findByIdWithComponents(variantDto.variantId()).orElse(null)
                : null;

        boolean isReusingVariant = sourceVariant != null && !hasModifications;
        Variant savedVariant = isReusingVariant
                ? sourceVariant
                : (sourceVariant != null && hasModifications
                        ? variantService.cloneVariant(sourceVariant)
                        : variantService.create(variantDto.baseCode(), variantDto.variantSapRef()));

        List<ComponentValue> values = new ArrayList<>();
        String variantSapRef = savedVariant.getSapRef();
        var currentByCompId = sourceVariant != null
                ? sourceVariant.getComponentValues().stream()
                        .collect(java.util.stream.Collectors.toMap(cv -> cv.getComponent().getId(), cv -> cv.getValue() != null ? cv.getValue() : ""))
                : java.util.Map.<java.util.UUID, String>of();
        if (!isReusingVariant) {
            for (var componentDto : variantDto.components()) {
                if (componentDto.componentId() == null && (componentDto.componentSapRef() == null || componentDto.componentSapRef().isBlank())) continue;
                Component comp;
                if (Boolean.TRUE.equals(componentDto.modified()) && componentDto.componentSapRef() != null && !componentDto.componentSapRef().isBlank()) {
                    comp = componentService.createForModifiedVariant(componentDto.componentSapRef(), componentDto.componentName());
                } else {
                    comp = componentService.findOrCreateForVariant(componentDto.componentId(), componentDto.componentSapRef(), variantSapRef);
                }
                String newVal = componentDto.componentValue() != null ? componentDto.componentValue() : "";
                values.add(new ComponentValue(comp, newVal));
            }
            savedVariant = variantService.updateComponentValues(savedVariant.getId(), values);
        }

        Project project = projectService.getById(projectId);
        project.getVariants().add(savedVariant);
        projectRepository.save(project);

        variantQuoteService.create(savedVariant.getId(), projectId, quoterId, variantDto.type(), variantDto.comments(), null);
    }

    private void processP3(CreateP3Request request, UUID projectId, UUID quoterId) {
        Variant variantSaved = variantService.create(null, null);

        List<ComponentValue> values = new ArrayList<>();
        for (var componentDto : request.components()) {
            if (componentDto.componentId() == null && (componentDto.componentSapRef() == null || componentDto.componentSapRef().isBlank())) continue;
            Component comp = componentService.findOrCreateForP3(componentDto.componentId(), componentDto.componentSapRef());
            values.add(new ComponentValue(comp, componentDto.componentValue()));
        }
        variantSaved = variantService.updateComponentValues(variantSaved.getId(), values);

        Project project = projectService.getById(projectId);
        project.getVariants().add(variantSaved);
        projectRepository.save(project);

        variantQuoteService.create(variantSaved.getId(), projectId, quoterId, "p3", request.comment(), request.image());
    }

    @Transactional(readOnly = true)
    public List<ProjectResponse> getProjectsAndVariants() {
        List<Project> projects = projectService.getAll();
        return projects.stream().map(this::toProjectResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProjectResponse> getProjectsBySalesAndVariants(UUID salesId) {
        List<Project> projects = projectService.getBySalesId(salesId);
        return projects.stream().map(this::toProjectResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProjectResponse> getProjectsByQuoterAndVariants(UUID quoterId) {
        List<Project> projects = projectService.getByQuoterId(quoterId);
        return projects.stream().map(this::toProjectResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProjectResponse> getEffectiveProjects() {
        List<Project> projects = projectService.getAll();
        return projects.stream()
                .filter(Project::isEffective)
                .map(this::toProjectResponse)
                .collect(Collectors.toList());
    }

    private ProjectResponse toProjectResponse(Project project) {
        List<ProjectVariantResponse> variants = project.getVariants().stream()
                .map(variant -> {
                    VariantQuote quote = project.getVariantQuotes().stream()
                            .filter(vq -> vq.getVariant().getId().equals(variant.getId()))
                            .findFirst()
                            .orElse(null);
                    List<ComponentResponse> components = variant.getComponentValues().stream()
                            .map(cv -> {
                                var c = cv.getComponent();
                                return new ComponentResponse(
                                        c.getId(),
                                        c.getSapRef(),
                                        c.getSapCode(),
                                        c.getName(),
                                        cv.getValue());
                            })
                            .collect(Collectors.toList());
                    String baseCode = variant.getBaseCode();
                    var baseOpt = (baseCode != null && !baseCode.isBlank())
                            ? baseService.findByCode(baseCode)
                            : Optional.<Base>empty();
                    String baseName = baseOpt.map(Base::getName).orElse(null);
                    String baseImage = baseOpt.map(Base::getImage).orElse(null);
                    if (baseImage == null && quote != null && quote.getImage() != null) {
                        baseImage = quote.getImage();
                    }
                    String category = baseOpt.map(Base::getCategory).orElse(null);
                    String subcategory = baseOpt.map(Base::getSubcategory).orElse(null);
                    String line = baseOpt.map(Base::getLine).orElse(null);
                    String space = baseOpt.map(Base::getSpace).orElse(null);
                    String sapCode = variant.getSapCode();
                    if (sapCode != null && sapCode.isBlank()) sapCode = null;
                    return new ProjectVariantResponse(
                            variant.getId(),
                            variant.getSapRef(),
                            sapCode,
                            quote,
                            components,
                            baseCode,
                            baseName,
                            baseImage,
                            category,
                            subcategory,
                            line,
                            space);
                })
                .collect(Collectors.toList());
        return new ProjectResponse(project, variants);
    }

    /**
     * Solo listables: bases con variantes oficiales (sapRef/sapCode) que NO sean P1/P2/P3.
     * Variantes P1/P2/P3 son de cotización (no oficiales) y no se listan.
     */
    @Transactional(readOnly = true)
    public List<BaseResponse> getVariants() {
        java.util.Set<UUID> quoteVariantIds = new java.util.HashSet<>(variantQuoteRepo.findVariantIdsWithQuoteType());
        return baseService.findAll().stream()
                .map(base -> {
                    List<VariantResponse> variantResponses = variantService.findByBaseCode(base.getCode()).stream()
                            .filter(v -> !quoteVariantIds.contains(v.getId()))
                            .filter(v -> hasSapAndRef(v.getSapRef(), v.getSapCode()))
                            .map(v -> {
                                List<ComponentResponse> comps = v.getComponentValues().stream()
                                        .filter(cv -> hasSapAndRef(cv.getComponent().getSapRef(), cv.getComponent().getSapCode()))
                                        .map(cv -> {
                                            var c = cv.getComponent();
                                            return new ComponentResponse(
                                                    c.getId(), c.getSapRef(), c.getSapCode(), c.getName(), cv.getValue());
                                        })
                                        .collect(Collectors.toList());
                                return new VariantResponse(v.getId(), v.getSapRef(), v.getSapCode(), comps);
                            })
                            .collect(Collectors.toList());
                    return new BaseResponse(
                            base.getId(),
                            base.getCode(),
                            base.getName(),
                            base.getImage(),
                            base.getModel(),
                            base.getCategory(),
                            base.getSubcategory(),
                            base.getSpace(),
                            base.getLine(),
                            base.getBaseMaterial(),
                            variantResponses);
                })
                .filter(b -> b.getVariants() != null && !b.getVariants().isEmpty())
                .collect(Collectors.toList());
    }

    private static boolean hasSapAndRef(String sapRef, String sapCode) {
        return sapRef != null && !sapRef.isBlank() && sapCode != null && !sapCode.isBlank();
    }

    @Transactional
    @CacheEvict(value = "projects", allEntries = true)
    public void quoteVariant(QuoteVariant quoteProduct) {
        variantQuoteService.quote(quoteProduct);
        List<VariantQuote> variantQuotes = variantQuoteService.findByProjectId(quoteProduct.projectId());
        var update = projectService.updateStateByQuote(quoteProduct.projectId(), variantQuotes);
        if (update.becameQuoted()) {
            productEventPublisher.productQuoted(quoteProduct.quoterId(), true);
        }
    }

    @Transactional
    @CacheEvict(value = {"projects", "products"}, allEntries = true)
    public Boolean updateVariantAndReopen(UUID projectId, UUID variantId, Integer quantity,
            String comments, String type, List<ComponentIdValue> components) {
        Variant variant = variantService.findByIdWithComponents(variantId)
                .orElseThrow(() -> new IllegalStateException("Variant not found"));
        Project project = projectService.getById(projectId);
        if (!project.getVariants().stream().anyMatch(v -> v.getId().equals(variantId))) {
            throw new IllegalStateException("Variant not in project");
        }
        if (components != null && !components.isEmpty()) {
            List<ComponentValue> values = new ArrayList<>();
            var currentByCompId = variant.getComponentValues().stream()
                    .collect(java.util.stream.Collectors.toMap(cv -> cv.getComponent().getId(), cv -> cv.getValue() != null ? cv.getValue() : ""));
            for (ComponentIdValue c : components) {
                Component comp;
                if (Boolean.TRUE.equals(c.modified()) && c.componentSapRef() != null && !c.componentSapRef().isBlank()) {
                    comp = componentService.createForModifiedVariant(c.componentSapRef(), c.componentName());
                } else if (c.componentId() != null) {
                    comp = componentService.findById(c.componentId())
                            .orElseThrow(() -> new IllegalStateException("Component not found: " + c.componentId()));
                } else {
                    throw new IllegalArgumentException("Se requiere componentId o (modified + componentSapRef)");
                }
                String newVal = c.value() != null ? c.value() : "";
                values.add(new ComponentValue(comp, newVal));
            }
            variantService.updateComponentValues(variantId, values);
        }
        if (quantity != null) variantQuoteService.updateQuantity(projectId, variantId, quantity);
        variantQuoteService.updateCommentsAndType(projectId, variantId, comments, type);
        variantQuoteService.resetQuote(variantId);
        projectService.reOpen(projectId);
        List<VariantQuote> variantQuotes = variantQuoteService.findByProjectId(projectId);
        projectService.updateStateByQuote(projectId, variantQuotes);
        return true;
    }

    @Transactional
    @CacheEvict(value = "projects", allEntries = true)
    public Boolean updateVariantQuoteQuantity(UUID projectId, UUID variantId, Integer quantity) {
        if (quantity == null || quantity < 1) {
            throw new IllegalArgumentException("Quantity must be at least 1");
        }
        variantQuoteService.updateQuantity(projectId, variantId, quantity);
        List<VariantQuote> variantQuotes = variantQuoteService.findByProjectId(projectId);
        projectService.updateStateByQuote(projectId, variantQuotes);
        return true;
    }

    @Transactional
    @CacheEvict(value = {"projects", "products"}, allEntries = true)
    public Boolean deleteProject(UUID projectId) {
        projectService.getById(projectId);
        List<VariantQuote> quotes = variantQuoteService.findByProjectId(projectId);
        List<UUID> quoteVariantIdsToDelete = quotes.stream()
                .filter(vq -> isP1P2P3(vq.getType()))
                .map(vq -> vq.getVariant().getId())
                .distinct()
                .toList();
        projectService.delete(projectId);
        for (UUID vid : quoteVariantIdsToDelete) {
            variantService.deleteById(vid);
        }
        return true;
    }

    @Transactional
    @CacheEvict(value = {"projects", "products"}, allEntries = true)
    public Boolean removeVariantFromProject(UUID projectId, UUID variantId) {
        Project project = projectService.getById(projectId);
        Variant variant = project.getVariants().stream()
                .filter(v -> v.getId().equals(variantId))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Variant not in project"));
        VariantQuote vq = variantQuoteService.findByVariantIdAndProjectId(variantId, projectId).orElse(null);
        boolean isQuoteVariant = vq != null && isP1P2P3(vq.getType());
        variantQuoteService.deleteByVariantIdAndProjectId(variantId, projectId);
        project.getVariants().remove(variant);
        projectRepository.save(project);
        if (isQuoteVariant) {
            variantService.deleteById(variantId);
        }
        List<VariantQuote> remaining = variantQuoteService.findByProjectId(projectId);
        projectService.updateStateByQuote(projectId, remaining);
        return true;
    }

    private static boolean isP1P2P3(String type) {
        if (type == null) return false;
        String t = type.trim().toLowerCase();
        return "p1".equals(t) || "p2".equals(t) || "p3".equals(t);
    }

    @Transactional
    @CacheEvict(value = {"projects", "products"}, allEntries = true)
    public void modifyVariants(List<ModifyComponent> modifiesVariants) {
        for (ModifyComponent mod : modifiesVariants) {
            variantService.modifyComponentValue(mod.variantId(), mod.componentId(), mod.value());
            variantQuoteService.resetQuote(mod.variantId());
            projectService.reOpen(mod.projectId());
            List<VariantQuote> products = variantQuoteService.findByProjectId(mod.projectId());
            projectService.updateStateByQuote(mod.projectId(), products);
        }
    }

    @Transactional
    @CacheEvict(value = "products", allEntries = true)
    public void deleteBaseCascade(UUID baseId) {
        var base = baseService.findById(baseId).orElseThrow(() -> new IllegalStateException("Base not found"));
        for (Variant variant : variantService.findByBaseCode(base.getCode())) {
            variantQuoteService.deleteByVariantId(variant.getId());
            for (Project p : projectRepository.findProjectsContainingVariant(variant.getId())) {
                p.getVariants().remove(variant);
                projectRepository.save(p);
            }
            variantService.deleteById(variant.getId());
        }
        baseService.delete(baseId);
    }

    public List<VariantComponentDTO> getVariantsComponents() {
        List<VariantComponentDTO> result = new ArrayList<>();
        for (Variant v : variantService.findAllWithComponents()) {
            for (ComponentValue cv : v.getComponentValues()) {
                result.add(new VariantComponentDTO(
                        v.getId(),
                        cv.getComponent().getId(),
                        cv.getComponent().getSapRef(),
                        cv.getComponent().getName(),
                        cv.getValue()));
            }
        }
        return result;
    }

    @Transactional
    @CacheEvict(value = "products", allEntries = true)
    public VariantResponse addVariantToBase(String baseCode, String sapRef,
            List<CreateBaseInitialComponent> components) {
        String ref = sapRef != null && !sapRef.isBlank() ? sapRef
                : baseCode + "-V" + (variantService.findByBaseCode(baseCode).size() + 1);
        Variant variant = variantService.create(baseCode, ref);
        if (components != null && !components.isEmpty()) {
            List<ComponentValue> values = new ArrayList<>();
            for (CreateBaseInitialComponent c : components) {
                if (c.componentId() != null || (c.componentSapRef() != null && !c.componentSapRef().isBlank())
                        || (c.componentSapCode() != null && !c.componentSapCode().isBlank())) {
                    Component comp = componentService.findOrCreateForDesigner(c.componentId(), c.componentSapRef(), c.componentSapCode(), ref);
                    values.add(new ComponentValue(comp, c.componentValue() != null ? c.componentValue() : ""));
                }
            }
            variant = variantService.updateComponentValues(variant.getId(), values);
        }
        return toVariantResponse(variant);
    }

    @Transactional
    @CacheEvict(value = "products", allEntries = true)
    public VariantResponse updateVariant(UUID variantId, String sapRef,
            List<CreateBaseInitialComponent> components) {
        Variant variant = variantService.findById(variantId)
                .orElseThrow(() -> new IllegalStateException("Variant not found"));
        if (sapRef != null) {
            variant = variantService.updateSapRef(variantId, sapRef);
        }
        if (components != null && !components.isEmpty()) {
            String variantSapRef = variant.getSapRef();
            List<ComponentValue> values = new ArrayList<>();
            for (CreateBaseInitialComponent c : components) {
                if (c.componentId() != null || (c.componentSapRef() != null && !c.componentSapRef().isBlank())
                        || (c.componentSapCode() != null && !c.componentSapCode().isBlank())) {
                    Component comp = componentService.findOrCreateForDesigner(c.componentId(), c.componentSapRef(), c.componentSapCode(), variantSapRef);
                    values.add(new ComponentValue(comp, c.componentValue() != null ? c.componentValue() : ""));
                }
            }
            variant = variantService.updateComponentValues(variantId, values);
        }
        return toVariantResponse(variantService.findById(variantId).orElse(variant));
    }

    @Transactional
    @CacheEvict(value = {"products", "projects"}, allEntries = true)
    public void deleteVariant(UUID variantId) {
        Variant variant = variantService.findById(variantId)
                .orElseThrow(() -> new IllegalStateException("Variant not found"));
        variantQuoteService.deleteByVariantId(variant.getId());
        for (Project p : projectRepository.findProjectsContainingVariant(variant.getId())) {
            p.getVariants().remove(variant);
            projectRepository.save(p);
        }
        variantService.deleteById(variant.getId());
    }

    private VariantResponse toVariantResponse(Variant v) {
        List<ComponentResponse> comps = v.getComponentValues().stream()
                .map(cv -> {
                    var c = cv.getComponent();
                    return new ComponentResponse(
                            c.getId(), c.getSapRef(), c.getSapCode(), c.getName(), cv.getValue());
                })
                .collect(Collectors.toList());
        return new VariantResponse(v.getId(), v.getSapRef(), v.getSapCode(), comps);
    }
}
