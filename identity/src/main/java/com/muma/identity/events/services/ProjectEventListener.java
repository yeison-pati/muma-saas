package com.muma.identity.events.services;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.muma.identity.config.app.RabbitConfig;
import com.muma.identity.events.dtos.ProjectCreated;
import com.muma.identity.models.ProcessedEvent;
import com.muma.identity.repositories.ProcessedEventRepository;
import com.muma.identity.repositories.QuoterRepository;
import com.muma.identity.repositories.SalesRepository;

import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
public class ProjectEventListener {

    private final QuoterRepository quoterRepository;
    private final SalesRepository salesRepository;
    private final ProcessedEventRepository processedEventRepository;

    @RabbitListener(queues = RabbitConfig.QUEUE)
    @Transactional
    public void onProjectCreated(ProjectCreated event) {
        try {
            processedEventRepository.save(ProcessedEvent.builder()
                    .eventId(event.eventId())
                    .processedAt(event.processedAt() != null ? event.processedAt().toString() : null)
                    .build());
        } catch (DataIntegrityViolationException e) {
            return; // evento ya procesado
        }

        quoterRepository.findByUserId(event.quoterId()).ifPresent(quoter -> {
            quoter.setProjects(quoter.getProjects() + 1);
            quoter.setProducts(quoter.getProducts() + event.products());
            quoterRepository.save(quoter);
        });

        salesRepository.findByUserId(event.salesId()).ifPresent(sales -> {
            sales.setRequested(sales.getRequested() + 1);
            salesRepository.save(sales);
        });
    }
}
