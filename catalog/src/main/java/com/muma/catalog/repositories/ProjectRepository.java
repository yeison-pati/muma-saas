package com.muma.catalog.repositories;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.muma.catalog.models.Project;

@Repository
public interface ProjectRepository extends JpaRepository<Project, UUID> {

    @EntityGraph(attributePaths = { "variantQuotes", "variantQuotes.variant" })
    @Query("SELECT DISTINCT p FROM Project p")
    List<Project> findAllWithVariantsAndQuotes();

    @EntityGraph(attributePaths = { "variantQuotes", "variantQuotes.variant" })
    @Query("SELECT DISTINCT p FROM Project p WHERE p.salesId = :salesId")
    List<Project> findBySalesIdWithVariants(@Param("salesId") UUID salesId);

    @EntityGraph(attributePaths = { "variantQuotes", "variantQuotes.variant" })
    @Query("SELECT DISTINCT p FROM Project p WHERE p.quoterId = :quoterId")
    List<Project> findByQuoterIdWithVariants(@Param("quoterId") UUID quoterId);

    @Query("SELECT p FROM Project p WHERE p.salesId = :salesId")
    List<Project> findBySalesId(@Param("salesId") UUID salesId);

    @Query("SELECT p FROM Project p WHERE p.quoterId = :quoterId")
    List<Project> findByQuoterId(@Param("quoterId") UUID quoterId);

    @Query("SELECT p FROM Project p WHERE p.region = :region")
    List<Project> findByRegion(@Param("region") String region);

    @Query("SELECT p FROM Project p JOIN p.variants v WHERE v.id = :variantId")
    List<Project> findProjectsContainingVariant(@Param("variantId") UUID variantId);

    @EntityGraph(attributePaths = { "variantQuotes", "variantQuotes.variant" })
    @Query("SELECT DISTINCT p FROM Project p WHERE p.id IN :ids")
    List<Project> findAllByIdWithVariantsAndQuotes(@Param("ids") List<UUID> ids);

    @EntityGraph(attributePaths = { "variants" })
    @Query("SELECT p FROM Project p JOIN p.variants v WHERE v.id = :variantId")
    List<Project> findProjectsContainingVariantWithVariants(@Param("variantId") UUID variantId);
}
