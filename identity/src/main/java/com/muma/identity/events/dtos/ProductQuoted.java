package com.muma.identity.events.dtos;

import java.time.LocalDateTime;
import java.util.UUID;

public record ProductQuoted(
        UUID eventId,
        LocalDateTime processedAt,
        UUID quoterId,
        Boolean requireUpdate) {
}
