package com.muma.threads.models;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "threads")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Thread {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(nullable = false)
    private UUID projectId;

    private UUID variantId;

    @Column(nullable = false)
    private String type;

    @Column(nullable = false)
    private Instant openedAt;

    private Instant closedAt;

    private UUID openedBy;

    private UUID closedBy;

    @OneToMany(mappedBy = "thread", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ThreadMessage> messages = new ArrayList<>();
}
