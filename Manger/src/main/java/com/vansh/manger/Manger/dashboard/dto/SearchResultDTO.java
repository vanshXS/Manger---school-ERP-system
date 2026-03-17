package com.vansh.manger.Manger.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SearchResultDTO {
    private Long id;
    private String name;
    private String subtitle;
    private String type;
    private String path;
}
