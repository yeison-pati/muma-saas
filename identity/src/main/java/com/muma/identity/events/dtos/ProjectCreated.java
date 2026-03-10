package com.muma.identity.events.dtos;

import java.time.LocalDateTime;
import java.util.UUID;

public record ProjectCreated(
    UUID eventId,
    LocalDateTime processedAt,
    UUID projectId,
    UUID salesId,
    UUID quoterId,
    Integer products
) {}
