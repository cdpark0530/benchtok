package com.benchtok.benchtok.dto;

import com.benchtok.benchtok.domain.Post;

import lombok.Builder;
import lombok.Getter;

@Getter
public class PostR {
    private long id;
    private String username;
    private String content;

    private long createdDate;
    private long modifiedDate;

    @Builder
    public PostR(Post post) {
        this.id = post.getId();
        this.username = post.getUsername();
        this.content = post.getContent();

        this.createdDate = post.getCreatedDate().toEpochMilli();
        this.modifiedDate = post.getModifiedDate().toEpochMilli();
    }
}