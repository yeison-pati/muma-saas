package com.muma.catalog.repositories;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.muma.catalog.models.Base;

@Repository
public interface BaseRepo extends JpaRepository<Base, UUID> {

    @Query("SELECT b FROM Base b WHERE b.code = :code")
    Optional<Base> findByCode(@Param("code") String code);
}
