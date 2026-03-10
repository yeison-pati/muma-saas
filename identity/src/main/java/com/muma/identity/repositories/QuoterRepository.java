package com.muma.identity.repositories;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.muma.identity.models.roles.Quoter;

@Repository
public interface QuoterRepository extends JpaRepository<Quoter, UUID> {

    @Query("SELECT q FROM Quoter q WHERE q.user.id = :userId")
    Optional<Quoter> findByUserId(@Param("userId") UUID userId);

    @Modifying
    @Query("DELETE FROM Quoter q WHERE q.user.id = :userId")
    void deleteByUserId(@Param("userId") UUID userId);
}
