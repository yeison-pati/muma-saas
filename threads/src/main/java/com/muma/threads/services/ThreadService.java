package com.muma.threads.services;

import com.muma.threads.dtos.PageInfo;
import com.muma.threads.dtos.ThreadMessageResponse;
import com.muma.threads.dtos.ThreadMessagesPage;
import com.muma.threads.dtos.ThreadResponse;
import com.muma.threads.dtos.ThreadsPage;
import com.muma.threads.models.Thread;
import com.muma.threads.models.ThreadMessage;
import com.muma.threads.repositories.ThreadMessageRepository;
import com.muma.threads.repositories.ThreadRepository;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class ThreadService {

    private final ThreadRepository threadRepository;
    private final ThreadMessageRepository messageRepository;

    public ThreadService(ThreadRepository threadRepository, ThreadMessageRepository messageRepository) {
        this.threadRepository = threadRepository;
        this.messageRepository = messageRepository;
    }

    public List<Thread> findByProject(UUID projectId) {
        return threadRepository.findByProjectIdOrderByOpenedAtDesc(projectId);
    }

    public ThreadsPage findByProjectPaginated(UUID projectId, Integer limit, Integer offset) {
        if (limit == null || limit <= 0) {
            List<Thread> all = findByProject(projectId);
            List<ThreadResponse> items = all.stream().map(ThreadResponse::from).toList();
            return new ThreadsPage(items, new PageInfo(items.size(), items.size(), 0));
        }
        int off = offset != null && offset >= 0 ? offset : 0;
        Pageable pageable = PageRequest.of(off / limit, limit);
        var page = threadRepository.findByProjectIdOrderByOpenedAtDesc(projectId, pageable);
        List<ThreadResponse> items = page.getContent().stream().map(ThreadResponse::from).toList();
        return new ThreadsPage(items, new PageInfo((int) page.getTotalElements(), limit, off));
    }

    public List<ThreadMessage> getMessages(UUID threadId) {
        return messageRepository.findByThreadIdOrderByCreatedAtAsc(threadId);
    }

    public ThreadMessagesPage getMessagesPaginated(UUID threadId, Integer limit, Integer offset) {
        if (limit == null || limit <= 0) {
            List<ThreadMessage> msgs = getMessages(threadId);
            List<ThreadMessageResponse> items = msgs.stream().map(m -> ThreadMessageResponse.from(m, threadId)).toList();
            return new ThreadMessagesPage(items, new PageInfo(items.size(), items.size(), 0));
        }
        int off = offset != null && offset >= 0 ? offset : 0;
        Pageable pageable = PageRequest.of(off / limit, limit);
        var page = messageRepository.findByThreadIdOrderByCreatedAtAsc(threadId, pageable);
        List<ThreadMessageResponse> items = page.getContent().stream()
                .map(m -> ThreadMessageResponse.from(m, threadId))
                .toList();
        return new ThreadMessagesPage(items, new PageInfo((int) page.getTotalElements(), limit, off));
    }

    @Transactional
    public Thread open(UUID projectId, UUID variantId, String type, UUID openedBy) {
        Thread t = Thread.builder()
                .projectId(projectId)
                .variantId(variantId)
                .type(type)
                .openedAt(Instant.now())
                .openedBy(openedBy)
                .build();
        return threadRepository.save(t);
    }

    @Transactional
    public Thread close(UUID threadId, UUID closedBy) {
        Thread t = threadRepository.findById(threadId)
                .orElseThrow(() -> new RuntimeException("Thread not found"));
        t.setClosedAt(Instant.now());
        t.setClosedBy(closedBy);
        return threadRepository.save(t);
    }

    @Transactional
    public ThreadMessage addMessage(UUID threadId, UUID userId, String content) {
        Thread t = threadRepository.findById(threadId)
                .orElseThrow(() -> new RuntimeException("Thread not found"));
        if (t.getClosedAt() != null) {
            throw new RuntimeException("Cannot add message to closed thread");
        }
        ThreadMessage m = ThreadMessage.builder()
                .thread(t)
                .userId(userId)
                .content(content.trim())
                .createdAt(Instant.now())
                .build();
        return messageRepository.save(m);
    }
}
