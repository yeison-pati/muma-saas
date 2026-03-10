package com.muma.catalog.dtos.projects;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import com.muma.catalog.dtos.products.ProjectVariantResponse;
import com.muma.catalog.models.Project;

public record ProjectResponse(
        UUID id,
        String consecutive,
        String name,
        Integer version,
        String city,
        String client,
        String clientPhone,
        String region,
        String salesName,
        String salesEmail,
        String salesPhone,
        String salesSignature,
        String salesJobTitle,
        UUID salesId,
        String quoterName,
        String quoterEmail,
        UUID quoterId,
        Integer state,
        LocalDateTime createdAt,
        LocalDateTime modifiedAt,
        boolean quoted,
        boolean reopen,
        boolean effective,
        Integer totalCost,
        Integer estimatedTime,
        List<ProjectVariantResponse> variants) {

        public ProjectResponse(Project project, List<ProjectVariantResponse> variants) {
                this(project.getId(),
                        project.getConsecutive(),
                        project.getName(),
                        project.getVersion(),
                        project.getCity(),
                        project.getClient(),
                        project.getClientPhone(),
                        project.getRegion(),
                        project.getSalesName(),
                        project.getSalesEmail(),
                        project.getSalesPhone(),
                        project.getSalesSignature(),
                        project.getSalesJobTitle(),
                        project.getSalesId(),
                        project.getQuoterName(),
                        project.getQuoterEmail(),
                        project.getQuoterId(),
                        project.getState(),
                        project.getCreatedAt(),
                        project.getModifiedAt(),
                        project.isQuoted(),
                        project.isReopen(),
                        project.isEffective(),
                        project.getTotalCost(),
                        project.getEstimatedTime(),
                        variants);
        }
    
}
