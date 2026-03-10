package com.muma.catalog.graphql;

import java.util.List;

public record CreateProjectInput(
        String name,
        String client,
        String region,
        String salesName,
        String salesEmail,
        String salesPhone,
        String salesSignature,
        String salesJobTitle,
        String salesId,
        String quoterName,
        String quoterEmail,
        String quoterId,
        List<CreateVariantInput> variants,
        List<CreateP3Input> p3s) {}
