package com.task.manager.domain;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "tasks")
@Data
public class Task {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TaskStatus status = TaskStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TaskPriority priority = TaskPriority.MEDIUM;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
        name = "task_tags",
        joinColumns = @JoinColumn(name = "task_id"),
        indexes = @Index(name = "idx_tag_task", columnList = "tag,task_id")
    )
    @Column(name = "tag")
    private Set<String> tags = new HashSet<>();

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @Column
    private LocalDateTime dueAt;

    public enum TaskStatus {
        PENDING, IN_PROGRESS, COMPLETED
    }

    public enum TaskPriority {
        LOW, MEDIUM, HIGH
    }
}
