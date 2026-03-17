package com.vansh.manger.Manger.auth.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import com.vansh.manger.Manger.common.entity.User;

@Entity
@Table(name = "refresh-token")
@Data
@AllArgsConstructor @NoArgsConstructor
public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

   @ManyToOne(fetch = FetchType.LAZY)
   @JoinColumn(name = "user_id")
    private User user;
    private String token;

    private Instant expiryDate;


}
