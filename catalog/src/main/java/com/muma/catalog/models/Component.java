package com.muma.catalog.models;

import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

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
}
