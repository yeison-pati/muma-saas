package com.muma.products.models;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

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

@Entity
@Table(name = "bases")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Base {

    @Id
    private UUID id;

    @OneToMany(mappedBy = "base", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Variant> variants = new ArrayList<>();

    private String code;
    private String name;
    private String image;
    private String model;
    private String category;
    private String subcategory;
    private String space;
    private String line;

    @Column(name = "base_material")
    private String baseMaterial;

    @Column(name = "creator_name")
    private String creatorName;

    @Column(name = "creator_id")
    private UUID creatorId;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "editor_name")
    private String editorName;

    @Column(name = "editor_id")
    private UUID editorId;

    @Column(name = "edited_at")
    private LocalDateTime editedAt;
}
