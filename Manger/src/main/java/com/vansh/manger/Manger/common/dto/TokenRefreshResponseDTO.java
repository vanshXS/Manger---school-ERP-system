package com.vansh.manger.Manger.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Data

public class TokenRefreshResponseDTO {
    
    private final String accessToken;
    private final String role;
}
