package com.muma.catalog.services;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Predicate;
import java.util.stream.Collectors;

import jakarta.persistence.EntityManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
import com.muma.catalog.dtos.products.TypologyStandardResponse;
import com.muma.catalog.dtos.products.VariantResponse;
import com.muma.catalog.dtos.components.ComponentIdValue;
import com.muma.catalog.dtos.projects.CreateProject;
import com.muma.catalog.dtos.projects.ProjectResponse;
import com.muma.catalog.events.services.ProductEventPublisher;
import com.muma.catalog.events.services.ProjectEventPublisher;
import com.muma.catalog.models.Base;
import com.muma.catalog.models.Component;
import com.muma.catalog.models.Project;
import com.muma.catalog.models.TypologyStandard;
import com.muma.catalog.models.Variant;
import com.muma.catalog.models.VariantQuote;
import com.muma.catalog.repositories.ProjectRepository;
import com.muma.catalog.repositories.TypologyStandardRepo;
import com.muma.catalog.repositories.VariantQuoteRepo;

import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
public class CatalogService {

    private static final Logger log = LoggerFactory.getLogger(CatalogService.class);

        private final VariantService variantService;
        private final ComponentService componentService;
        private final VariantQuoteService variantQuoteService;
        private final ProjectService projectService;
        private final BaseService baseService;
        private final ProjectEventPublisher projectEventPublisher;
        private final ProductEventPublisher productEventPublisher;
    private final ProjectRepository projectRepository;
    private final VariantQuoteRepo variantQuoteRepo;
    private final TypologyStandardRepo typologyStandardRepo;
    private final EntityManager entityManager;

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
            int idx = 0;
            for (CreateVariant variantDto : createProject.variants()) {
                log.info("[createProject] processStandardVariant idx={}/{} variantId={}", idx, createProject.variants().size(), variantDto.variantId());
                processStandardVariant(variantDto, projectSaved.getId(), createProject.quoterId());
                idx++;
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

        List<VariantQuote> quotes = variantQuoteService.findByProjectId(projectSaved.getId());
        log.info("[createProject] DONE totalItems={} VariantQuotesEnDB={}", totalItems, quotes.size());
        return projectRepository.findById(projectSaved.getId()).orElse(projectSaved);
    }

    /**
     * Tal cual: reutiliza variante existente (catalog o Products), crea VariantQuote.
     * P1/P2: clona variante en catalog, crea componentes para el clon.
     * Si variantId viene de Products (no existe en catalog), crea VariantQuote con product_variant_id.
     */
    private void processStandardVariant(CreateVariant variantDto, UUID projectId, UUID quoterId) {
        String type = variantDto.type() != null ? variantDto.type().trim().toLowerCase() : "";
        boolean hasModifications = "p1".equals(type) || "p2".equals(type);
        Variant sourceVariant = variantDto.variantId() != null
                ? variantService.findByIdWithComponents(variantDto.variantId()).orElse(null)
                : null;

        if (sourceVariant == null && variantDto.variantId() != null && !hasModifications) {
            String quoteType = type.isBlank() ? "p4" : type;
            variantQuoteService.createWithProductVariantId(
                    variantDto.variantId(), projectId, quoterId, quoteType, variantDto.comments(), variantDto.image(), variantDto.quantity(), variantDto.baseCode());
            return;
        }

        boolean isReusingVariant = sourceVariant != null && !hasModifications;
        log.info("[processStandardVariant] catalog variant variantId={} baseCode={} sourceVariant={} hasModifications={} isReusing={}", variantDto.variantId(), variantDto.baseCode(), sourceVariant != null, hasModifications, isReusingVariant);
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

        String quoteType = isReusingVariant ? "p4" : (variantDto.type() != null ? variantDto.type() : null);
        variantQuoteService.create(savedVariant.getId(), projectId, quoterId, quoteType, variantDto.comments(), variantDto.image(), variantDto.quantity());
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
        variantQuoteService.create(variantSaved.getId(), projectId, quoterId, "p3", request.comment(), request.image(), null);
    }

