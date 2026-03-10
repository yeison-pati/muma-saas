package com.muma.catalog.graphql;

public record CreateBaseInitialComponentInput(
        String componentId,
        String componentSapRef,
        String componentSapCode,
        String componentValue) {}
