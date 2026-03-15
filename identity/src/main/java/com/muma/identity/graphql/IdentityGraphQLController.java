package com.muma.identity.graphql;

import java.util.List;
import java.util.UUID;

import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;

import com.muma.identity.dtos.auth.TokenResponse;
import com.muma.identity.dtos.response.DesignerResponse;
import com.muma.identity.dtos.response.DeveloperResponse;
import com.muma.identity.dtos.response.QuoterResponse;
import com.muma.identity.dtos.response.SalesResponse;
import com.muma.identity.dtos.response.UserResponse;
import com.muma.identity.dtos.session.RegisterRequest;
import com.muma.identity.dtos.updates.UserUpdate;
import com.muma.identity.services.AdminService;
import com.muma.identity.services.AuthService;
import com.muma.identity.services.UserService;

import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.jwt.Jwt;

@Controller
@RequiredArgsConstructor
public class IdentityGraphQLController {

    private final AuthService authService;
    private final AdminService adminService;
    private final UserService userService;

    @MutationMapping
    public TokenResponse signIn(@Argument("input") LoginInput input) {
        return authService.signIn(input.email(), input.password());
    }

    @QueryMapping
    @PreAuthorize("hasRole('ADMIN')")
    public UserResponse admin(@AuthenticationPrincipal Jwt jwt) {
        return adminService.getUserResponse(UUID.fromString(jwt.getSubject()));
    }

    @MutationMapping
    @PreAuthorize("hasRole('ADMIN')")
    public UserResponse updateAdmin(@AuthenticationPrincipal Jwt jwt, @Argument("input") UserUpdateInput input) {
        UUID userId = UUID.fromString(jwt.getSubject());
        UserUpdate update = toUserUpdate(userId, input);
        return adminService.updateUser(userId, update);
    }

    @MutationMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Boolean createUser(@Argument("input") RegisterInput input) {
        return adminService.createUser(toRegisterRequest(input));
    }

    @MutationMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Boolean deleteUser(@Argument("userId") String userId) {
        return adminService.deleteUser(UUID.fromString(userId));
    }

    @MutationMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Boolean editUser(@Argument("userId") String userId, @Argument("input") UserUpdateInput input) {
        return adminService.editUser(UUID.fromString(userId), toUserUpdate(UUID.fromString(userId), input));
    }

    @QueryMapping
    public String health() {
        return "OK";
    }

    @QueryMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'QUOTER', 'DESIGNER', 'SALES', 'DEVELOPMENT')")
    public List<QuoterResponse> quoters() {
        return userService.getAllQuoters();
    }

    @QueryMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'QUOTER', 'DESIGNER', 'SALES', 'DEVELOPMENT')")
    public List<SalesResponse> sales() {
        return userService.getAllSales();
    }

    @QueryMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'QUOTER', 'DESIGNER', 'SALES', 'DEVELOPMENT')")
    public List<DesignerResponse> designers() {
        return userService.getAllDesigners();
    }

    @QueryMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'QUOTER', 'DESIGNER', 'SALES', 'DEVELOPMENT')")
    public List<DeveloperResponse> developers() {
        return userService.getAllDevelopers();
    }

    private static UserUpdate toUserUpdate(UUID id, UserUpdateInput input) {
        return new UserUpdate(
                id,
                input.name(),
                input.email(),
                input.phone(),
                input.password(),
                input.role(),
                input.region(),
                input.jobTitle(),
                input.isLeader());
    }

    private static RegisterRequest toRegisterRequest(RegisterInput input) {
        return new RegisterRequest(
                input.name(),
                input.email(),
                input.phone(),
                input.password(),
                input.role(),
                input.region(),
                input.jobTitle(),
                input.isLeader(),
                input.creator());
    }
}
