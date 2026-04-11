package com.vansh.manger.Manger.common.security;

import com.vansh.manger.Manger.common.entity.Roles;
import com.vansh.manger.Manger.common.entity.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

public record CurrentUserPrincipal(Long userId, String email, Roles role, Long schoolId, String passwordHash)
        implements UserDetails {

    public static CurrentUserPrincipal from(User user) {
        Long currentSchoolId = user.getSchool() != null ? user.getSchool().getId() : null;
        return new CurrentUserPrincipal(
                user.getId(),
                user.getEmail(),
                user.getRoles(),
                currentSchoolId,
                user.getPassword()
        );
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public String getPassword() {
        return passwordHash;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }

    @Override
    public String toString() {
        return "CurrentUserPrincipal[userId=%s, email=%s, role=%s, schoolId=%s]"
                .formatted(userId, email, role, schoolId);
    }
}