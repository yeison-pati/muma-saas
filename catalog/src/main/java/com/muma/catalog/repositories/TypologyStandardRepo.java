package com.muma.catalog.repositories;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.muma.catalog.models.TypologyStandard;

public interface TypologyStandardRepo extends JpaRepository<TypologyStandard, UUID> {

    Optional<TypologyStandard> findByTipologiaIgnoreCase(String tipologia);
}
