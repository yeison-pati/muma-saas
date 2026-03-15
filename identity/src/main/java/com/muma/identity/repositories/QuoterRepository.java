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

import com.muma.identity.models.roles.Quoter;

@Repository
public interface QuoterRepository extends JpaRepository<Quoter, UUID> {

    @EntityGraph(attributePaths = { "user" })
    @Query("SELECT q FROM Quoter q")
    List<Quoter> findAllWithUser();

    @EntityGraph(attributePaths = { "user" })
    @Query(value = "SELECT q FROM Quoter q", countQuery = "SELECT COUNT(q) FROM Quoter q")
    Page<Quoter> findAllWithUser(Pageable pageable);

    @Query("SELECT q FROM Quoter q WHERE q.user.id = :userId")
    Optional<Quoter> findByUserId(@Param("userId") UUID userId);

    @Modifying
    @Query("DELETE FROM Quoter q WHERE q.user.id = :userId")
    void deleteByUserId(@Param("userId") UUID userId);
}
