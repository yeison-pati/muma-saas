package com.muma.catalog.models;

import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Componente con value integrado (reemplaza ComponentValue).
 * - variant_id != null: componente original del catálogo (diseñador).
 * - variant_quote_id != null: override creado al editar en proyecto.
 * SAP visible solo si value.equals(originalValue).
 */
@Entity
@Table(name = "components")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Component {

    @Id
    private UUID id;

    @Column(name = "sap_ref")
    private String sapRef;

    @Column(name = "sap_code")
    private String sapCode;

    private String name;

    private String value;

    @Column(name = "original_value")
    private String originalValue;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "variant_id")
    private Variant variant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "variant_quote_id")
    private VariantQuote variantQuote;
}
