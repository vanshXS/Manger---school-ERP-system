package com.vansh.manger.Manger.common.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class CloudinaryResponse {

    private final String url;
    private final String publicId;
}
