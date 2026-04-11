package com.vansh.manger.Manger.auth.service;

import com.vansh.manger.Manger.common.entity.Roles;
import com.vansh.manger.Manger.common.repository.UserRepo;
import com.vansh.manger.Manger.common.security.CurrentUserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomUserDetailService implements UserDetailsService {

    private final UserRepo userRepo;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        if (username != null && username.contains(":ROLE_W_SPLIT:")) {
            String[] parts = username.split(":ROLE_W_SPLIT:");
            String email = parts[0];
            Roles role = Roles.valueOf(parts[1]);
            return userRepo.findByEmailAndRoles(email, role)
                    .map(CurrentUserPrincipal::from)
                    .orElseThrow(() -> new UsernameNotFoundException("User not found with email and role"));
        }

        return userRepo.findByEmail(username)
                .map(CurrentUserPrincipal::from)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }
}