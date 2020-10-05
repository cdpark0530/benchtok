package com.benchtok.benchtok.domain;

import java.time.Instant;

import javax.persistence.EntityListeners;
import javax.persistence.MappedSuperclass;
import javax.persistence.PrePersist;
import javax.persistence.PreUpdate;

import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import lombok.Getter;

@Getter
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
public abstract class BaseTimeEntity {
    // https://stackoverflow.com/questions/56361337/localdatetime-to-specific-timezone/56366157#56366157
    private Instant createdDate;
    private Instant modifiedDate;

    // https://gist.github.com/dlxotn216/94c34a2debf848396cf82a7f21a32abe
    @PrePersist
    public void onCreate() {
        this.modifiedDate = this.createdDate = Instant.now();
    }

    @PreUpdate
    public void onUpdate() {
        this.modifiedDate = Instant.now();
    }
}