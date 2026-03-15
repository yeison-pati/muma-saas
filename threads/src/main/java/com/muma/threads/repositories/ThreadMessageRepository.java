package com.muma.threads.repositories;

import com.muma.threads.models.ThreadMessage;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface ThreadMessageRepository extends JpaRepository<ThreadMessage, UUID> {

    @Query("SELECT m FROM ThreadMessage m WHERE m.thread.id = :threadId ORDER BY m.createdAt ASC")
    List<ThreadMessage> findByThreadIdOrderByCreatedAtAsc(@Param("threadId") UUID threadId);

    @Query(value = "SELECT m FROM ThreadMessage m WHERE m.thread.id = :threadId ORDER BY m.createdAt ASC",
            countQuery = "SELECT COUNT(m) FROM ThreadMessage m WHERE m.thread.id = :threadId")
    Page<ThreadMessage> findByThreadIdOrderByCreatedAtAsc(@Param("threadId") UUID threadId, Pageable pageable);
}
