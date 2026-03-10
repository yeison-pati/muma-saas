package com.muma.catalog.models;

import jakarta.persistence.Embeddable;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Embeddable: valor de un componente en una variante.
 * Sustituye la entidad intermedia VariantComponent.
 */
@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ComponentValue {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "component_id")
    private Component component;

    private String value;
}
