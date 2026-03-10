package com.muma.catalog.repositories;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.muma.catalog.models.Variant;

@Repository
public interface VariantRepo extends JpaRepository<Variant, UUID> {

    @Query("SELECT v FROM Variant v WHERE v.baseCode = :baseCode")
    List<Variant> findByBaseCode(@org.springframework.data.repository.query.Param("baseCode") String baseCode);

    @EntityGraph(attributePaths = { "components" })
    @Query("SELECT v FROM Variant v WHERE v.baseCode = :baseCode")
    List<Variant> findByBaseCodeWithComponents(@org.springframework.data.repository.query.Param("baseCode") String baseCode);

    @EntityGraph(attributePaths = { "components" })
    @Query("SELECT v FROM Variant v")
    List<Variant> findAllWithComponents();

    @EntityGraph(attributePaths = { "components" })
    @Query("SELECT v FROM Variant v WHERE v.id = :id")
    java.util.Optional<Variant> findByIdWithComponents(@org.springframework.data.repository.query.Param("id") UUID id);
}
