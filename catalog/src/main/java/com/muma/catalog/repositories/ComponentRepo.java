package com.muma.catalog.repositories;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.muma.catalog.models.Component;

@Repository
public interface ComponentRepo extends JpaRepository<Component, UUID> {
}
