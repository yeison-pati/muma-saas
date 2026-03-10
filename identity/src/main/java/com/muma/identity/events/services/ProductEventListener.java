package com.muma.identity.events.services;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.muma.identity.config.app.RabbitConfig;
import com.muma.identity.events.dtos.ProductQuoted;
import com.muma.identity.models.ProcessedEvent;
import com.muma.identity.repositories.ProcessedEventRepository;
import com.muma.identity.repositories.QuoterRepository;

import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
public class ProductEventListener {

    private final QuoterRepository quoterRepository;
    private final ProcessedEventRepository processedEventRepository;

    @RabbitListener(queues = RabbitConfig.QUEUE)
    @Transactional
    public void onProductQuoted(ProductQuoted event) {
        try {
            processedEventRepository.save(ProcessedEvent.builder()
                    .eventId(event.eventId())
                    .processedAt(event.processedAt() != null ? event.processedAt().toString() : null)
                    .build());
        } catch (DataIntegrityViolationException e) {
            return; // evento ya procesado
        }

        if (Boolean.TRUE.equals(event.requireUpdate())) {
            quoterRepository.findByUserId(event.quoterId()).ifPresent(quoter -> {
                quoter.setQuoted(quoter.getQuoted() + 1);
                quoterRepository.save(quoter);
            });
        }
    }
}
