package com.muma.catalog.graphql;

import java.util.List;

public record AddVariantToBaseInput(
        String baseCode,
        String sapRef,
        List<CreateBaseInitialComponentInput> components) {}
