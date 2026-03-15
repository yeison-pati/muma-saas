package com.muma.catalog.services;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.muma.catalog.dtos.products.QuoteVariant;
import com.muma.catalog.models.Project;
import com.muma.catalog.models.Variant;
import com.muma.catalog.models.VariantQuote;
import com.muma.catalog.repositories.ProjectRepository;
import com.muma.catalog.repositories.VariantQuoteRepo;
import com.muma.catalog.repositories.VariantRepo;

import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
public class VariantQuoteService {

    private final VariantQuoteRepo variantQuoteRepository;
    private final VariantRepo variantRepo;
    private final ProjectRepository projectRepository;

    @Transactional
    public VariantQuote create(UUID variantId, UUID projectId, UUID quoterId, String type, String comments, String image, Integer quantity) {
        Variant variant = variantRepo.findById(variantId).orElseThrow(() -> new IllegalStateException("Variant not found"));
        Project project = projectRepository.findById(projectId).orElseThrow(() -> new IllegalStateException("Project not found"));
        int qty = (quantity != null && quantity > 0) ? quantity : 1;
        VariantQuote quote = VariantQuote.builder()
                .id(UUID.randomUUID())
                .variant(variant)
                .project(project)
                .quoterId(quoterId)
                .type(type)
                .criticalMaterial(null)
                .comments(comments)
                .image(image)
                .elaborationTime(null)
                .quantity(qty)
                .price(null)
                .effective(false)
                .build();
        return variantQuoteRepository.save(quote);
    }

    /** Crea VariantQuote referenciando variante de Products (product_variant_id). Front enriquece desde context. */
    @Transactional
    public VariantQuote createWithProductVariantId(UUID productVariantId, UUID projectId, UUID quoterId, String type, String comments, String image, Integer quantity, String baseCode) {
        Project project = projectRepository.findById(projectId).orElseThrow(() -> new IllegalStateException("Project not found"));
        if (variantQuoteRepository.findByProductVariantIdAndProjectId(productVariantId, projectId).isPresent()) {
            throw new IllegalStateException("La variante ya está en el proyecto");
        }
        int qty = (quantity != null && quantity > 0) ? quantity : 1;
        VariantQuote quote = VariantQuote.builder()
                .id(UUID.randomUUID())
                .variant(null)
                .productVariantId(productVariantId)
                .baseCode(baseCode)
                .project(project)
                .quoterId(quoterId)
                .type(type)
                .criticalMaterial(null)
                .comments(comments)
                .image(image)
                .elaborationTime(null)
                .quantity(qty)
                .price(null)
                .effective(false)
                .build();
        return variantQuoteRepository.save(quote);
    }

    @Transactional
    public VariantQuote quote(QuoteVariant quoteProduct) {
        VariantQuote variantQuote = findByVariantIdAndProjectId(quoteProduct.variantId(), quoteProduct.projectId())
                .orElseThrow(() -> new IllegalStateException("VariantQuote not found"));
        variantQuote.setPrice(quoteProduct.price());
        variantQuote.setElaborationTime(quoteProduct.elaborationTime());
        variantQuote.setCriticalMaterial(quoteProduct.criticalMaterial());
        variantQuote.setQuotedAt(Instant.now());
        // P1, P5, P (portafolio): no requieren diseño, asignar designedAt = quotedAt automáticamente
        if (typologyRequiresNoDesign(variantQuote.getType())) {
            variantQuote.setDesignedAt(Instant.now());
        }
        return variantQuoteRepository.save(variantQuote);
    }

    public List<VariantQuote> findByProjectId(UUID projectId) {
        return variantQuoteRepository.findByProjectId(projectId);
    }

    public Optional<VariantQuote> findById(UUID id) {
        return variantQuoteRepository.findById(id);
    }

    public List<VariantQuote> findByVariantId(UUID variantId) {
        return variantQuoteRepository.findByVariantId(variantId);
    }

    public Optional<VariantQuote> findByVariantIdAndProjectId(UUID variantId, UUID projectId) {
        Optional<VariantQuote> byVariant = variantQuoteRepository.findByVariantIdAndProjectId(variantId, projectId);
        if (byVariant.isPresent()) return byVariant;
        return variantQuoteRepository.findByProductVariantIdAndProjectId(variantId, projectId);
    }

