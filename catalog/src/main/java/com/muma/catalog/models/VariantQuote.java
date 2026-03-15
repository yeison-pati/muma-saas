package com.muma.catalog.models;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.hibernate.annotations.BatchSize;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "variant_quote", uniqueConstraints = {
    @UniqueConstraint(name = "uk_variant_quote_project_variant", columnNames = {"project_id", "variant_id"})
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VariantQuote {

    @Id
    private UUID id;

    /** Variante en catalog (legacy). Null si se usa product_variant_id. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "variant_id")
    private Variant variant;

    /** Variante en Products. Fuente de verdad cuando no null. */
    @Column(name = "product_variant_id")
    private UUID productVariantId;

    /** Base code para P4 (front enriquece desde context). */
    @Column(name = "base_code")
    private String baseCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    private Project project;

    /** Overrides de componentes al editar en proyecto. Cargado lazy; @BatchSize evita N+1. */
    @OneToMany(mappedBy = "variantQuote", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @BatchSize(size = 32)
    @Builder.Default
    private List<Component> componentOverrides = new ArrayList<>();

    @Column(name = "quoter_id")
    private UUID quoterId;

    private String type;

    @Column(name = "critical_material")
    private String criticalMaterial;

    private String comments;

    @Column(name = "image")
    private String image;

    @Column(name = "elaboration_time")
    private Integer elaborationTime;

    private Integer quantity;

    private Integer price;

    /** Si true: variante marcada efectiva. Proyecto efectivo lista solo estas. */
    @Builder.Default
    private boolean effective = false;

    /** Fecha/hora exacta en que el cotizador terminó de cotizar. Para métricas. */
    @Column(name = "quoted_at")
    private Instant quotedAt;

    /** Fecha/hora en que el diseñador marcó como diseñado. P1: puede ser = quotedAt. */
    @Column(name = "designed_at")
    private Instant designedAt;

    /** Fecha/hora en que desarrollo (datos maestros) marcó como desarrollado (agregado a SAP). */
    @Column(name = "developed_at")
    private Instant developedAt;

    /** ID del diseñador que marcó como diseñado. */
    @Column(name = "designer_id")
    private UUID designerId;

    /** ID del usuario de desarrollo que marcó como desarrollado. */
    @Column(name = "development_user_id")
    private UUID developmentUserId;

    /** Asignado por líder: cotizador responsable. */
    @Column(name = "assigned_quoter_id")
    private UUID assignedQuoterId;

    /** Asignado por líder: diseñador responsable. */
    @Column(name = "assigned_designer_id")
    private UUID assignedDesignerId;

    /** Asignado por líder: desarrollo responsable. */
    @Column(name = "assigned_development_user_id")
    private UUID assignedDevelopmentUserId;
}
