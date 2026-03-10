package com.muma.catalog.graphql;

import java.util.List;

public record CreateP3Input(
        String comment,
        String image,
        List<CreateComponentInput> components) {}
