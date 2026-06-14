package com.vansh.manger.Manger.common.config;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimitingFilter implements Filter {

    private final Map<String, Bucket> loginCache = new ConcurrentHashMap<>();
    private final Map<String, Bucket> passwordCache = new ConcurrentHashMap<>();

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse res = (HttpServletResponse) response;
        String uri = req.getRequestURI();
        String clientIp = req.getRemoteAddr();

        if (uri.contains("/login")) {
            Bucket bucket = loginCache.computeIfAbsent(clientIp, this::createLoginBucket);
            if (!bucket.tryConsume(1)) {
                res.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                res.getWriter().write("Too many login attempts. Please try again later.");
                return;
            }
        } else if (uri.contains("/forget-password")) {
            Bucket bucket = passwordCache.computeIfAbsent(clientIp, this::createPasswordBucket);
            if (!bucket.tryConsume(1)) {
                res.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                res.getWriter().write("Too many password reset requests. Please try again later.");
                return;
            }
        }

        chain.doFilter(request, response);
    }

    private Bucket createLoginBucket(String key) {
        // 5 attempts per minute per IP
        Bandwidth limit = Bandwidth.builder()
                            .capacity(5)
                            .refillIntervally(5, Duration.ofMinutes(1))
                            .build();
        return Bucket.builder().addLimit(limit).build();
    }

    private Bucket createPasswordBucket(String key) {
        // 3 attempts per hour per IP
        Bandwidth limit = Bandwidth.builder()
                            .capacity(3)
                            .refillIntervally(3, Duration.ofHours(1))
                            .build();
        return Bucket.builder().addLimit(limit).build();
    }

}
