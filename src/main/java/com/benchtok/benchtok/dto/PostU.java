package com.benchtok.benchtok.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class PostU {
    private String content;

    @Builder
    public PostU(String content) {
        this.content = content;
    }
}