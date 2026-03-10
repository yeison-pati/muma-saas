package com.muma.catalog.graphql;

import java.util.List;

public record UpdateVariantInput(
        String id,
        String sapRef,
        List<CreateBaseInitialComponentInput> components) {}