    @Transactional(readOnly = true)
    public List<ProjectResponse> getProjectsAndVariants() {
        List<Project> projects = projectService.getAll();
        return projects.stream().map(p -> toProjectResponse(p, false, null)).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProjectResponse> getProjectsBySalesAndVariants(UUID salesId) {
        List<Project> projects = projectService.getBySalesId(salesId);
        return projects.stream().map(p -> toProjectResponse(p, false, null)).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProjectResponse> getProjectsByQuoterAndVariants(UUID quoterId) {
        List<Project> projects = projectService.getByQuoterId(quoterId);
        return projects.stream().map(p -> toProjectResponse(p, false, null)).collect(Collectors.toList());
    }

    /** Solo proyectos efectivos; cada proyecto lista solo variantes marcadas efectivas. */
    @Transactional(readOnly = true)
    public List<ProjectResponse> getEffectiveProjects() {
        List<Project> projects = projectService.getAll();
        return projects.stream()
                .filter(Project::isEffective)
                .map(p -> toProjectResponse(p, true, null))
                .collect(Collectors.toList());
    }

    /** Alias para rol desarrollo: proyectos efectivos. */
    @Transactional(readOnly = true)
    public List<ProjectResponse> getProjectsForDevelopment() {
        return getEffectiveProjects();
    }

    /** Proyectos con variantes asignadas a este cotizador. Solo variantes donde assignedQuoterId = quoterId. Sin fallback: si no hay asignaciones, no ve nada. */
    @Transactional(readOnly = true)
    public List<ProjectResponse> getProjectsByAssignedQuoter(UUID quoterId) {
        List<UUID> projectIds = variantQuoteRepo.findProjectIdsByAssignedQuoterId(quoterId);
        if (projectIds.isEmpty()) return List.of();
        List<Project> projects = projectRepository.findAllByIdWithVariantsAndQuotes(projectIds);
        return projects.stream()
                .map(p -> toProjectResponse(p, false, q -> quoterId.equals(q.getAssignedQuoterId())))
                .filter(r -> r.variants() != null && !r.variants().isEmpty())
                .collect(Collectors.toList());
    }

    /** Proyectos efectivos con variantes asignadas a este diseñador. Solo variantes donde assignedDesignerId = designerId. */
    @Transactional(readOnly = true)
    public List<ProjectResponse> getProjectsByAssignedDesigner(UUID designerId) {
        List<UUID> projectIds = variantQuoteRepo.findProjectIdsByAssignedDesignerId(designerId);
        if (projectIds.isEmpty()) return List.of();
        List<Project> projects = projectRepository.findAllByIdWithVariantsAndQuotes(projectIds);
        return projects.stream()
                .map(p -> toProjectResponse(p, true, q -> designerId.equals(q.getAssignedDesignerId())))
                .filter(r -> r.variants() != null && !r.variants().isEmpty())
                .collect(Collectors.toList());
    }

    /** Proyectos efectivos con variantes asignadas a este usuario de desarrollo. Solo variantes donde assignedDevelopmentUserId = userId. */
    @Transactional(readOnly = true)
    public List<ProjectResponse> getProjectsByAssignedDevelopment(UUID userId) {
        List<UUID> projectIds = variantQuoteRepo.findProjectIdsByAssignedDevelopmentUserId(userId);
        if (projectIds.isEmpty()) return List.of();
        List<Project> projects = projectRepository.findAllByIdWithVariantsAndQuotes(projectIds);
        return projects.stream()
                .map(p -> toProjectResponse(p, true, q -> userId.equals(q.getAssignedDevelopmentUserId())))
                .filter(r -> r.variants() != null && !r.variants().isEmpty())
                .collect(Collectors.toList());
    }

    /**
     * Proyectos para que líderes asignen según rol.
     * QUOTER: todos los proyectos con productos (desde creación).
     * DESIGNER: proyectos con al menos una variante cotizada (quotedAt) para asignar diseñador.
     * DEVELOPMENT: proyectos con al menos una variante diseñada (designedAt) para asignar desarrollo.
     */
    @Transactional(readOnly = true)
    public List<ProjectResponse> getProjectsForAssignment(String role) {
        List<Project> projects = projectService.getAll();
        java.util.function.Predicate<VariantQuote> variantFilter = assignmentVariantFilter(role);
        return projects.stream()
                .filter(p -> !p.getVariantQuotes().isEmpty())
                .filter(p -> filterByAssignmentRole(p, role))
                .map(p -> toProjectResponse(p, p.isEffective(), variantFilter))
                .filter(r -> r.variants() != null && !r.variants().isEmpty())
                .collect(Collectors.toList());
    }

    private boolean filterByAssignmentRole(Project p, String role) {
        if (role == null || role.isBlank()) return true;
        String r = role.trim().toLowerCase();
        if ("cotizador".equals(r) || "quoter".equals(r)) return true;
        if ("disenador".equals(r) || "designer".equals(r)) {
            return p.getVariantQuotes().stream().anyMatch(q -> q.getQuotedAt() != null);
        }
        if ("desarrollo".equals(r) || "development".equals(r)) {
            return p.getVariantQuotes().stream().anyMatch(q -> q.getDesignedAt() != null);
        }
        return true;
    }

    private java.util.function.Predicate<VariantQuote> assignmentVariantFilter(String role) {
        if (role == null || role.isBlank()) return null;
        String r = role.trim().toLowerCase();
        if ("cotizador".equals(r) || "quoter".equals(r)) return null;
        if ("disenador".equals(r) || "designer".equals(r)) {
            return q -> q.getQuotedAt() != null;
        }
        if ("desarrollo".equals(r) || "development".equals(r)) {
            return q -> q.getDesignedAt() != null;
        }
        return null;
    }

    @Transactional(readOnly = true)
    public List<TypologyStandardResponse> getTypologyStandards() {
        return typologyStandardRepo.findAll().stream()
                .map(TypologyStandardResponse::from)
                .collect(Collectors.toList());
    }

    /** filterByEffective=true: en proyectos efectivos, solo variantes con quote.effective. assignmentFilter: si no null, solo variantes cuyo quote cumple el predicado. */
    private ProjectResponse toProjectResponse(Project project, boolean filterByEffective, Predicate<VariantQuote> assignmentFilter) {
        boolean projectEffective = project.isEffective();
        List<ProjectVariantResponse> variants = new ArrayList<>();

        var quotes = project.getVariantQuotes() != null ? project.getVariantQuotes() : List.<VariantQuote>of();
        for (VariantQuote quote : quotes) {
            if (filterByEffective && projectEffective && !quote.isEffective()) continue;
            if (assignmentFilter != null && !assignmentFilter.test(quote)) continue;

            if (quote.getProductVariantId() != null) {
                // P4: Catalog devuelve mínimo. Front enriquece desde products en context.
                variants.add(new ProjectVariantResponse(
                        quote.getProductVariantId(),
                        null,
                        null,
                        quote,
                        List.of(),
                        quote.getBaseCode(),
                        null,
                        quote.getImage(),
                        null,
                        null,
                        null,
                        null));
            } else if (quote.getVariant() != null) {
                Variant variant = quote.getVariant();
                List<Component> effective = getEffectiveComponents(variant, quote);
                List<ComponentResponse> components = effective.stream()
                        .map(c -> toComponentResponse(c, variant))
                        .collect(Collectors.toList());
                String baseCode = variant.getBaseCode();
                var baseOpt = (baseCode != null && !baseCode.isBlank())
                        ? baseService.findByCode(baseCode)
                        : Optional.<Base>empty();
                String baseName = baseOpt.map(Base::getName).orElse(null);
                String baseImage = baseOpt.map(Base::getImage).orElse(null);
                String category = baseOpt.map(Base::getCategory).orElse(null);
                String subcategory = baseOpt.map(Base::getSubcategory).orElse(null);
                String line = baseOpt.map(Base::getLine).orElse(null);
                String space = baseOpt.map(Base::getSpace).orElse(null);
                if (baseImage == null && quote.getImage() != null) baseImage = quote.getImage();
                String sapCode = variant.getSapCode();
                if (sapCode != null && sapCode.isBlank()) sapCode = null;
                log.info("[toProjectResponse] catalog variant agregado variantId={} type={}", variant.getId(), quote.getType());
                variants.add(new ProjectVariantResponse(
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
                        space));
            }
        }
        log.info("[toProjectResponse] projectId={} variantsEnRespuesta={}", project.getId(), variants.size());
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
                            .filter(v -> v.getSourceVariantId() == null)
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
        return toComponentResponse(c, c.getVariant() != null ? c.getVariant() : null);
    }

    private ComponentResponse toComponentResponse(Component c, Variant variant) {
        String catalogOrig = null;
        if (variant != null && c.getSapRef() != null && c.getVariant() == null) {
            catalogOrig = ComponentService.findOriginalBySapRef(variant.getComponents(), c.getSapRef())
                    .map(o -> o.getOriginalValue() != null ? o.getOriginalValue() : o.getValue())
                    .orElse(null);
        }
        return new ComponentResponse(
                c.getId(),
                c.getSapRef(),
                c.getSapCode(),
                c.getName(),
                c.getValue(),
                c.getOriginalValue(),
                catalogOrig);
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
        Project project = projectService.getById(projectId);
        if (project.isEffective()) {
            reopenEffectiveProject(projectId, variantId, quantity, comments, type, components);
            return true;
        }
        VariantQuote quote = variantQuoteService.findByVariantIdAndProjectId(variantId, projectId)
                .orElseThrow(() -> new IllegalStateException("VariantQuote not found"));
        if (quote.getProductVariantId() != null) {
            if (quantity != null) variantQuoteService.updateQuantity(projectId, variantId, quantity);
            if (comments != null || type != null) variantQuoteService.updateCommentsAndType(projectId, variantId, comments, type);
            variantQuoteService.resetQuoteByProject(projectId);
            projectService.reOpen(projectId);
            projectService.updateStateByQuote(projectId, variantQuoteService.findByProjectId(projectId));
            return true;
        }
        Variant variant = variantService.findByIdWithComponents(variantId)
                .orElseThrow(() -> new IllegalStateException("Variant not found"));
        if (!project.getVariants().stream().anyMatch(v -> v.getId().equals(variantId))) {
            throw new IllegalStateException("Variant not in project");
        }
        quote.getComponentOverrides().clear();
        boolean isClone = isCloneType(quote.getType());
        System.out.println("[BACK] CatalogService quote.type=" + quote.getType() + " isClone=" + isClone + " components=" + (components != null ? components.size() : 0));
        boolean allComponentsReverted = false;
        if (components != null && !components.isEmpty()) {
            var originals = variant.getComponents();
            int revertCount = 0;
            System.out.println("[BACK] variant.components count=" + (originals != null ? originals.size() : 0) + " sapRefs=" + (originals != null ? originals.stream().map(Component::getSapRef).toList() : "null"));
            for (ComponentIdValue c : components) {
                String sapRef = c.componentSapRef() != null && !c.componentSapRef().isBlank() ? c.componentSapRef().trim() : null;
                if (sapRef == null && c.componentId() != null) {
                    var orig = ComponentService.findOriginalById(originals, c.componentId());
                    sapRef = orig.map(Component::getSapRef).orElse(null);
                }
                System.out.println("[BACK] procesando comp sapRef=" + sapRef + " value=" + c.value() + " modified=" + c.modified());
                if (sapRef == null) {
                    System.out.println("[BACK] SKIP sapRef null");
                    continue;
                }
                String name = c.componentName() != null ? c.componentName() : sapRef;
                String newVal = (c.value() != null ? c.value() : "").trim();
                var variantCompOpt = ComponentService.findOriginalBySapRef(originals, sapRef);
                String origVal = variantCompOpt
                        .map(o -> o.getValue() != null ? o.getValue() : o.getOriginalValue())
                        .orElse(newVal);
                String origValTrim = (origVal != null ? origVal : "").trim();
                boolean isRevert = Boolean.FALSE.equals(c.modified()) || newVal.equals(origValTrim);
                final String sapRefF = sapRef;
                final String newValF = newVal;
                System.out.println("[BACK] sapRef=" + sapRef + " newVal='" + newVal + "' origVal='" + origValTrim + "' isRevert=" + isRevert + " variantCompPresent=" + variantCompOpt.isPresent());
                if (isRevert) {
                    revertCount++;
                    if (isClone) variantCompOpt.ifPresentOrElse(vc -> {
                        String current = vc.getValue() != null ? vc.getValue() : "";
                        System.out.println("[BACK] REVERT UPDATE sapRef=" + sapRefF + " current='" + current + "' -> newVal='" + newValF + "'");
                        if (!newValF.equals(current)) {
                            vc.setValue(newValF);
                            componentService.save(vc);
                            entityManager.flush();
                            System.out.println("[BACK] SAVE OK componente actualizado y flush");
                        } else {
                            System.out.println("[BACK] SKIP ya tiene ese valor");
                        }
                    }, () -> System.out.println("[BACK] REVERT pero variantComp NO ENCONTRADO por sapRef=" + sapRefF));
                }
                if (!isRevert) {
                    System.out.println("[BACK] CREANDO override sapRef=" + sapRef + " newVal='" + newVal + "'");
                    quote.getComponentOverrides().add(
                            componentService.createOverride(quote, sapRef, name, newVal, origVal));
                }
            }
            allComponentsReverted = (revertCount == (components != null ? components.size() : 0)) && revertCount > 0;
        }
        variantQuoteRepo.save(quote);
        entityManager.flush();
        if (quantity != null) variantQuoteService.updateQuantity(projectId, variantId, quantity);
        if (allComponentsReverted && isClone) {
            variantQuoteService.clearType(projectId, variantId);
            if (comments != null) variantQuoteService.updateCommentsAndType(projectId, variantId, comments, null);
        } else {
            variantQuoteService.updateCommentsAndType(projectId, variantId, comments, type);
        }
        variantQuoteService.resetQuoteByProject(projectId);
        projectService.reOpen(projectId);
        List<VariantQuote> variantQuotes = variantQuoteService.findByProjectId(projectId);
        projectService.updateStateByQuote(projectId, variantQuotes);
        variantService.findByIdWithComponents(variantId).ifPresent(v -> {
            System.out.println("[BACK] FINAL variant components:");
            v.getComponents().forEach(co -> System.out.println("  sapRef=" + co.getSapRef() + " value=" + co.getValue() + " originalValue=" + co.getOriginalValue()));
        });
        System.out.println("[BACK] updateVariantAndReopen DONE");
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
                .filter(vq -> vq.getVariant() != null && isCloneType(vq.getType()))
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
        VariantQuote vq = variantQuoteService.findByVariantIdAndProjectId(variantId, projectId)
                .orElseThrow(() -> new IllegalStateException("Variant not in project"));
        boolean isProductVariant = vq.getProductVariantId() != null;
        boolean isQuoteVariant = vq.getVariant() != null && isCloneType(vq.getType());
        variantQuoteService.deleteByVariantIdAndProjectId(variantId, projectId);
        if (!isProductVariant) {
            project.getVariants().stream().filter(v -> v.getId().equals(variantId)).findFirst()
                    .ifPresent(v -> { project.getVariants().remove(v); projectRepository.save(project); });
        }
        if (isQuoteVariant && vq.getVariant() != null) {
            variantService.deleteById(variantId);
        }
        List<VariantQuote> remaining = variantQuoteService.findByProjectId(projectId);
        projectService.updateStateByQuote(projectId, remaining);
        return true;
    }

    @Transactional
    @CacheEvict(value = {"projects", "products"}, allEntries = true)
    public Boolean reOpenProject(UUID projectId) {
        variantQuoteService.resetQuoteByProject(projectId);
        projectService.reOpen(projectId);
        List<VariantQuote> variantQuotes = variantQuoteService.findByProjectId(projectId);
        projectService.updateStateByQuote(projectId, variantQuotes);
        return true;
    }

    /**
     * Proyecto efectivo + ediciones: crea NUEVO proyecto con variantes editadas + efectivas.
     * El proyecto original permanece efectivo e inmutable.
     */
        @Transactional
    @CacheEvict(value = {"projects", "products"}, allEntries = true)
    public Boolean reopenEffectiveProject(UUID projectId, UUID editedVariantId, Integer quantity,
            String comments, String type, List<ComponentIdValue> components) {
        Project original = projectService.getById(projectId);
        if (!original.isEffective()) {
            throw new IllegalStateException("reopenEffectiveProject solo aplica a proyectos efectivos");
        }
        List<VariantQuote> originalQuotes = variantQuoteService.findByProjectId(projectId);

        Project newProject = projectService.createCopy(original);
        UUID quoterId = original.getQuoterId();

        var effectiveQuotes = originalQuotes.stream().filter(VariantQuote::isEffective).toList();
        var editedQuoteOpt = originalQuotes.stream()
                .filter(vq -> (vq.getVariant() != null && vq.getVariant().getId().equals(editedVariantId))
                        || (vq.getProductVariantId() != null && vq.getProductVariantId().equals(editedVariantId)))
                .findFirst();

        java.util.Set<UUID> addedVariantIds = new java.util.HashSet<>();

        // 1. Añadir variantes efectivas (excluyendo la editada; la editada se añade después con cambios)
        for (VariantQuote oq : effectiveQuotes) {
            UUID vid = oq.getVariant() != null ? oq.getVariant().getId() : oq.getProductVariantId();
            if (vid == null) continue;
            if (vid.equals(editedVariantId)) continue;
            if (addedVariantIds.contains(vid)) continue;
            addedVariantIds.add(vid);
            if (oq.getProductVariantId() != null) {
                variantQuoteService.createWithProductVariantId(vid, newProject.getId(), quoterId, oq.getType(), oq.getComments(), oq.getImage(), oq.getQuantity(), oq.getBaseCode());
                continue;
            }
            Variant v = oq.getVariant();
            newProject.getVariants().add(v);
            projectRepository.save(newProject);
            VariantQuote newQuote = variantQuoteService.create(v.getId(), newProject.getId(), quoterId, oq.getType(), oq.getComments(), oq.getImage(), oq.getQuantity());
            for (Component ov : oq.getComponentOverrides() != null ? oq.getComponentOverrides() : List.<Component>of()) {
                if (ov.getSapRef() != null) {
                    newQuote.getComponentOverrides().add(componentService.createOverride(newQuote, ov.getSapRef(), ov.getName(),
                            ov.getValue() != null ? ov.getValue() : "", ov.getOriginalValue() != null ? ov.getOriginalValue() : ""));
                }
            }
            if (!newQuote.getComponentOverrides().isEmpty()) variantQuoteRepo.save(newQuote);
        }

        // 2. Añadir variante editada con modificaciones
        VariantQuote editedQuote = editedQuoteOpt.orElseThrow(() -> new IllegalStateException("VariantQuote not found"));
        if (editedQuote.getProductVariantId() != null) {
            variantQuoteService.createWithProductVariantId(editedQuote.getProductVariantId(), newProject.getId(), quoterId,
                    type != null ? type : editedQuote.getType(), comments != null ? comments : editedQuote.getComments(), editedQuote.getImage(), quantity, editedQuote.getBaseCode());
            variantQuoteService.resetQuoteByProject(newProject.getId());
            projectService.updateStateByQuote(newProject.getId(), variantQuoteService.findByProjectId(newProject.getId()));
            return true;
        }
        Variant editedVariant = variantService.findByIdWithComponents(editedVariantId)
                .orElseThrow(() -> new IllegalStateException("Variant not found"));

        boolean isClone = isCloneType(editedQuote.getType());
        Variant variantToAdd;

        if (isClone) {
            Variant cloned = variantService.cloneVariant(editedVariant);
            List<Component> comps = new ArrayList<>();
            var originals = editedVariant.getComponents();
            var modBySapRef = new java.util.HashMap<String, String>();
            if (components != null) {
                for (ComponentIdValue c : components) {
                    String sapRef = c.componentSapRef() != null && !c.componentSapRef().isBlank() ? c.componentSapRef().trim() : null;
                    if (sapRef == null && c.componentId() != null) {
                        sapRef = ComponentService.findOriginalById(originals, c.componentId()).map(Component::getSapRef).orElse(null);
                    }
                    if (sapRef != null) modBySapRef.put(sapRef, (c.value() != null ? c.value() : "").trim());
                }
            }
            for (Component oc : originals) {
                String sapRef = oc.getSapRef();
                if (sapRef == null) continue;
                String newVal = modBySapRef.getOrDefault(sapRef, oc.getValue() != null ? oc.getValue() : "");
                String origVal = oc.getOriginalValue() != null ? oc.getOriginalValue() : (oc.getValue() != null ? oc.getValue() : "");
                comps.add(componentService.createForVariant(cloned, sapRef, oc.getSapCode() != null ? oc.getSapCode() : sapRef, oc.getName(), newVal, origVal));
            }
            variantService.setComponents(cloned.getId(), comps);
            variantToAdd = cloned;
        } else {
            variantToAdd = editedVariant;
        }

        newProject.getVariants().add(variantToAdd);
        projectRepository.save(newProject);

        VariantQuote newQuote = variantQuoteService.create(variantToAdd.getId(), newProject.getId(), quoterId,
                type != null ? type : editedQuote.getType(), comments != null ? comments : editedQuote.getComments(), editedQuote.getImage(), quantity);

        if (!isClone && components != null && !components.isEmpty()) {
            var originals = editedVariant.getComponents();
            for (ComponentIdValue c : components) {
                if (Boolean.TRUE.equals(c.modified())) {
                    String sapRef = c.componentSapRef() != null && !c.componentSapRef().isBlank() ? c.componentSapRef().trim() : null;
                    if (sapRef == null && c.componentId() != null) {
                        sapRef = ComponentService.findOriginalById(originals, c.componentId()).map(Component::getSapRef).orElse(null);
                    }
                    if (sapRef == null) continue;
                    String name = c.componentName() != null ? c.componentName() : sapRef;
                    String newVal = (c.value() != null ? c.value() : "").trim();
                    var origOpt = ComponentService.findOriginalBySapRef(originals, sapRef);
                    String origVal = origOpt.map(o -> o.getValue() != null ? o.getValue() : o.getOriginalValue()).orElse(newVal);
                    newQuote.getComponentOverrides().add(componentService.createOverride(newQuote, sapRef, name, newVal, origVal));
                }
            }
            variantQuoteRepo.save(newQuote);
        }

        if (quantity != null) variantQuoteService.updateQuantity(newProject.getId(), variantToAdd.getId(), quantity);

        variantQuoteService.resetQuoteByProject(newProject.getId());
        List<VariantQuote> newQuotes = variantQuoteService.findByProjectId(newProject.getId());
        projectService.updateStateByQuote(newProject.getId(), newQuotes);

        projectEventPublisher.projectCreated(newProject.getId(), newProject.getCreatedAt(),
                newProject.getSalesId(), newProject.getQuoterId(), newQuotes.size());

        // El original pierde efectivo al reabrir (la copia es la que sigue el flujo)
        original.setEffective(false);
        projectRepository.save(original);

        return true;
    }

    @Transactional
    @CacheEvict(value = {"projects"}, allEntries = true)
    public Boolean makeVariantQuoteEffective(UUID projectId, UUID variantId, boolean effective) {
        Project project = projectService.getById(projectId);
        if (!project.isEffective()) {
            throw new IllegalStateException("Solo se pueden marcar variantes efectivas en proyectos ya efectivos.");
        }
        variantQuoteService.setEffective(projectId, variantId, effective);
        return true;
    }

    @Transactional
    @CacheEvict(value = {"projects"}, allEntries = true)
    public Boolean toggleP3P5(UUID projectId, UUID variantId) {
        variantQuoteService.toggleP3P5(projectId, variantId);
        return true;
    }

    @Transactional
    @CacheEvict(value = {"projects"}, allEntries = true)
    public Boolean markVariantAsDesigned(UUID projectId, UUID variantId, UUID designerId) {
        variantQuoteService.markAsDesigned(projectId, variantId, designerId);
        return true;
    }

    @Transactional
    @CacheEvict(value = {"projects"}, allEntries = true)
    public Boolean markVariantAsDeveloped(UUID projectId, UUID variantId, UUID developmentUserId) {
        variantQuoteService.markAsDeveloped(projectId, variantId, developmentUserId);
        return true;
    }

    @Transactional
    @CacheEvict(value = {"projects", "products"}, allEntries = true)
    public Boolean assignVariantToUser(UUID projectId, UUID variantId, UUID assigneeId, String roleType) {
        variantQuoteService.assignVariantToUser(projectId, variantId, assigneeId, roleType);
        return true;
    }

    /** P1/P2/P3/P5 = clon/creado para proyecto. P4 = variante existente reutilizada. */
    private static boolean isCloneType(String type) {
        if (type == null) return false;
        String t = type.trim().toLowerCase();
        return "p1".equals(t) || "p2".equals(t) || "p3".equals(t) || "p5".equals(t);
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
