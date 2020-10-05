package com.benchtok.benchtok;

import com.benchtok.benchtok.domain.Post;
import com.benchtok.benchtok.domain.PostRepo;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Component
public class DataLoader implements ApplicationRunner {
	private final PostRepo postRepo;
	
	@Override
	public void run(ApplicationArguments args) throws Exception {
		postRepo.save(new Post("Changdae", "Park"));
		postRepo.save(new Post("Lauren", "Wales"));
	}
}