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
     * Tal cual: reutiliza variante existente, crea VariantQuote sin overrides.
     * P1/P2: clona variante, crea componentes para el clon.
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

        if (!isReusingVariant && (variantDto.components() != null && !variantDto.components().isEmpty())) {
            List<Component> comps = new ArrayList<>();
            var originals = sourceVariant != null ? sourceVariant.getComponents() : List.<Component>of();
            for (var dto : variantDto.components()) {
                if (dto.componentId() == null && (dto.componentSapRef() == null || dto.componentSapRef().isBlank())) continue;
                var origOpt = dto.componentId() != null
                        ? ComponentService.findOriginalById(originals, dto.componentId())
                        : Optional.<Component>empty();
                if (origOpt.isEmpty() && dto.componentSapRef() != null && !dto.componentSapRef().isBlank()) {
                    origOpt = ComponentService.findOriginalBySapRef(originals, dto.componentSapRef().trim());
                }
                Component orig = origOpt.orElse(null);
                String sapRef = orig != null ? orig.getSapRef() : (dto.componentSapRef() != null ? dto.componentSapRef().trim() : null);
                String sapCode = orig != null ? orig.getSapCode() : sapRef;
                String name = orig != null ? orig.getName() : (dto.componentName() != null ? dto.componentName() : sapRef);
                String newVal = dto.componentValue() != null ? dto.componentValue() : "";
                String origVal = orig != null ? (orig.getValue() != null ? orig.getValue() : orig.getOriginalValue()) : newVal;
                if (Boolean.TRUE.equals(dto.modified()) && orig != null) {
                    origVal = orig.getValue() != null ? orig.getValue() : orig.getOriginalValue();
                }
                Component comp = componentService.createForVariant(savedVariant, sapRef, sapCode, name, newVal, origVal);
                comps.add(comp);
            }
            variantService.setComponents(savedVariant.getId(), comps);
        }

        Project project = projectService.getById(projectId);
        project.getVariants().add(savedVariant);
        projectRepository.save(project);

        variantQuoteService.create(savedVariant.getId(), projectId, quoterId, variantDto.type(), variantDto.comments(), null);
    }

    private void processP3(CreateP3Request request, UUID projectId, UUID quoterId) {
        Variant variantSaved = variantService.create(null, null);
        if (request.components() != null && !request.components().isEmpty()) {
            List<Component> comps = new ArrayList<>();
            for (var dto : request.components()) {
                String name = (dto.componentName() != null && !dto.componentName().isBlank())
                        ? dto.componentName().trim()
                        : "component";
                String value = dto.componentValue() != null ? dto.componentValue() : "";
                comps.add(componentService.createForP3Variant(variantSaved, name, value));
            }
            variantService.setComponents(variantSaved.getId(), comps);
        }
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
                    List<Component> effective = getEffectiveComponents(variant, quote);
                    List<ComponentResponse> components = effective.stream()
                            .map(c -> toComponentResponse(c))
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
                                List<ComponentResponse> comps = v.getComponents().stream()
                                        .filter(c -> hasSapAndRef(c.getSapRef(), c.getSapCode()))
                                        .map(this::toComponentResponse)
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

    /** Componentes efectivos: variant.components con overrides por sapRef desde variantQuote.componentOverrides. */
    private List<Component> getEffectiveComponents(Variant variant, VariantQuote quote) {
        var byRef = variant.getComponents().stream()
                .collect(Collectors.toMap(Component::getSapRef, c -> c, (a, b) -> a));
        if (quote != null && quote.getComponentOverrides() != null) {
            for (Component override : quote.getComponentOverrides()) {
                if (override.getSapRef() != null) byRef.put(override.getSapRef(), override);
            }
        }
        return new ArrayList<>(byRef.values());
    }

    /** Backend devuelve todo; el front oculta sapCode cuando value != originalValue. */
    private ComponentResponse toComponentResponse(Component c) {
        return new ComponentResponse(
                c.getId(),
                c.getSapRef(),
                c.getSapCode(),
                c.getName(),
                c.getValue(),
                c.getOriginalValue());
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
        VariantQuote quote = variantQuoteService.findByVariantIdAndProjectId(variantId, projectId)
                .orElseThrow(() -> new IllegalStateException("VariantQuote not found"));
        if (components != null && !components.isEmpty()) {
            quote.getComponentOverrides().clear();
            var originals = variant.getComponents();
            for (ComponentIdValue c : components) {
                String sapRef = c.componentSapRef() != null && !c.componentSapRef().isBlank() ? c.componentSapRef().trim() : null;
                if (sapRef == null && c.componentId() != null) {
                    var orig = ComponentService.findOriginalById(originals, c.componentId());
                    sapRef = orig.map(Component::getSapRef).orElse(null);
                }
                if (sapRef == null) continue;
                String name = c.componentName() != null ? c.componentName() : sapRef;
                String newVal = c.value() != null ? c.value() : "";
                String origVal = ComponentService.findOriginalBySapRef(originals, sapRef)
                        .map(o -> o.getValue() != null ? o.getValue() : o.getOriginalValue())
                        .orElse(newVal);
                quote.getComponentOverrides().add(
                        componentService.createOverride(quote, sapRef, name, newVal, origVal));
            }
            variantQuoteRepo.save(quote);
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
            Variant variant = variantService.findByIdWithComponents(mod.variantId())
                    .orElseThrow(() -> new IllegalStateException("Variant not found"));
            VariantQuote quote = variantQuoteService.findByVariantIdAndProjectId(mod.variantId(), mod.projectId())
                    .orElse(null);
            if (quote != null && mod.componentId() != null && mod.value() != null) {
                var orig = ComponentService.findOriginalById(variant.getComponents(), mod.componentId());
                orig.ifPresent(o -> {
                    var existing = quote.getComponentOverrides().stream()
                            .filter(c -> o.getSapRef() != null && o.getSapRef().equals(c.getSapRef()))
                            .findFirst();
                    String origVal = o.getValue() != null ? o.getValue() : o.getOriginalValue();
                    if (existing.isPresent()) {
                        existing.get().setValue(mod.value());
                    } else {
                        quote.getComponentOverrides().add(componentService.createOverride(
                                quote, o.getSapRef(), o.getName(), mod.value(), origVal));
                    }
                    variantQuoteRepo.save(quote);
                });
            }
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
            for (Component c : v.getComponents()) {
                result.add(new VariantComponentDTO(
                        v.getId(),
                        c.getId(),
                        c.getSapRef(),
                        c.getName(),
                        c.getValue()));
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
            List<Component> comps = new ArrayList<>();
            for (CreateBaseInitialComponent c : components) {
                if (c.componentId() == null && (c.componentSapRef() == null || c.componentSapRef().isBlank())
                        && (c.componentSapCode() == null || c.componentSapCode().isBlank())) continue;
                String sapRefC, sapCode, name;
                if (c.componentId() != null) {
                    var orig = componentService.findById(c.componentId()).orElse(null);
                    sapRefC = orig != null ? orig.getSapRef() : (c.componentSapRef() != null ? c.componentSapRef() : ref + "-c");
                    sapCode = orig != null ? orig.getSapCode() : (c.componentSapCode() != null ? c.componentSapCode() : sapRefC);
                    name = orig != null ? orig.getName() : (c.componentName() != null && !c.componentName().isBlank() ? c.componentName().trim() : sapRefC);
                } else {
                    sapCode = c.componentSapCode() != null && !c.componentSapCode().isBlank()
                            ? c.componentSapCode().trim()
                            : (c.componentSapRef() != null ? c.componentSapRef().trim() : ref + "-c");
                    sapRefC = c.componentSapRef() != null ? c.componentSapRef().trim() : sapCode;
                    name = (c.componentName() != null && !c.componentName().isBlank()) ? c.componentName().trim() : sapRefC;
                }
                String val = c.componentValue() != null ? c.componentValue() : "";
                comps.add(componentService.createForVariant(variant, sapRefC, sapCode, name, val, val));
            }
            variantService.setComponents(variant.getId(), comps);
        }
        return toVariantResponse(variantService.findByIdWithComponents(variant.getId()).orElse(variant));
    }

    @Transactional
    @CacheEvict(value = "products", allEntries = true)
    public VariantResponse updateVariant(UUID variantId, String sapRef,
            List<CreateBaseInitialComponent> components) {
        Variant variant = variantService.findByIdWithComponents(variantId)
                .orElseThrow(() -> new IllegalStateException("Variant not found"));
        if (sapRef != null) {
            variant = variantService.updateSapRef(variantId, sapRef);
        }
        if (components != null && !components.isEmpty()) {
            String variantSapRef = variant.getSapRef();
            List<Component> comps = new ArrayList<>();
            for (CreateBaseInitialComponent c : components) {
                if (c.componentId() == null && (c.componentSapRef() == null || c.componentSapRef().isBlank())
                        && (c.componentSapCode() == null || c.componentSapCode().isBlank())) continue;
                String sapRefC, sapCode, name;
                if (c.componentId() != null) {
                    var orig = componentService.findById(c.componentId()).orElse(null);
                    // Prefer input values (edits) over original; fallback to original for compatibility
                    boolean hasSapRef = c.componentSapRef() != null && !c.componentSapRef().isBlank();
                    boolean hasSapCode = c.componentSapCode() != null && !c.componentSapCode().isBlank();
                    boolean hasName = c.componentName() != null && !c.componentName().isBlank();
                    sapRefC = hasSapRef ? c.componentSapRef().trim()
                            : (orig != null ? orig.getSapRef() : variantSapRef + "-c");
                    sapCode = hasSapCode ? c.componentSapCode().trim()
                            : (orig != null ? orig.getSapCode() : sapRefC);
                    name = hasName ? c.componentName().trim()
                            : (orig != null ? orig.getName() : sapRefC);
                } else {
                    sapCode = c.componentSapCode() != null && !c.componentSapCode().isBlank()
                            ? c.componentSapCode().trim()
                            : (c.componentSapRef() != null ? c.componentSapRef().trim() : variantSapRef + "-c");
                    sapRefC = c.componentSapRef() != null ? c.componentSapRef().trim() : sapCode;
                    name = (c.componentName() != null && !c.componentName().isBlank()) ? c.componentName().trim() : sapRefC;
                }
                String val = c.componentValue() != null ? c.componentValue() : "";
                comps.add(componentService.createForVariant(variant, sapRefC, sapCode, name, val, val));
            }
            variantService.setComponents(variantId, comps);
        }
        return toVariantResponse(variantService.findByIdWithComponents(variantId).orElse(variant));
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
        List<ComponentResponse> comps = v.getComponents().stream()
                .map(this::toComponentResponse)
                .collect(Collectors.toList());
        return new VariantResponse(v.getId(), v.getSapRef(), v.getSapCode(), comps);
    }
}
