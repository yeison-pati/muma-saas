package com.muma.threads.repositories;

import com.muma.threads.models.Thread;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ThreadRepository extends JpaRepository<Thread, UUID> {

    List<Thread> findByProjectIdOrderByOpenedAtDesc(UUID projectId);

    Page<Thread> findByProjectIdOrderByOpenedAtDesc(UUID projectId, Pageable pageable);
}
