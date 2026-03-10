package com.muma.catalog.services;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.muma.catalog.dtos.projects.CreateProject;
import com.muma.catalog.dtos.projects.ProjectStateUpdate;
import com.muma.catalog.models.Project;
import com.muma.catalog.models.VariantQuote;
import com.muma.catalog.repositories.ProjectRepository;
import com.muma.catalog.repositories.ProjectSequenceRepository;

import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectSequenceRepository sequenceRepository;

    public String generateNextConsecutivo() {
        String prefix = LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE);
        Integer seq = sequenceRepository.nextDailySequence();
        if (seq != null && seq > 99) {
            throw new RuntimeException("No hay consecutivos disponibles para la fecha " + prefix);
        }
        return prefix + String.format("%02d", seq != null ? seq : 1);
    }

    @Transactional
    public Project create(CreateProject project, String consecutive) {
        return projectRepository.save(
                Project.builder()
                        .id(UUID.randomUUID())
                        .consecutive(consecutive)
                        .name(project.name())
                        .version(1)
                        .client(project.client())
                        .region(project.region())
                        .salesName(project.salesName())
                        .salesEmail(project.salesEmail())
                        .salesPhone(project.salesPhone())
                        .salesSignature(project.salesSignature())
                        .salesJobTitle(project.salesJobTitle())
                        .salesId(project.salesId())
                        .quoterName(project.quoterName())
                        .quoterEmail(project.quoterEmail())
                        .quoterId(project.quoterId())
                        .state(0)
                        .createdAt(LocalDateTime.now())
                        .quoted(false)
                        .reopen(false)
                        .effective(false)
                        .estimatedTime(0)
                        .totalCost(0)
                        .build());
    }

    @Transactional
    public Boolean makeEffective(UUID projectId) {
        return projectRepository.findById(projectId)
                .map(project -> {
                    project.setEffective(!project.isEffective());
                    project.setVersion(project.getVersion() + 1);
                    projectRepository.save(project);
                    return true;
                })
                .orElse(false);
    }

    public List<Project> getAll() {
        return projectRepository.findAllWithVariantsAndQuotes();
    }

    public Project getById(UUID projectId) {
        return projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalStateException("Project not found"));
    }

    public List<Project> getBySalesId(UUID salesId) {
        return projectRepository.findBySalesIdWithVariants(salesId);
    }

    public List<Project> getByQuoterId(UUID quoterId) {
        return projectRepository.findByQuoterIdWithVariants(quoterId);
    }

    public List<Project> getByRegion(String region) {
        return projectRepository.findByRegion(region);
    }

    @Transactional
    @CacheEvict(value = "projects", allEntries = true)
    public Project update(Project project) {
        return projectRepository.save(project);
    }

    @Transactional
    @CacheEvict(value = "projects", allEntries = true)
    public Boolean delete(UUID projectId) {
        try {
            return projectRepository.findById(projectId)
                    .map(project -> {
                        projectRepository.delete(project);
                        return true;
                    })
                    .orElse(false);
        } catch (Exception e) {
            return false;
        }
    }

    @Transactional
    public Boolean toggleProjectQuotedState(UUID projectId) {
        return projectRepository.findById(projectId)
                .map(project -> {
                    project.setQuoted(!project.isQuoted());
                    projectRepository.save(project);
                    return true;
                })
                .orElse(false);
    }

    @Transactional
    public Boolean toggleProjectEffectiveState(UUID projectId) {
        return projectRepository.findById(projectId)
                .map(project -> {
                    project.setEffective(!project.isEffective());
                    projectRepository.save(project);
                    return true;
                })
                .orElse(false);
    }

    @Transactional
    public ProjectStateUpdate updateStateByQuote(UUID projectId, List<VariantQuote> products) {
        if (products.isEmpty()) {
            Project project = projectRepository.findById(projectId)
                    .orElseThrow(() -> new IllegalStateException("Project not found"));
            project.setState(0);
            project.setTotalCost(0);
            project.setEstimatedTime(0);
            project.setQuoted(false);
            projectRepository.save(project);
            return new ProjectStateUpdate(project, false);
        }
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalStateException("Project not found"));

        long totalCost = products.stream()
                .filter(p -> p.getPrice() != null && p.getPrice() > 0)
                .mapToLong(p -> {
                    int qty = (p.getQuantity() != null && p.getQuantity() > 0) ? p.getQuantity() : 1;
                    return (long) p.getPrice() * qty;
                })
                .sum();
        long estimatedTime = products.stream()
                .filter(p -> p.getElaborationTime() != null && p.getElaborationTime() > 0)
                .mapToLong(p -> {
                    int qty = (p.getQuantity() != null && p.getQuantity() > 0) ? p.getQuantity() : 1;
                    return (long) p.getElaborationTime() * qty;
                })
                .sum();
        long quotedCount = products.stream()
                .filter(p -> p.getPrice() != null && p.getPrice() > 0)
                .count();
        int percentQuoted = (int) ((quotedCount * 100) / products.size());

        boolean wasQuoted = project.isQuoted();
        project.setState(percentQuoted);
        project.setTotalCost((int) totalCost);
        project.setEstimatedTime((int) estimatedTime);
        if (percentQuoted == 100) {
            project.setQuoted(true);
            project.setReopen(false);
        } else {
            project.setQuoted(false);
        }
        Project saved = projectRepository.save(project);
        return new ProjectStateUpdate(saved, !wasQuoted && saved.isQuoted());
    }

    @Transactional
    public Boolean reOpen(UUID projectId) {
        return projectRepository.findById(projectId)
                .map(project -> {
                    project.setReopen(true);
                    project.setQuoted(false);
                    project.setVersion(project.getVersion() + 1);
                    projectRepository.save(project);
                    return true;
                })
                .orElse(false);
    }
}
