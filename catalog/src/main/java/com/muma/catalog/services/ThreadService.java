package com.muma.catalog.services;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.muma.catalog.models.Project;
import com.muma.catalog.models.Thread;
import com.muma.catalog.models.Variant;
import com.muma.catalog.repositories.ProjectRepository;
import com.muma.catalog.repositories.ThreadRepository;
import com.muma.catalog.repositories.VariantRepo;

import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
public class ThreadService {

    private final ThreadRepository threadRepository;
    private final ProjectRepository projectRepository;
    private final VariantRepo variantRepo;

    @Transactional
    public Thread open(UUID projectId, UUID variantId, String type, UUID openedBy) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalStateException("Project not found"));
        Variant variant = variantId != null
                ? variantRepo.findById(variantId).orElse(null)
                : null;
        if (!"COMMERCIAL_DESIGN".equals(type) && !"COMMERCIAL_DEVELOPMENT".equals(type)) {
            throw new IllegalArgumentException("Tipo debe ser COMMERCIAL_DESIGN o COMMERCIAL_DEVELOPMENT");
        }
        Thread t = Thread.builder()
                .id(UUID.randomUUID())
                .project(project)
                .variant(variant)
                .type(type)
                .openedAt(Instant.now())
                .closedAt(null)
                .openedBy(openedBy)
                .closedBy(null)
                .build();
        return threadRepository.save(t);
    }

    @Transactional
    public Thread close(UUID threadId, UUID closedBy) {
        Thread t = threadRepository.findById(threadId)
                .orElseThrow(() -> new IllegalStateException("Thread not found"));
        if (t.getClosedAt() != null) {
            throw new IllegalStateException("El hilo ya está cerrado");
        }
        t.setClosedAt(Instant.now());
        t.setClosedBy(closedBy);
        return threadRepository.save(t);
    }

    public List<Thread> findByProject(UUID projectId) {
        return threadRepository.findByProjectId(projectId);
    }

    public List<Thread> findByProjectAndVariant(UUID projectId, UUID variantId) {
        return threadRepository.findByProjectIdAndVariantId(projectId, variantId);
    }
}
