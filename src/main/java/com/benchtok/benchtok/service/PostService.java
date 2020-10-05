package com.benchtok.benchtok.service;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

import com.benchtok.benchtok.domain.Post;
import com.benchtok.benchtok.domain.PostRepo;
import com.benchtok.benchtok.dto.PostC;
import com.benchtok.benchtok.dto.PostR;
import com.benchtok.benchtok.dto.PostU;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Service
public class PostService {
    private final PostRepo postRepo;

    @Transactional
    public Long create(PostC dto) {
        return postRepo.save(dto.toEntity()).getId();
    }

    @Transactional(readOnly = true)
    public PostR findById(Long id) {
        Post post = postRepo.findById(id)
                            .orElseThrow(() -> new IllegalArgumentException("The post is not found with id=" + id));
        return new PostR(post);
    }

    @Transactional(readOnly = true)
    public List<PostR> findPageBeforeTime(Long time, Integer page) {
        Instant instant;
        if (time == 0) {
            instant = Instant.now();
        } else {
            instant = Instant.ofEpochMilli(time);
        }
        return postRepo.findPageBeforeTime(instant, PageRequest.of(page, 12, Sort.Direction.DESC, "createdDate"))
                .stream()
                .map(post -> new PostR(post))
                .collect(Collectors.toList());
    }

    @Transactional
    public Long update(Long id, PostU dto) {
        Post post = postRepo.findById(id)
                            .orElseThrow(() -> new IllegalArgumentException("The post is not found with id=" + id));
        post.update(dto.getContent());
        return id;
    }
}