package com.vansh.manger.Manger.Service;

import com.vansh.manger.Manger.Entity.RefreshToken;
import com.vansh.manger.Manger.Entity.User;
import com.vansh.manger.Manger.Repository.RefreshTokenRepository;
import com.vansh.manger.Manger.Repository.UserRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepo userRepo;

    /**
     * Create or update refresh token for a user
     * This method is transactional to ensure database consistency
     *
     * @param userId The user ID
     * @param token The refresh token string
     * @param expiryDate The token expiry date
     * @throws RuntimeException if user not found
     */
    @Transactional
    public void createRefreshToken(Long userId, String token, Instant expiryDate) {
        if (userId == null) {
            throw new IllegalArgumentException("User ID cannot be null");
        }
        if (token == null || token.trim().isEmpty()) {
            throw new IllegalArgumentException("Token cannot be null or empty");
        }
        if (expiryDate == null) {
            throw new IllegalArgumentException("Expiry date cannot be null");
        }
        if (expiryDate.isBefore(Instant.now())) {
            throw new IllegalArgumentException("Expiry date cannot be in the past");
        }

        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));

        Optional<RefreshToken> existingTokenOpt = refreshTokenRepository.findByUserId(userId);

        RefreshToken refreshToken;

        if (existingTokenOpt.isPresent()) {
            // Update existing token
            refreshToken = existingTokenOpt.get();
            log.debug("Updating existing refresh token for user ID: {}", userId);
        } else {
            // Create new token
            refreshToken = new RefreshToken();
            refreshToken.setUser(user);
            log.debug("Creating new refresh token for user ID: {}", userId);
        }

        refreshToken.setToken(token);
        refreshToken.setExpiryDate(expiryDate);

        refreshTokenRepository.save(refreshToken);
        log.info("Refresh token saved successfully for user: {}", user.getEmail());
    }

    /**
     * Find refresh token by token string
     *
     * @param token The token string to search for
     * @return Optional containing the RefreshToken if found
     */
    public Optional<RefreshToken> findByToken(String token) {
        if (token == null || token.trim().isEmpty()) {
            log.warn("Attempted to find refresh token with null or empty token string");
            return Optional.empty();
        }

        return refreshTokenRepository.findByToken(token);
    }

    /**
     * Verify that a refresh token has not expired
     * If expired, the token is deleted from the database
     *
     * @param token The RefreshToken to verify
     * @return The same token if valid
     * @throws RuntimeException if token is expired
     */
    @Transactional
    public RefreshToken verifyExpiration(RefreshToken token) {
        if (token == null) {
            throw new IllegalArgumentException("Token cannot be null");
        }

        if (token.getExpiryDate() == null) {
            log.error("Refresh token has null expiry date for user: {}",
                    token.getUser() != null ? token.getUser().getEmail() : "unknown");
            refreshTokenRepository.delete(token);
            throw new RuntimeException("Invalid refresh token: expiry date is null");
        }

        if (token.getExpiryDate().isBefore(Instant.now())) {
            log.info("Refresh token expired for user: {}. Deleting token.",
                    token.getUser() != null ? token.getUser().getEmail() : "unknown");
            refreshTokenRepository.delete(token);
            throw new RuntimeException("Refresh token expired. Please login again");
        }

        log.debug("Refresh token verified successfully for user: {}",
                token.getUser() != null ? token.getUser().getEmail() : "unknown");
        return token;
    }

    /**
     * Delete a refresh token by token string
     * Used during logout to invalidate the token
     *
     * @param token The token string to delete
     */
    @Transactional
    public void deleteByToken(String token) {
        if (token == null || token.trim().isEmpty()) {
            log.warn("Attempted to delete refresh token with null or empty token string");
            return;
        }

        Optional<RefreshToken> refreshTokenOpt = refreshTokenRepository.findByToken(token);

        if (refreshTokenOpt.isPresent()) {
            RefreshToken refreshToken = refreshTokenOpt.get();
            refreshTokenRepository.delete(refreshToken);
            log.info("Refresh token deleted successfully for user: {}",
                    refreshToken.getUser() != null ? refreshToken.getUser().getEmail() : "unknown");
        } else {
            log.warn("Attempted to delete non-existent refresh token");
        }
    }







}