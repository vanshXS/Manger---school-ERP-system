package com.vansh.manger.Manger.common.config;

import com.vansh.manger.Manger.common.entity.User;
import com.vansh.manger.Manger.common.security.CurrentUserPrincipal;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.function.Function;

@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String SECRET_KEY;

    @PostConstruct
    public void validate() {
        if (SECRET_KEY == null || SECRET_KEY.isEmpty()) {
            throw new RuntimeException("JWT key is missing");
        }
    }

    private final long accessTokenValidity = TimeUnit.MINUTES.toMillis(15);
    private final long refreshTokenValidity = TimeUnit.DAYS.toMillis(7);

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(SECRET_KEY.getBytes(java.nio.charset.StandardCharsets.UTF_8));
    }

    public String createAccessToken(Map<String, Object> claims, String subject) {
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(subject)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + accessTokenValidity))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public String createRefreshToken(Map<String, Object> claims, String subject) {
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(subject)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + refreshTokenValidity))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public <T> T extractClaims(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    public Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .setAllowedClockSkewSeconds(60)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    public String extractUsername(String token) {
        return extractClaims(token, Claims::getSubject);
    }

    public Date extractExpiration(String token) {
        return extractClaims(token, Claims::getExpiration);
    }

    public Boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    public String extractRole(String token) {
        return extractClaims(token, claims -> claims.get("role", String.class));
    }

    public Long extractUserId(String token) {
        return extractLongClaim(token, "userId");
    }

    public Long extractSchoolId(String token) {
        return extractLongClaim(token, "schoolId");
    }

    private Long extractLongClaim(String token, String claimName) {
        return extractClaims(token, claims -> {
            Object value = claims.get(claimName);
            if (value == null) {
                return null;
            }
            if (value instanceof Number number) {
                return number.longValue();
            }
            return Long.parseLong(value.toString());
        });
    }

    public Boolean validateToken(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return username.equals(userDetails.getUsername()) && !isTokenExpired(token);
    }

    public String generateAccessToken(User user, String role) {
        return generateAccessToken(CurrentUserPrincipal.from(user));
    }

    public String generateAccessToken(CurrentUserPrincipal user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", user.role().name());
        claims.put("userId", user.userId());
        if (user.schoolId() != null) {
            claims.put("schoolId", user.schoolId());
        }
        return createAccessToken(claims, user.email());
    }

    public String generateRefreshToken(User user, String role) {
        return generateRefreshToken(CurrentUserPrincipal.from(user));
    }

    public String generateRefreshToken(CurrentUserPrincipal user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", user.role().name());
        claims.put("userId", user.userId());
        if (user.schoolId() != null) {
            claims.put("schoolId", user.schoolId());
        }
        return createRefreshToken(claims, user.email());
    }
}