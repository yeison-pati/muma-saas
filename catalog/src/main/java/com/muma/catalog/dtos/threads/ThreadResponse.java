package com.muma.catalog.dtos.threads;

import java.util.UUID;

import com.muma.catalog.models.Thread;

public record ThreadResponse(
        UUID id,
        UUID projectId,
        UUID variantId,
        String type,
        String openedAt,
        String closedAt,
        UUID openedBy,
        UUID closedBy) {

    public static ThreadResponse from(Thread t) {
        return new ThreadResponse(
                t.getId(),
                t.getProject().getId(),
                t.getVariant() != null ? t.getVariant().getId() : null,
                t.getType(),
                t.getOpenedAt() != null ? t.getOpenedAt().toString() : null,
                t.getClosedAt() != null ? t.getClosedAt().toString() : null,
                t.getOpenedBy(),
                t.getClosedBy());
    }
}
