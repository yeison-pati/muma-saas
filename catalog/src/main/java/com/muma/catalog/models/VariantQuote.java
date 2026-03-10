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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "variant_id")
    private Variant variant;

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
}
