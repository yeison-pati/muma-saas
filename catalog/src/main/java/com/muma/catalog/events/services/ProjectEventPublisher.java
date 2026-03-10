package com.muma.catalog.events.services;

import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

import com.muma.catalog.events.dtos.ProjectCreated;

import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
public class ProjectEventPublisher {

    private final RabbitTemplate rabbitTemplate;

    public void projectCreated(
            UUID projectId,
            LocalDateTime createdAt,
            UUID salesId,
            UUID quoterId,
            Integer variantsCount
    ) {
        ProjectCreated event = new ProjectCreated(
                UUID.randomUUID(),
                createdAt,
                projectId,
                salesId,
                quoterId,
                variantsCount
        );
        rabbitTemplate.convertAndSend("system.events", "project.created", event);
    }
}
