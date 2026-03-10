package com.muma.catalog.graphql;

public record UpdateProjectInput(
        String id,
        String name,
        String client,
        String region,
        Integer state,
        Integer totalCost,
        Integer estimatedTime) {}
