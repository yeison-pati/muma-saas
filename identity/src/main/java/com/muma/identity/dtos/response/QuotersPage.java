package com.muma.identity.dtos.response;

import java.util.List;

public record QuotersPage(List<QuoterResponse> items, PageInfo pageInfo) {}
