package com.muma.catalog.models;

import java.time.Instant;
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
 * Hilo de comunicación entre Comercial y Diseño, o Comercial y Desarrollo.
 * Filtrable por proyecto/consecutivo. El tiempo (openedAt → closedAt) se suma
 * como tiempo de elaboración disponible para métricas.
 */
@Entity
@Table(name = "project_threads")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Thread {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    /** Variante opcional: si se especifica, el hilo aplica a esa variante. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "variant_id")
    private Variant variant;

    /** COMMERCIAL_DESIGN o COMMERCIAL_DEVELOPMENT */
    @Column(name = "type", nullable = false)
    private String type;

    @Column(name = "opened_at", nullable = false)
    private Instant openedAt;

    @Column(name = "closed_at")
    private Instant closedAt;

    @Column(name = "opened_by")
    private UUID openedBy;

    @Column(name = "closed_by")
    private UUID closedBy;
}
