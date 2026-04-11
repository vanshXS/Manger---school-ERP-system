package com.vansh.manger.Manger.common.security;

import com.vansh.manger.Manger.common.entity.User;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public final class SecurityContextHelper {

    private SecurityContextHelper() {
    }

    public static CurrentUserPrincipal getCurrentPrincipal() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalStateException("No authenticated user found.");
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof CurrentUserPrincipal currentUserPrincipal) {
            return currentUserPrincipal;
        }
        if (principal instanceof User user) {
            return CurrentUserPrincipal.from(user);
        }

        throw new IllegalStateException("Authenticated principal type is unsupported: " + principal.getClass().getName());
    }

    public static Long getCurrentUserId() {
        return getCurrentPrincipal().userId();
    }

    public static String getCurrentUsername() {
        return getCurrentPrincipal().email();
    }
}