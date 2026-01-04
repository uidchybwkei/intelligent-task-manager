package com.task.manager.dto;

import com.task.manager.domain.Task.TaskPriority;
import com.task.manager.domain.Task.TaskStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.Set;

@Data
public class CreateTaskRequest {
    @NotBlank(message = "标题不能为空")
    @Size(max = 200, message = "标题长度不能超过200")
    private String title;

    private String description;

    private TaskStatus status;

    private TaskPriority priority;

    private Set<String> tags;

    private LocalDateTime dueAt;
}
