package com.muma.catalog.models;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import jakarta.persistence.CascadeType;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

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

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "variant_components", joinColumns = @JoinColumn(name = "variant_id"))
    @Builder.Default
    private List<ComponentValue> componentValues = new ArrayList<>();

    @OneToMany(mappedBy = "variant", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<VariantQuote> variantQuotes = new ArrayList<>();
}
