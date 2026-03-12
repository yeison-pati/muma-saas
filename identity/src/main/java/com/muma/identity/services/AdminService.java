package com.muma.identity.services;

import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.muma.identity.dtos.response.UserResponse;
import com.muma.identity.dtos.session.RegisterRequest;
import com.muma.identity.dtos.updates.UserUpdate;
import com.muma.identity.models.User;
import com.muma.identity.models.roles.Designer;
import com.muma.identity.models.roles.Quoter;
import com.muma.identity.models.roles.Sales;
import com.muma.identity.repositories.DesignerRepository;
import com.muma.identity.repositories.QuoterRepository;
import com.muma.identity.repositories.SalesRepository;
import com.muma.identity.repositories.UserRepository;

import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final QuoterRepository quoterRepository;
    private final SalesRepository salesRepository;
    private final DesignerRepository designerRepository;
    private final PasswordEncoder passwordEncoder;

    public UserResponse getUserResponse(UUID userId) {
        return userRepository.findById(userId)
                .map(UserResponse::new)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @Transactional
    public UserResponse updateUser(UUID userId, UserUpdate userUpdate) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setEmail(userUpdate.email());
        user.setName(userUpdate.name());
        user.setPhone(userUpdate.phone());
        user.setPassword(passwordEncoder.encode(userUpdate.password()));
        user.setRole(userUpdate.role());
        user.setRegion(userUpdate.region());
        user.setJobTitle(userUpdate.jobTitle());
        user.setUpdatedAt(LocalDateTime.now());
        return new UserResponse(userRepository.save(user));
    }

    @Transactional
    @CacheEvict(value = {"quoters", "sales", "designers", "developers"}, allEntries = true)
    public Boolean createUser(RegisterRequest request) {
        User user = userRepository.save(
                User.builder()
                        .id(UUID.randomUUID())
                        .name(request.name())
                        .email(request.email())
                        .phone(request.phone())
                        .password(passwordEncoder.encode(request.password()))
                        .role(request.role())
                        .region(request.region())
                        .jobTitle(request.jobTitle())
                        .createdBy(request.creator())
                        .createdAt(LocalDateTime.now())
                        .updatedAt(LocalDateTime.now())
                        .build());

        return switch (request.role()) {
            case "QUOTER" -> {
                quoterRepository.save(
                        Quoter.builder()
                                .id(UUID.randomUUID())
                                .user(user)
                                .products(0)
                                .projects(0)
                                .quoted(0)
                                .build());
                yield true;
            }
            case "SALES" -> {
                salesRepository.save(
                        Sales.builder()
                                .id(UUID.randomUUID())
                                .user(user)
                                .effective(0)
                                .requested(0)
                                .build());
                yield true;
            }
            case "DESIGNER" -> {
                designerRepository.save(
                        Designer.builder()
                                .id(UUID.randomUUID())
                                .user(user)
                                .created(0)
                                .edited(0)
                                .build());
                yield true;
            }
            case "DEVELOPMENT" -> {
                yield true;
            }
            default -> throw new RuntimeException("Invalid role");
        };
    }

    @Transactional
    @CacheEvict(value = {"quoters", "sales", "designers", "developers"}, allEntries = true)
    public Boolean deleteUser(UUID userId) {
        try {
            quoterRepository.deleteByUserId(userId);
        } catch (Exception e) { /* ignore */ }
        try {
            salesRepository.deleteByUserId(userId);
        } catch (Exception e) { /* ignore */ }
        try {
            designerRepository.deleteByUserId(userId);
        } catch (Exception e) { /* ignore */ }
        userRepository.deleteById(userId);
        return true;
    }

    @Transactional
    @CacheEvict(value = {"quoters", "sales", "designers", "developers"}, allEntries = true)
    public Boolean editUser(UUID userId, UserUpdate userUpdate) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setEmail(userUpdate.email());
        user.setName(userUpdate.name());
        user.setPhone(userUpdate.phone());
        user.setPassword(passwordEncoder.encode(userUpdate.password()));
        user.setRole(userUpdate.role());
        user.setRegion(userUpdate.region());
        user.setJobTitle(userUpdate.jobTitle());
        userRepository.save(user);
        return true;
    }
}
