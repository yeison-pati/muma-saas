package com.muma.threads.dtos;

import java.util.List;

public record ThreadsPage(List<ThreadResponse> items, PageInfo pageInfo) {}
