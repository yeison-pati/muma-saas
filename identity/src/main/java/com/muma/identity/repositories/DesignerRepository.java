package com.muma.identity.repositories;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.muma.identity.models.roles.Designer;

@Repository
public interface DesignerRepository extends JpaRepository<Designer, UUID> {

    @Query("SELECT d FROM Designer d WHERE d.user.id = :userId")
    Optional<Designer> findByUserId(@Param("userId") UUID userId);

    @Modifying
    @Query("DELETE FROM Designer d WHERE d.user.id = :userId")
    void deleteByUserId(@Param("userId") UUID userId);
}
