package com.muma.catalog.models;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.hibernate.annotations.BatchSize;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "projects")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Project {

    @Id
    private UUID id;

    private String consecutive;
    private String name;
    private Integer version;
    private String city;
    private String client;

    @Column(name = "client_phone")
    private String clientPhone;

    private String region;

    @Column(name = "sales_name")
    private String salesName;

    @Column(name = "sales_email")
    private String salesEmail;

    @Column(name = "sales_phone")
    private String salesPhone;

    @Column(name = "sales_signature")
    private String salesSignature;

    @Column(name = "sales_job_title")
    private String salesJobTitle;

    @Column(name = "sales_id")
    private UUID salesId;

    @Column(name = "quoter_name")
    private String quoterName;

    @Column(name = "quoter_email")
    private String quoterEmail;

    @Column(name = "quoter_id")
    private UUID quoterId;

    private Integer state;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    /** Fecha/hora exacta de solicitud del proyecto (comercial). Para métricas de tiempo. */
    @Column(name = "requested_at")
    private Instant requestedAt;

    /** Fecha en que todas las variantes del proyecto quedaron diseñadas (P2/P3/P4). Null si aún hay pendientes. */
    @Column(name = "project_designed_at")
    private Instant projectDesignedAt;

    @Column(name = "modified_at")
    private LocalDateTime modifiedAt;

    private boolean quoted;
    private boolean reopen;
    private boolean effective;

    @Column(name = "total_cost")
    private Integer totalCost;

    @Column(name = "estimated_time")
    private Integer estimatedTime;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "project_variants",
        joinColumns = @JoinColumn(name = "project_id"),
        inverseJoinColumns = @JoinColumn(name = "variant_id")
    )
    @Builder.Default
    private Set<Variant> variants = new HashSet<>();

    @OneToMany(mappedBy = "project", cascade = jakarta.persistence.CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @BatchSize(size = 16)
    @Builder.Default
    private List<VariantQuote> variantQuotes = new ArrayList<>();
}
