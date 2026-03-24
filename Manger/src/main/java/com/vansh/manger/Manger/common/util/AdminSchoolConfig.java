package com.vansh.manger.Manger.common.util;

import com.vansh.manger.Manger.common.entity.Roles;
import com.vansh.manger.Manger.common.entity.School;
import com.vansh.manger.Manger.common.entity.User;
import com.vansh.manger.Manger.common.repository.UserRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;


@Service
@RequiredArgsConstructor
public class AdminSchoolConfig {

    private final UserRepo userRepo;

 
    public School requireCurrentSchool() {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalStateException(
                    "No authenticated user found. School context is required."
            );
        }

        String email = authentication.getName();

        User user = userRepo.findByEmailAndRoles(email, Roles.ADMIN)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getSchool() == null) {
            throw new IllegalStateException("User is not associated with any school");
        }

        return user.getSchool();
    }



}
