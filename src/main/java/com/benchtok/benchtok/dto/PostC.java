package com.benchtok.benchtok.dto;

import com.benchtok.benchtok.domain.Post;

import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class PostC {
    private String username;
    private String content;

    @Builder
    public PostC(String username, String content) {
        this.username = username;
        this.content = content;
    }

    public Post toEntity() {
        return Post.builder()
                    .username(username)
                    .content(content)
                    .build();
    }
}