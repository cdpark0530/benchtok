package com.benchtok.benchtok.domain;

import java.time.Instant;
import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PostRepo extends JpaRepository<Post, Long> {
    /**
     * The @Query annotation takes precedence over named queries,
     * which are annotated with @NamedQuery or defined in an orm.xml file.
     */
    @Query(value = "SELECT p FROM Post p WHERE p.createdDate <= :time")
    List<Post> findPageBeforeTime(@Param("time") Instant time, Pageable pageable);
}