package com.vansh.manger.Manger.auth.service;

import com.vansh.manger.Manger.common.entity.User;
import com.vansh.manger.Manger.common.repository.UserRepo;
import jakarta.persistence.EntityNotFoundException;
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
            com.vansh.manger.Manger.common.entity.Roles role = com.vansh.manger.Manger.common.entity.Roles.valueOf(parts[1]);
            return userRepo.findByEmailAndRoles(email, role)
                    .orElseThrow(() -> new UsernameNotFoundException("User not found with email and role"));
        }
        
        // Fallback (might throw NonUniqueResultException if multiple exist, but all our controllers will use the new format)
        return userRepo.findByEmail(username).orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }
}
