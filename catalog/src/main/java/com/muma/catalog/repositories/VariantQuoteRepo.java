package com.muma.catalog.repositories;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.muma.catalog.models.VariantQuote;

@Repository
public interface VariantQuoteRepo extends JpaRepository<VariantQuote, UUID> {

    @Query("SELECT vq FROM VariantQuote vq WHERE vq.project.id = :projectId")
    List<VariantQuote> findByProjectId(@org.springframework.data.repository.query.Param("projectId") UUID projectId);

    @Query("SELECT vq FROM VariantQuote vq WHERE vq.variant.id = :variantId")
    List<VariantQuote> findByVariantId(@org.springframework.data.repository.query.Param("variantId") UUID variantId);

    @Query("SELECT vq FROM VariantQuote vq WHERE vq.variant.id = :variantId AND vq.project.id = :projectId")
    Optional<VariantQuote> findByVariantIdAndProjectId(
            @org.springframework.data.repository.query.Param("variantId") UUID variantId,
            @org.springframework.data.repository.query.Param("projectId") UUID projectId);

    @Query("SELECT vq FROM VariantQuote vq WHERE vq.productVariantId = :productVariantId AND vq.project.id = :projectId")
    Optional<VariantQuote> findByProductVariantIdAndProjectId(
            @org.springframework.data.repository.query.Param("productVariantId") UUID productVariantId,
            @org.springframework.data.repository.query.Param("projectId") UUID projectId);

    @Modifying
    @Query("DELETE FROM VariantQuote vq WHERE vq.variant.id = :variantId")
    void deleteByVariantId(UUID variantId);

    @Modifying
    @Query("DELETE FROM VariantQuote vq WHERE vq.variant.id = :variantId AND vq.project.id = :projectId")
    void deleteByVariantIdAndProjectId(UUID variantId, UUID projectId);

    @Modifying
    @Query("DELETE FROM VariantQuote vq WHERE vq.productVariantId = :productVariantId AND vq.project.id = :projectId")
    void deleteByProductVariantIdAndProjectId(
            @org.springframework.data.repository.query.Param("productVariantId") UUID productVariantId,
            @org.springframework.data.repository.query.Param("projectId") UUID projectId);

    @Query("SELECT vq.variant.id FROM VariantQuote vq WHERE vq.type IS NOT NULL AND LOWER(TRIM(vq.type)) IN ('p1', 'p2', 'p3', 'p5')")
    List<UUID> findVariantIdsWithQuoteType();

    @Modifying
    @Query("UPDATE VariantQuote vq SET vq.quantity = :qty WHERE vq.project.id = :projectId AND vq.variant.id = :variantId")
    int updateQuantity(
            @org.springframework.data.repository.query.Param("projectId") UUID projectId,
            @org.springframework.data.repository.query.Param("variantId") UUID variantId,
            @org.springframework.data.repository.query.Param("qty") int qty);

    @Modifying
    @Query("UPDATE VariantQuote vq SET vq.quantity = :qty WHERE vq.project.id = :projectId AND vq.productVariantId = :variantId")
    int updateQuantityByProductVariantId(
            @org.springframework.data.repository.query.Param("projectId") UUID projectId,
            @org.springframework.data.repository.query.Param("variantId") UUID variantId,
            @org.springframework.data.repository.query.Param("qty") int qty);

    @Modifying
    @Query("UPDATE VariantQuote vq SET vq.comments = COALESCE(:comments, vq.comments), vq.type = COALESCE(:type, vq.type) WHERE vq.project.id = :projectId AND vq.variant.id = :variantId")
    int updateCommentsAndType(
            @org.springframework.data.repository.query.Param("projectId") UUID projectId,
            @org.springframework.data.repository.query.Param("variantId") UUID variantId,
            @org.springframework.data.repository.query.Param("comments") String comments,
            @org.springframework.data.repository.query.Param("type") String type);

    @Modifying
    @Query("UPDATE VariantQuote vq SET vq.comments = COALESCE(:comments, vq.comments), vq.type = COALESCE(:type, vq.type) WHERE vq.project.id = :projectId AND vq.productVariantId = :variantId")
    int updateCommentsAndTypeByProductVariantId(
            @org.springframework.data.repository.query.Param("projectId") UUID projectId,
            @org.springframework.data.repository.query.Param("variantId") UUID variantId,
            @org.springframework.data.repository.query.Param("comments") String comments,
            @org.springframework.data.repository.query.Param("type") String type);

    @Modifying
    @Query("UPDATE VariantQuote vq SET vq.type = null WHERE vq.project.id = :projectId AND vq.variant.id = :variantId")
    int clearType(@org.springframework.data.repository.query.Param("projectId") UUID projectId,
            @org.springframework.data.repository.query.Param("variantId") UUID variantId);

    @Modifying
    @Query("UPDATE VariantQuote vq SET vq.type = null WHERE vq.project.id = :projectId AND vq.productVariantId = :variantId")
    int clearTypeByProductVariantId(@org.springframework.data.repository.query.Param("projectId") UUID projectId,
            @org.springframework.data.repository.query.Param("variantId") UUID variantId);

    @Modifying(clearAutomatically = true)
    @Query("UPDATE VariantQuote vq SET vq.price = 0, vq.elaborationTime = 0, vq.criticalMaterial = null WHERE vq.variant.id = :variantId")
    int resetQuoteByVariantId(@org.springframework.data.repository.query.Param("variantId") UUID variantId);

    /** Resetea precio/cotización de todas las variantes del proyecto (para reabrir correctamente al primer intento). */
    @Modifying(clearAutomatically = true)
    @Query("UPDATE VariantQuote vq SET vq.price = 0, vq.elaborationTime = 0, vq.criticalMaterial = null WHERE vq.project.id = :projectId")
    int resetQuoteByProjectId(@org.springframework.data.repository.query.Param("projectId") UUID projectId);

    /** IDs de proyectos con al menos una variante asignada a este cotizador. */
    @Query("SELECT DISTINCT vq.project.id FROM VariantQuote vq WHERE vq.assignedQuoterId = :quoterId")
    List<UUID> findProjectIdsByAssignedQuoterId(@org.springframework.data.repository.query.Param("quoterId") UUID quoterId);

    /** IDs de proyectos con al menos una variante asignada a este diseñador. */
    @Query("SELECT DISTINCT vq.project.id FROM VariantQuote vq WHERE vq.assignedDesignerId = :designerId")
    List<UUID> findProjectIdsByAssignedDesignerId(@org.springframework.data.repository.query.Param("designerId") UUID designerId);

    /** IDs de proyectos con al menos una variante asignada a este usuario de desarrollo. */
    @Query("SELECT DISTINCT vq.project.id FROM VariantQuote vq WHERE vq.assignedDevelopmentUserId = :userId")
    List<UUID> findProjectIdsByAssignedDevelopmentUserId(@org.springframework.data.repository.query.Param("userId") UUID userId);
}
