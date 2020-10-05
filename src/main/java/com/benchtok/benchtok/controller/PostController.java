package com.benchtok.benchtok.controller;

import java.util.List;

import com.benchtok.benchtok.dto.PostC;
import com.benchtok.benchtok.dto.PostR;
import com.benchtok.benchtok.dto.PostU;
import com.benchtok.benchtok.service.PostService;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@RestController
public class PostController {
	private final PostService postService;
	
	@PostMapping
	public Long create(@RequestBody PostC dto) {
		return postService.create(dto);
	}
	
	@GetMapping("/api/v1/post/findById/{id}")
	public PostR findById(@PathVariable Long id) {
		return postService.findById(id);
	}
	
	@GetMapping("/api/v1/post/findPageBeforeTime/{time}/{pageNo}")
	public List<PostR> findPageBeforeTime(@PathVariable("time") Long time, @PathVariable("pageNo") Integer pageNo) {
		return postService.findPageBeforeTime(time, pageNo);
	}
	
	@PutMapping("/api/v1/post/update/{id}")
	public Long update(@PathVariable Long id, @RequestBody PostU dto) {
		return postService.update(id, dto);
	}
}