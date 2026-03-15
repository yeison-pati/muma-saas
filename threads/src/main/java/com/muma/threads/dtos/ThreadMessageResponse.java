package com.muma.threads.dtos;

import com.muma.threads.models.ThreadMessage;

import java.util.UUID;

public record ThreadMessageResponse(
        UUID id,
        UUID threadId,
        UUID userId,
        String content,
        String createdAt
) {
    public static ThreadMessageResponse from(ThreadMessage m) {
        return from(m, m.getThread() != null ? m.getThread().getId() : null);
    }

    /** Evita N+1: usa threadId en lugar de m.getThread().getId() */
    public static ThreadMessageResponse from(ThreadMessage m, UUID threadId) {
        return new ThreadMessageResponse(
                m.getId(),
                threadId != null ? threadId : (m.getThread() != null ? m.getThread().getId() : null),
                m.getUserId(),
                m.getContent(),
                m.getCreatedAt() != null ? m.getCreatedAt().toString() : null
        );
    }
}
