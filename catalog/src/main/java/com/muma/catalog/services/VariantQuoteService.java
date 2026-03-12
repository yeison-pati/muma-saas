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
    public VariantQuote create(UUID variantId, UUID projectId, UUID quoterId, String type, String comments, String image) {
        Variant variant = variantRepo.findById(variantId).orElseThrow(() -> new IllegalStateException("Variant not found"));
        Project project = projectRepository.findById(projectId).orElseThrow(() -> new IllegalStateException("Project not found"));
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
                .quantity(null)
                .price(null)
                .effective(false)
                .build();
        return variantQuoteRepository.save(quote);
    }

    @Transactional
    public VariantQuote quote(QuoteVariant quoteProduct) {
        VariantQuote variantQuote = variantQuoteRepository
                .findByVariantIdAndProjectId(quoteProduct.variantId(), quoteProduct.projectId())
                .orElseThrow(() -> new IllegalStateException("VariantQuote not found"));
        variantQuote.setPrice(quoteProduct.price());
        variantQuote.setElaborationTime(quoteProduct.elaborationTime());
        variantQuote.setCriticalMaterial(quoteProduct.criticalMaterial());
        variantQuote.setQuotedAt(Instant.now());
        // P1: diseño = 0 días, asignar designedAt = quotedAt automáticamente
        if ("p1".equalsIgnoreCase(variantQuote.getType())) {
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
        return variantQuoteRepository.findByVariantIdAndProjectId(variantId, projectId);
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
        if (updated == 0) throw new IllegalStateException("VariantQuote not found for project " + projectId + " and variant " + variantId);
        return variantQuoteRepository.findByVariantIdAndProjectId(variantId, projectId)
                .orElseThrow(() -> new IllegalStateException("VariantQuote not found"));
    }

    @Transactional
    public VariantQuote updateCommentsAndType(UUID projectId, UUID variantId, String comments, String type) {
        int updated = variantQuoteRepository.updateCommentsAndType(projectId, variantId, comments, type);
        if (updated == 0) throw new IllegalStateException("VariantQuote not found for project " + projectId + " and variant " + variantId);
        return variantQuoteRepository.findByVariantIdAndProjectId(variantId, projectId)
                .orElseThrow(() -> new IllegalStateException("VariantQuote not found"));
    }

    @Transactional
    public void clearType(UUID projectId, UUID variantId) {
        variantQuoteRepository.clearType(projectId, variantId);
    }

    @Transactional
    public void deleteByVariantIdAndProjectId(UUID variantId, UUID projectId) {
        variantQuoteRepository.deleteByVariantIdAndProjectId(variantId, projectId);
    }

    @Transactional
    public VariantQuote setEffective(UUID projectId, UUID variantId, boolean effective) {
        VariantQuote vq = variantQuoteRepository.findByVariantIdAndProjectId(variantId, projectId)
                .orElseThrow(() -> new IllegalStateException("VariantQuote not found"));
        vq.setEffective(effective);
        return variantQuoteRepository.save(vq);
    }

    @Transactional
    public VariantQuote toggleP3P5(UUID projectId, UUID variantId) {
        VariantQuote vq = variantQuoteRepository.findByVariantIdAndProjectId(variantId, projectId)
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

    /** Diseñador marca variante como diseñada. P1 ya tiene designedAt=quotedAt. */
    @Transactional
    public VariantQuote markAsDesigned(UUID projectId, UUID variantId, UUID designerId) {
        VariantQuote vq = variantQuoteRepository.findByVariantIdAndProjectId(variantId, projectId)
                .orElseThrow(() -> new IllegalStateException("VariantQuote not found"));
        if (vq.getQuotedAt() == null) {
            throw new IllegalStateException("La variante debe estar cotizada antes de marcar como diseñada");
        }
        vq.setDesignedAt(Instant.now());
        vq.setDesignerId(designerId);
        return variantQuoteRepository.save(vq);
    }

    /** Desarrollo (datos maestros) marca variante como desarrollada (agregada a SAP). Solo en proyectos efectivos. */
    @Transactional
    public VariantQuote markAsDeveloped(UUID projectId, UUID variantId, UUID developmentUserId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalStateException("Project not found"));
        if (!project.isEffective()) {
            throw new IllegalStateException("Solo se puede marcar desarrollado en proyectos efectivos");
        }
        VariantQuote vq = variantQuoteRepository.findByVariantIdAndProjectId(variantId, projectId)
                .orElseThrow(() -> new IllegalStateException("VariantQuote not found"));
        if (!vq.isEffective()) {
            throw new IllegalStateException("Solo se puede marcar desarrollado en variantes efectivas");
        }
        if (vq.getDesignedAt() == null) {
            throw new IllegalStateException("La variante debe estar diseñada antes de marcar como desarrollada");
        }
        vq.setDevelopedAt(Instant.now());
        vq.setDevelopmentUserId(developmentUserId);
        return variantQuoteRepository.save(vq);
    }
}
