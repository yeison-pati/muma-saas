package com.muma.catalog.events.services;

import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

import com.muma.catalog.events.dtos.ProductQuoted;

import lombok.AllArgsConstructor;
import reactor.core.publisher.Mono;

@Service
@AllArgsConstructor
public class ProductEventPublisher {
    private final RabbitTemplate rabbitTemplate;

    public void productQuoted(UUID quoterId, Boolean requireUpdate) {
        ProductQuoted event = new ProductQuoted(
                UUID.randomUUID(),
                LocalDateTime.now(),
                quoterId,
                requireUpdate);
        rabbitTemplate.convertAndSend("system.events", "product.quoted", event);
    }
}