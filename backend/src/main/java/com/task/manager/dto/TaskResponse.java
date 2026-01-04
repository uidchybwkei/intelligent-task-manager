package com.task.manager.dto;

import com.task.manager.domain.Task;
import com.task.manager.domain.Task.TaskPriority;
import com.task.manager.domain.Task.TaskStatus;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.Set;

@Data
public class TaskResponse {
    private Long id;
    private String title;
    private String description;
    private TaskStatus status;
    private TaskPriority priority;
    private Set<String> tags;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime dueAt;

    public static TaskResponse from(Task task) {
        TaskResponse response = new TaskResponse();
        response.setId(task.getId());
        response.setTitle(task.getTitle());
        response.setDescription(task.getDescription());
        response.setStatus(task.getStatus());
        response.setPriority(task.getPriority());
        response.setTags(task.getTags());
        response.setCreatedAt(task.getCreatedAt());
        response.setUpdatedAt(task.getUpdatedAt());
        response.setDueAt(task.getDueAt());
        return response;
    }
}
