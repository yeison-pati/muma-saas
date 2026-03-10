package com.muma.catalog.graphql;

public record CreateBaseInitialComponentInput(
        String componentId,
        String componentName,
        String componentSapRef,
        String componentSapCode,
        String componentValue) {}
