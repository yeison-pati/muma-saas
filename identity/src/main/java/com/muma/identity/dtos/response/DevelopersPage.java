package com.muma.identity.dtos.response;

import java.util.List;

public record DevelopersPage(List<DeveloperResponse> items, PageInfo pageInfo) {}
