package com.benchtok.benchtok.domain;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;

import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@Entity
public class Post extends BaseTimeEntity {
    /**
     * You can set spring.jpa.hibernate.use-new-id-generator-mappings property with true or false.
     * From Spring Boot 2.0, the property is true by default, which means the app will use
     * Hibernate 5's newer IdentifierGenerator for AUTO, TABLE and SEQUENCE.
     * Hibernate 5's newer IdentifierGenerator picks the TABLE instead of IDENTITY as GenerationType
     * when the underlying database does not support sequences.
     */
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Id
    private Long id;

    @Column(nullable = false)
    private String username;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Builder
    public Post(String username, String content) {
        this.username = username;
        this.content = content;
    }

    public void update(String content) {
        this.content = content;
    }
}