package com.task.manager.repository;

import com.task.manager.domain.Task;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TaskRepository extends JpaRepository<Task, Long> {
    
    @Query("SELECT DISTINCT t FROM Task t LEFT JOIN t.tags tag WHERE " +
           "(:status IS NULL OR t.status = :status) AND " +
           "(:priority IS NULL OR t.priority = :priority) AND " +
           "(:tagName IS NULL OR :tagName IN (SELECT tag2 FROM Task t2 LEFT JOIN t2.tags tag2 WHERE t2 = t))")
    Page<Task> findWithFilters(
        @Param("status") Task.TaskStatus status,
        @Param("priority") Task.TaskPriority priority,
        @Param("tagName") String tag,
        Pageable pageable
    );
}
