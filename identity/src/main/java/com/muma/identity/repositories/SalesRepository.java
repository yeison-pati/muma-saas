package com.muma.identity.repositories;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.muma.identity.models.roles.Sales;

@Repository
public interface SalesRepository extends JpaRepository<Sales, UUID> {

    @Query("SELECT s FROM Sales s WHERE s.user.id = :userId")
    Optional<Sales> findByUserId(@Param("userId") UUID userId);

    @Modifying
    @Query("DELETE FROM Sales s WHERE s.user.id = :userId")
    void deleteByUserId(@Param("userId") UUID userId);
}
