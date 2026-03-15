package com.muma.products.repositories;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.muma.products.models.Variant;

@Repository
public interface VariantRepository extends JpaRepository<Variant, UUID> {

    @EntityGraph(attributePaths = { "components" })
    @Query("SELECT v FROM Variant v WHERE v.base.id = :baseId")
    List<Variant> findByBaseIdWithComponents(@Param("baseId") UUID baseId);

    @EntityGraph(attributePaths = { "components" })
    @Query("SELECT v FROM Variant v WHERE v.id = :id")
    Optional<Variant> findByIdWithComponents(@Param("id") UUID id);

    List<Variant> findByBaseId(UUID baseId);

    long countByBaseId(UUID baseId);
}
