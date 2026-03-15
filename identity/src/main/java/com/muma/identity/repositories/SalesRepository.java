package com.muma.identity.repositories;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.muma.identity.models.roles.Sales;

@Repository
public interface SalesRepository extends JpaRepository<Sales, UUID> {

    @EntityGraph(attributePaths = { "user" })
    @Query("SELECT s FROM Sales s")
    List<Sales> findAllWithUser();

    @EntityGraph(attributePaths = { "user" })
    @Query(value = "SELECT s FROM Sales s", countQuery = "SELECT COUNT(s) FROM Sales s")
    Page<Sales> findAllWithUser(Pageable pageable);

    @Query("SELECT s FROM Sales s WHERE s.user.id = :userId")
    Optional<Sales> findByUserId(@Param("userId") UUID userId);

    @Modifying
    @Query("DELETE FROM Sales s WHERE s.user.id = :userId")
    void deleteByUserId(@Param("userId") UUID userId);
}
