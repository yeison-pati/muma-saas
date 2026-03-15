package com.muma.products.repositories;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.muma.products.models.Component;

@Repository
public interface ComponentRepository extends JpaRepository<Component, UUID> {

    List<Component> findByVariantId(UUID variantId);
}
