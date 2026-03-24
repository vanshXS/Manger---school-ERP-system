package com.vansh.manger.Manger.common.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ActivityLogDTO {

    private String description;
    private String category;
    private LocalDateTime date;
    private String role;
    private String actorName;
}
