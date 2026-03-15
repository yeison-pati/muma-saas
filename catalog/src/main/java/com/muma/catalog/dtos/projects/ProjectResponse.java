package com.muma.catalog.dtos.projects;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import com.muma.catalog.dtos.products.ProjectVariantResponse;
import com.muma.catalog.models.Project;

/** createdAt y consecutive no pueden ser null (GraphQL schema los marca como required). */
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
        String requestedAt,
        List<ProjectVariantResponse> variants) {

        public ProjectResponse(Project project, List<ProjectVariantResponse> variants) {
                this(project.getId(),
                        project.getConsecutive() != null ? project.getConsecutive() : "",
                        project.getName() != null ? project.getName() : "",
                        project.getVersion() != null ? project.getVersion() : 1,
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
                        project.getState() != null ? project.getState() : 0,
                        project.getCreatedAt() != null ? project.getCreatedAt() : LocalDateTime.now(),
                        project.getModifiedAt(),
                        project.isQuoted(),
                        project.isReopen(),
                        project.isEffective(),
                        project.getTotalCost(),
                        project.getEstimatedTime(),
                        project.getRequestedAt() != null ? project.getRequestedAt().toString() : null,
                        variants != null ? variants : List.of());
        }
    
}