    @Transactional
    public void resetQuote(UUID variantId) {
        variantQuoteRepository.resetQuoteByVariantId(variantId);
    }

    /** Resetea precio de todas las variantes del proyecto para que reabrir funcione al primer intento. */
    @Transactional
    public void resetQuoteByProject(UUID projectId) {
        variantQuoteRepository.resetQuoteByProjectId(projectId);
    }

    @Transactional
    public void deleteByVariantId(UUID variantId) {
        variantQuoteRepository.deleteByVariantId(variantId);
    }

    @Transactional
    public VariantQuote updateQuantity(UUID projectId, UUID variantId, Integer quantity) {
        int qty = quantity != null && quantity > 0 ? quantity : 1;
        int updated = variantQuoteRepository.updateQuantity(projectId, variantId, qty);
        if (updated == 0) updated = variantQuoteRepository.updateQuantityByProductVariantId(projectId, variantId, qty);
        if (updated == 0) throw new IllegalStateException("VariantQuote not found for project " + projectId + " and variant " + variantId);
        return findByVariantIdAndProjectId(variantId, projectId)
                .orElseThrow(() -> new IllegalStateException("VariantQuote not found"));
    }

    @Transactional
    public VariantQuote updateCommentsAndType(UUID projectId, UUID variantId, String comments, String type) {
        int updated = variantQuoteRepository.updateCommentsAndType(projectId, variantId, comments, type);
        if (updated == 0) updated = variantQuoteRepository.updateCommentsAndTypeByProductVariantId(projectId, variantId, comments, type);
        if (updated == 0) throw new IllegalStateException("VariantQuote not found for project " + projectId + " and variant " + variantId);
        return findByVariantIdAndProjectId(variantId, projectId)
                .orElseThrow(() -> new IllegalStateException("VariantQuote not found"));
    }

    @Transactional
    public void clearType(UUID projectId, UUID variantId) {
        int u = variantQuoteRepository.clearType(projectId, variantId);
        if (u == 0) variantQuoteRepository.clearTypeByProductVariantId(projectId, variantId);
    }

    @Transactional
    public void deleteByVariantIdAndProjectId(UUID variantId, UUID projectId) {
        variantQuoteRepository.deleteByVariantIdAndProjectId(variantId, projectId);
        variantQuoteRepository.deleteByProductVariantIdAndProjectId(variantId, projectId);
    }

    @Transactional
    public VariantQuote setEffective(UUID projectId, UUID variantId, boolean effective) {
        VariantQuote vq = findByVariantIdAndProjectId(variantId, projectId)
                .orElseThrow(() -> new IllegalStateException("VariantQuote not found"));
        vq.setEffective(effective);
        return variantQuoteRepository.save(vq);
    }

    @Transactional
    public VariantQuote toggleP3P5(UUID projectId, UUID variantId) {
        VariantQuote vq = findByVariantIdAndProjectId(variantId, projectId)
                .orElseThrow(() -> new IllegalStateException("VariantQuote not found"));
        String t = vq.getType() != null ? vq.getType().trim().toLowerCase() : "";
        if ("p3".equals(t)) {
            vq.setType("p5");
        } else if ("p5".equals(t)) {
            vq.setType("p3");
        } else {
            throw new IllegalArgumentException("Solo variantes P3 o P5 pueden alternar tipología. Actual: " + t);
        }
        return variantQuoteRepository.save(vq);
    }

    /** Diseñador marca variante como diseñada. P1/P5/P ya tienen designedAt=quotedAt. */
    @Transactional
    public VariantQuote markAsDesigned(UUID projectId, UUID variantId, UUID designerId) {
        VariantQuote vq = findByVariantIdAndProjectId(variantId, projectId)
                .orElseThrow(() -> new IllegalStateException("VariantQuote not found"));
        if (vq.getQuotedAt() == null) {
            throw new IllegalStateException("La variante debe estar cotizada antes de marcar como diseñada");
        }
        vq.setDesignedAt(Instant.now());
        vq.setDesignerId(designerId);
        VariantQuote saved = variantQuoteRepository.save(vq);

        // Si todas las variantes P2/P3/P4 están diseñadas, marcar proyecto como diseñado
        List<VariantQuote> projectQuotes = variantQuoteRepository.findByProjectId(projectId);
        boolean allDesigned = projectQuotes.stream()
                .allMatch(q -> !typologyRequiresDesign(q.getType()) || q.getDesignedAt() != null);
        if (allDesigned) {
            Project project = projectRepository.findById(projectId).orElseThrow();
            project.setProjectDesignedAt(Instant.now());
            projectRepository.save(project);
        }

        return saved;
    }

