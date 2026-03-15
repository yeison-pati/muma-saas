package com.muma.threads.dtos;

import java.util.List;

public record ThreadMessagesPage(List<ThreadMessageResponse> items, PageInfo pageInfo) {}
