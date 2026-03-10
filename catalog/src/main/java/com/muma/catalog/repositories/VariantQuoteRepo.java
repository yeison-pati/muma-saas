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

    @Modifying
    @Query("DELETE FROM VariantQuote vq WHERE vq.variant.id = :variantId")
    void deleteByVariantId(UUID variantId);

    @Modifying
    @Query("DELETE FROM VariantQuote vq WHERE vq.variant.id = :variantId AND vq.project.id = :projectId")
    void deleteByVariantIdAndProjectId(UUID variantId, UUID projectId);

    @Query("SELECT vq.variant.id FROM VariantQuote vq WHERE vq.type IS NOT NULL AND LOWER(TRIM(vq.type)) IN ('p1', 'p2', 'p3')")
    List<UUID> findVariantIdsWithQuoteType();

    @Modifying
    @Query("UPDATE VariantQuote vq SET vq.quantity = :qty WHERE vq.project.id = :projectId AND vq.variant.id = :variantId")
    int updateQuantity(
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
    @Query("UPDATE VariantQuote vq SET vq.price = 0, vq.elaborationTime = 0, vq.criticalMaterial = null WHERE vq.variant.id = :variantId")
    int resetQuoteByVariantId(@org.springframework.data.repository.query.Param("variantId") UUID variantId);
}