    /** Desarrollo (datos maestros) marca variante como desarrollada (agregada a SAP). Solo en proyectos efectivos. */
    @Transactional
    public VariantQuote markAsDeveloped(UUID projectId, UUID variantId, UUID developmentUserId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalStateException("Project not found"));
        if (!project.isEffective()) {
            throw new IllegalStateException("Solo se puede marcar desarrollado en proyectos efectivos");
        }
        VariantQuote vq = findByVariantIdAndProjectId(variantId, projectId)
                .orElseThrow(() -> new IllegalStateException("VariantQuote not found"));
        if (!vq.isEffective()) {
            throw new IllegalStateException("Solo se puede marcar desarrollado en variantes efectivas");
        }
        if (vq.getDesignedAt() == null) {
            throw new IllegalStateException("La variante debe estar diseñada antes de marcar como desarrollada");
        }
        // P2, P3, P4: todo el proyecto debe estar diseñado antes de que cualquier variante pase a desarrollo
        List<VariantQuote> projectQuotes = variantQuoteRepository.findByProjectId(projectId);
        for (VariantQuote q : projectQuotes) {
            if (typologyRequiresDesign(q.getType()) && q.getDesignedAt() == null) {
                throw new IllegalStateException(
                    "No se puede marcar desarrollado: todas las variantes P2, P3 y P4 del proyecto deben estar diseñadas primero.");
            }
        }
        vq.setDevelopedAt(Instant.now());
        vq.setDevelopmentUserId(developmentUserId);
        return variantQuoteRepository.save(vq);
    }

    /** P1, P5, P (portafolio): no requieren diseño. */
    private static boolean typologyRequiresNoDesign(String type) {
        if (type == null) return false;
        String t = type.trim().toLowerCase();
        return "p1".equals(t) || "p5".equals(t) || "p".equals(t);
    }

    /** P2, P3, P4: requieren diseño. */
    private static boolean typologyRequiresDesign(String type) {
        if (type == null) return false;
        String t = type.trim().toLowerCase();
        return "p2".equals(t) || "p3".equals(t) || "p4".equals(t);
    }

    /** Líder asigna variante a usuario (QUOTER, DESIGNER, DEVELOPMENT). Soporta variant_id y product_variant_id. */
    @Transactional
    public VariantQuote assignVariantToUser(UUID projectId, UUID variantId, UUID assigneeId, String roleType) {
        VariantQuote vq = findByVariantIdAndProjectId(variantId, projectId)
                .orElseThrow(() -> new IllegalStateException("VariantQuote not found"));
        switch (roleType != null ? roleType.toUpperCase() : "") {
            case "QUOTER" -> {
                if (vq.getAssignedQuoterId() != null) {
                    throw new IllegalStateException("El cotizador ya está asignado y no se puede cambiar");
                }
                vq.setAssignedQuoterId(assigneeId);
            }
            case "DESIGNER" -> {
                if (vq.getAssignedDesignerId() != null) {
                    throw new IllegalStateException("El diseñador ya está asignado y no se puede cambiar");
                }
                vq.setAssignedDesignerId(assigneeId);
            }
            case "DEVELOPMENT" -> {
                if (vq.getAssignedDevelopmentUserId() != null) {
                    throw new IllegalStateException("El desarrollo ya está asignado y no se puede cambiar");
                }
                vq.setAssignedDevelopmentUserId(assigneeId);
            }
            default -> throw new IllegalArgumentException("roleType debe ser QUOTER, DESIGNER o DEVELOPMENT");
        }
        return variantQuoteRepository.save(vq);
    }
}
