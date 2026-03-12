package com.muma.identity.services;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.muma.identity.dtos.response.DesignerResponse;
import com.muma.identity.dtos.response.DeveloperResponse;
import com.muma.identity.dtos.response.QuoterResponse;
import com.muma.identity.dtos.response.SalesResponse;
import com.muma.identity.dtos.response.UserResponse;
import com.muma.identity.dtos.updates.DesignerUpdate;
import com.muma.identity.dtos.updates.QuoterUpdate;
import com.muma.identity.dtos.updates.SalesUpdate;
import com.muma.identity.repositories.DesignerRepository;
import com.muma.identity.repositories.QuoterRepository;
import com.muma.identity.repositories.SalesRepository;
import com.muma.identity.repositories.UserRepository;

import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final QuoterRepository quoterRepository;
    private final SalesRepository salesRepository;
    private final DesignerRepository designerRepository;

    private UserResponse getUserResponse(UUID userId) {
        return userRepository.findById(userId)
                .map(UserResponse::new)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public QuoterResponse getQuoterInfo(UUID userId) {
        UserResponse userResponse = getUserResponse(userId);
        var quoter = quoterRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Quoter not found"));
        return new QuoterResponse(userResponse, quoter.getQuoted(), quoter.getProjects(), quoter.getProducts());
    }

    @Transactional
    @CacheEvict(value = "quoters", allEntries = true)
    public QuoterResponse updateQuoterInfo(UUID userId, QuoterUpdate quoterUpdate) {
        UserResponse userResponse = getUserResponse(userId);
        var quoter = quoterRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Quoter not found"));
        quoter.setQuoted(quoterUpdate.quoted());
        quoter.setProjects(quoterUpdate.projects());
        quoter.setProducts(quoterUpdate.products());
        var saved = quoterRepository.save(quoter);
        return new QuoterResponse(userResponse, saved.getQuoted(), saved.getProjects(), saved.getProducts());
    }

    @Cacheable(value = "quoters", unless = "#result.isEmpty()")
    public List<QuoterResponse> getAllQuoters() {
        return quoterRepository.findAll().stream()
                .map(quoter -> {
                    UserResponse ur = getUserResponse(quoter.getUserId());
                    return new QuoterResponse(ur, quoter.getQuoted(), quoter.getProjects(), quoter.getProducts());
                })
                .collect(Collectors.toList());
    }

    @Cacheable(value = "sales", unless = "#result.isEmpty()")
    public List<SalesResponse> getAllSales() {
        return salesRepository.findAll().stream()
                .map(sales -> {
                    UserResponse ur = getUserResponse(sales.getUserId());
                    return new SalesResponse(ur, sales.getRequested(), sales.getEffective());
                })
                .collect(Collectors.toList());
    }

    @Cacheable(value = "designers", unless = "#result.isEmpty()")
    public List<DesignerResponse> getAllDesigners() {
        return designerRepository.findAll().stream()
                .map(designer -> {
                    UserResponse ur = getUserResponse(designer.getUserId());
                    return new DesignerResponse(ur, designer.getCreated(), designer.getEdited());
                })
                .collect(Collectors.toList());
    }

    @Cacheable(value = "developers", unless = "#result.isEmpty()")
    public List<DeveloperResponse> getAllDevelopers() {
        return userRepository.findByRole("DEVELOPMENT").stream()
                .map(u -> new DeveloperResponse(new UserResponse(u)))
                .collect(Collectors.toList());
    }

    public SalesResponse getSalesInfo(UUID userId) {
        UserResponse userResponse = getUserResponse(userId);
        var sales = salesRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Sales not found"));
        return new SalesResponse(userResponse, sales.getRequested(), sales.getEffective());
    }

    @Transactional
    @CacheEvict(value = "sales", allEntries = true)
    public SalesResponse updateSalesInfo(UUID userId, SalesUpdate salesUpdate) {
        UserResponse userResponse = getUserResponse(userId);
        var sales = salesRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Sales not found"));
        sales.setRequested(salesUpdate.requested());
        sales.setEffective(salesUpdate.effective());
        var saved = salesRepository.save(sales);
        return new SalesResponse(userResponse, saved.getRequested(), saved.getEffective());
    }

    public DesignerResponse getDesignerInfo(UUID userId) {
        UserResponse userResponse = getUserResponse(userId);
        var designer = designerRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Designer not found"));
        return new DesignerResponse(userResponse, designer.getCreated(), designer.getEdited());
    }

    @Transactional
    @CacheEvict(value = "designers", allEntries = true)
    public DesignerResponse updateDesignerInfo(UUID userId, DesignerUpdate designerUpdate) {
        UserResponse userResponse = getUserResponse(userId);
        var designer = designerRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Designer not found"));
        designer.setCreated(designerUpdate.created());
        designer.setEdited(designerUpdate.edited());
        var saved = designerRepository.save(designer);
        return new DesignerResponse(userResponse, saved.getCreated(), saved.getEdited());
    }
}
