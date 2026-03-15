package com.muma.identity.dtos.response;

import java.util.List;

public record DesignersPage(List<DesignerResponse> items, PageInfo pageInfo) {}
