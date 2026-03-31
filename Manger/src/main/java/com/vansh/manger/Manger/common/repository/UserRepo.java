package com.vansh.manger.Manger.common.repository;

import com.vansh.manger.Manger.common.entity.Roles;
import com.vansh.manger.Manger.common.entity.User;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepo extends JpaRepository<User, Long> {

    @EntityGraph(attributePaths = "school")
    Optional<User>findByEmail(String email);

    @EntityGraph(attributePaths = "school")
    Optional<User>findByEmailAndRoles(String email, Roles role);


    boolean existsByEmail(String email);
}
