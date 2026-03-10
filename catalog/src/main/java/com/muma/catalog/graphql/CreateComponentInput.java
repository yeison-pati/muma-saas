package com.muma.catalog.graphql;

public record CreateComponentInput(
        String componentId,
        String componentSapRef,
        String componentValue,
        Boolean modified,
        String componentName) {}
