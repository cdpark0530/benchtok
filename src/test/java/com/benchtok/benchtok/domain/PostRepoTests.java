package com.benchtok.benchtok.domain;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Instant;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
public class PostRepoTests {
    @Autowired
    private PostRepo postRepo;

    @BeforeEach
    public void init() {
        postRepo.deleteAll();
    }

    @Test
    public void saveAndLoad() {
        // given
        Instant timeStamp = Instant.now();

        String username = "벤치 톡 유저 이름";
        String content = "벤치 톡 컨텐트";

        Post post = Post.builder()
                        .username(username)
                        .content(content)
                        .build();
        postRepo.save(post);

        // when
        List<Post> postList = postRepo.findAll();

        // then
        post = postList.get(0);
        assertEquals(username, post.getUsername());
        assertEquals(content, post.getContent());
        assertTrue(post.getCreatedDate().isAfter(timeStamp));
        assertTrue(post.getModifiedDate().isAfter(timeStamp));
    }
}