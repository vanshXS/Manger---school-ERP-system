package com.vansh.manger.Manger.auth.repository;

import com.vansh.manger.Manger.auth.entity.RefreshToken;
import com.vansh.manger.Manger.common.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByToken(String token);
    Optional<RefreshToken>findByUserId(Long userId);
    void deleteByUser(User user);

}
