package com.muma.catalog.repositories;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.muma.catalog.models.Thread;

@Repository
public interface ThreadRepository extends JpaRepository<Thread, UUID> {

    @Query("SELECT t FROM Thread t WHERE t.project.id = :projectId ORDER BY t.openedAt DESC")
    List<Thread> findByProjectId(@org.springframework.data.repository.query.Param("projectId") UUID projectId);

    @Query("SELECT t FROM Thread t WHERE t.project.id = :projectId AND t.variant.id = :variantId ORDER BY t.openedAt DESC")
    List<Thread> findByProjectIdAndVariantId(
            @org.springframework.data.repository.query.Param("projectId") UUID projectId,
            @org.springframework.data.repository.query.Param("variantId") UUID variantId);
}
