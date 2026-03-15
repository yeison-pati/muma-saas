package com.muma.catalog.models;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.hibernate.annotations.BatchSize;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Variante del catálogo. Solo creada por diseñador.
 * components = originales (value = originalValue).
 * Proyectos referencian esta variante; overrides van en VariantQuote.
 */
@Entity
@Table(name = "variants")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Variant {

    @Id
    private UUID id;

    @Column(name = "base_code")
    private String baseCode;

    @Column(name = "sap_ref")
    private String sapRef;

    @Column(name = "sap_code")
    private String sapCode;

    private String status;

    /** Si no null: es un clon creado para un proyecto (P1/P2/P3). No listar en catálogo. */
    @Column(name = "source_variant_id")
    private UUID sourceVariantId;

    /** Si no null: variante original en servicio Products. Para comparación. */
    @Column(name = "product_variant_id")
    private UUID productVariantId;

    @OneToMany(mappedBy = "variant", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @BatchSize(size = 32)
    @Builder.Default
    private List<Component> components = new ArrayList<>();

    @OneToMany(mappedBy = "variant", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<VariantQuote> variantQuotes = new ArrayList<>();
}
