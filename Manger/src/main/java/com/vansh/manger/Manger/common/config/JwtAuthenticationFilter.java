package com.vansh.manger.Manger.common.config;

import com.vansh.manger.Manger.auth.service.CustomUserDetailService;
import com.vansh.manger.Manger.common.entity.User;
import com.vansh.manger.Manger.common.security.CurrentUserPrincipal;
import com.vansh.manger.Manger.common.util.TenantContext;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final CustomUserDetailService userDetailService;
    private final TenantFilterInterceptor tenantFilterInterceptor;

    private boolean isPublicPath(HttpServletRequest request) {
        String path = request.getServletPath();
        return path.startsWith("/api/auth/")
                || path.startsWith("/api/schools/")
                || path.startsWith("/uploads/")
                || path.startsWith("/api/files/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {
        boolean tenantFilterEnabled = false;
        TenantContext.remove();

        try {
            if (isPublicPath(request)) {
                filterChain.doFilter(request, response);
                return;
            }

            final String authHeader = request.getHeader("Authorization");
            String username = null;
            String jwtToken = null;

            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                jwtToken = authHeader.substring(7);
                username = jwtUtil.extractUsername(jwtToken);
            }

            if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                String role = jwtUtil.extractRole(jwtToken);
                UserDetails userDetails = userDetailService.loadUserByUsername(username + ":ROLE_W_SPLIT:" + role);

                if (jwtUtil.validateToken(jwtToken, userDetails)) {
                    CurrentUserPrincipal authenticatedUser = toPrincipal(userDetails);

                    if (authenticatedUser.schoolId() != null) {
                        TenantContext.setSchoolId(authenticatedUser.schoolId());
                        tenantFilterEnabled = tenantFilterInterceptor.enableFilter();
                    }

                    UsernamePasswordAuthenticationToken authToken =
                            new UsernamePasswordAuthenticationToken(
                                    authenticatedUser, null, authenticatedUser.getAuthorities()
                            );
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            }

            filterChain.doFilter(request, response);
        } finally {
            if (tenantFilterEnabled) {
                tenantFilterInterceptor.disableFilter();
            }
            TenantContext.remove();
        }
    }

    private CurrentUserPrincipal toPrincipal(UserDetails userDetails) {
        if (userDetails instanceof CurrentUserPrincipal currentUserPrincipal) {
            return currentUserPrincipal;
        }
        if (userDetails instanceof User user) {
            return CurrentUserPrincipal.from(user);
        }
        throw new IllegalStateException("Unsupported user details implementation: " + userDetails.getClass().getName());
    }
}