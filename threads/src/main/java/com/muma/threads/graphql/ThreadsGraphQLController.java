package com.muma.threads.graphql;

import java.util.List;
import java.util.UUID;

import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

import com.muma.threads.dtos.ThreadMessageResponse;
import com.muma.threads.dtos.ThreadResponse;
import com.muma.threads.models.Thread;
import com.muma.threads.models.ThreadMessage;
import com.muma.threads.services.ThreadService;

import lombok.AllArgsConstructor;

@Controller
@AllArgsConstructor
public class ThreadsGraphQLController {

    private final ThreadService threadService;

    @QueryMapping
    public com.muma.threads.dtos.ThreadsPage threadsByProject(
            @Argument("projectId") String projectId,
            @Argument("limit") Integer limit,
            @Argument("offset") Integer offset) {
        return threadService.findByProjectPaginated(UUID.fromString(projectId), limit, offset);
    }

    @QueryMapping
    public com.muma.threads.dtos.ThreadMessagesPage threadMessages(
            @Argument("threadId") String threadId,
            @Argument("limit") Integer limit,
            @Argument("offset") Integer offset) {
        UUID tid = UUID.fromString(threadId);
        return threadService.getMessagesPaginated(tid, limit, offset);
    }

    @MutationMapping
    public ThreadResponse openThread(
            @Argument("projectId") String projectId,
            @Argument("variantId") String variantId,
            @Argument("type") String type,
            @Argument("openedBy") String openedBy) {
        Thread t = threadService.open(
                UUID.fromString(projectId),
                variantId != null && !variantId.isBlank() ? UUID.fromString(variantId) : null,
                type,
                UUID.fromString(openedBy));
        return ThreadResponse.from(t);
    }

    @MutationMapping
    public ThreadResponse closeThread(
            @Argument("threadId") String threadId,
            @Argument("closedBy") String closedBy) {
        Thread t = threadService.close(UUID.fromString(threadId), UUID.fromString(closedBy));
        return ThreadResponse.from(t);
    }

    @MutationMapping
    public ThreadMessageResponse addThreadMessage(
            @Argument("threadId") String threadId,
            @Argument("userId") String userId,
            @Argument("content") String content) {
        UUID tid = UUID.fromString(threadId);
        ThreadMessage m = threadService.addMessage(tid, UUID.fromString(userId), content);
        return ThreadMessageResponse.from(m, tid);
    }
}
