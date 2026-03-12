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

/**
 * Estándares de tiempo por tipología (P1-P5, P) para métricas de cumplimiento.
 * DIAS-COTIZ, DIAS-DISEÑO, DIAS-DLLO según tabla de referencia.
 */
@Entity
@Table(name = "typology_standards")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TypologyStandard {

    @Id
    private UUID id;

    /** p1, p2, p3, p4, p5, p (portafolio) */
    @Column(name = "tipologia", unique = true, nullable = false)
    private String tipologia;

    /** Días estándar para cotización */
    @Column(name = "days_cotiz", nullable = false)
    private int daysCotiz;

    /** Días estándar para diseño */
    @Column(name = "days_diseno", nullable = false)
    private int daysDiseno;

    /** Días estándar para desarrollo. Null si usa hours_per_week (P portafolio). */
    @Column(name = "days_desarrollo")
    private Integer daysDesarrollo;

    /** Horas/semana para desarrollo (solo P portafolio). Null para P1-P5. */
    @Column(name = "hours_per_week")
    private Integer hoursPerWeek;
}
