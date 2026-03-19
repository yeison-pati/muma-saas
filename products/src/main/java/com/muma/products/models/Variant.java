package com.muma.products.models;

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

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Variante original del catálogo. Diseñador crea/edita/elimina.
 * Sin variantQuotes ni sourceVariantId.
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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "base_id", nullable = false)
    private Base base;

    @Column(name = "sap_ref")
    private String sapRef;

    @Column(name = "sap_code")
    private String sapCode;

    private String status;

    /** Clave MinIO de imagen de esta variante (color / acabado). */
    private String image;

    /** Clave MinIO de modelo 3D/CAD (GLB, GLTF, DWG, etc.). */
    private String model;

    @OneToMany(mappedBy = "variant", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @BatchSize(size = 32)
    @Builder.Default
    private List<Component> components = new ArrayList<>();
}
