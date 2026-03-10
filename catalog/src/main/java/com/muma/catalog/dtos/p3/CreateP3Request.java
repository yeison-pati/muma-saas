package com.muma.catalog.dtos.p3;

import java.util.List;

public record CreateP3Request(
    List<CreateComponent> components,
    String comment,
    String image
) {}