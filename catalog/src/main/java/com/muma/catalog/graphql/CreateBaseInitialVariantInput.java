package com.muma.catalog.graphql;

import java.util.List;

public record CreateBaseInitialVariantInput(
        String sapRef,
        List<CreateBaseInitialComponentInput> components) {}
