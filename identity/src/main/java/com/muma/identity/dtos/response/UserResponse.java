package com.muma.identity.dtos.response;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.UUID;

import com.muma.identity.models.User;

public record UserResponse(
                UUID id,
                String name,
                String email,
                String phone,
                String role,
                String region,
                String jobTitle,
                Boolean isLeader,
                LocalDateTime createdAt,
                LocalDateTime updatedAt,
                String createdBy,
                String updatedBy) implements Serializable {
        public UserResponse(User user) {
        this(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole() != null ? user.getRole() : "",
                user.getRegion(),
                user.getJobTitle(),
                user.getIsLeader(),
                user.getCreatedAt(),
                user.getUpdatedAt(),
                user.getCreatedBy(),
                user.getUpdatedBy()
        );
        }
}