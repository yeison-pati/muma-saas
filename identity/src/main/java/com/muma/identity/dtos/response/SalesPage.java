package com.muma.identity.dtos.response;

import java.util.List;

public record SalesPage(List<SalesResponse> items, PageInfo pageInfo) {}
