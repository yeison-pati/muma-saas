package com.muma.threads.dtos;

import com.muma.threads.models.Thread;

import java.util.UUID;

public record ThreadResponse(
        UUID id,
        UUID projectId,
        UUID variantId,
        String type,
        String openedAt,
        String closedAt,
        UUID openedBy,
        UUID closedBy
) {
    public static ThreadResponse from(Thread t) {
        return new ThreadResponse(
                t.getId(),
                t.getProjectId(),
                t.getVariantId(),
                t.getType(),
                t.getOpenedAt() != null ? t.getOpenedAt().toString() : null,
                t.getClosedAt() != null ? t.getClosedAt().toString() : null,
                t.getOpenedBy(),
                t.getClosedBy()
        );
    }
}
