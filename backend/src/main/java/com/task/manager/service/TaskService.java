package com.task.manager.service;

import com.task.manager.domain.Task;
import com.task.manager.domain.Task.TaskPriority;
import com.task.manager.domain.Task.TaskStatus;
import com.task.manager.dto.CreateTaskRequest;
import com.task.manager.dto.PageResponse;
import com.task.manager.dto.TaskResponse;
import com.task.manager.dto.UpdateTaskRequest;
import com.task.manager.exception.ResourceNotFoundException;
import com.task.manager.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TaskService {
    private final TaskRepository taskRepository;

    @Transactional
    public TaskResponse createTask(CreateTaskRequest request) {
        Task task = new Task();
        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());
        task.setStatus(request.getStatus() != null ? request.getStatus() : TaskStatus.PENDING);
        task.setPriority(request.getPriority() != null ? request.getPriority() : TaskPriority.MEDIUM);
        if (request.getTags() != null) {
            task.setTags(request.getTags());
        }
        task.setDueAt(request.getDueAt());
        
        Task saved = taskRepository.save(task);
        return TaskResponse.from(saved);
    }

    public TaskResponse getTask(Long id) {
        Task task = taskRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("任务未找到: " + id));
        return TaskResponse.from(task);
    }

    public PageResponse<TaskResponse> getTasks(
        TaskStatus status,
        TaskPriority priority,
        String tag,
        String sortBy,
        String sortDirection,
        int page,
        int size
    ) {
        size = Math.min(size, 100);
        
        Sort.Direction direction = "desc".equalsIgnoreCase(sortDirection) 
            ? Sort.Direction.DESC : Sort.Direction.ASC;
        
        String sortField = switch (sortBy != null ? sortBy.toLowerCase() : "createdat") {
            case "priority" -> "priority";
            case "status" -> "status";
            default -> "createdAt";
        };
        
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortField));
        Page<Task> taskPage = taskRepository.findWithFilters(status, priority, tag, pageable);
        
        List<TaskResponse> content = taskPage.getContent().stream()
            .map(TaskResponse::from)
            .toList();
        
        return new PageResponse<>(
            content,
            taskPage.getNumber(),
            taskPage.getSize(),
            taskPage.getTotalElements(),
            taskPage.getTotalPages()
        );
    }

    @Transactional
    public TaskResponse updateTask(Long id, UpdateTaskRequest request) {
        Task task = taskRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("任务未找到: " + id));
        
        if (request.getTitle() != null) {
            task.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            task.setDescription(request.getDescription());
        }
        if (request.getStatus() != null) {
            task.setStatus(request.getStatus());
        }
        if (request.getPriority() != null) {
            task.setPriority(request.getPriority());
        }
        if (request.getTags() != null) {
            task.setTags(request.getTags());
        }
        if (request.getDueAt() != null) {
            task.setDueAt(request.getDueAt());
        }
        
        Task saved = taskRepository.save(task);
        return TaskResponse.from(saved);
    }

    @Transactional
    public void deleteTask(Long id) {
        if (!taskRepository.existsById(id)) {
            throw new ResourceNotFoundException("任务未找到: " + id);
        }
        taskRepository.deleteById(id);
    }
}
