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
import com.task.manager.repository.TagRepository;
import com.task.manager.domain.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TaskService {
    private final TaskRepository taskRepository;
    private final TagRepository tagRepository;

    @Transactional
    public TaskResponse createTask(CreateTaskRequest request) {
        Task task = new Task();
        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());
        task.setStatus(request.getStatus() != null ? request.getStatus() : TaskStatus.PENDING);
        task.setPriority(request.getPriority() != null ? request.getPriority() : TaskPriority.MEDIUM);
        
        if (request.getTags() != null) {
            task.setTags(request.getTags());
            // 同步保存标签到标签库
            saveTagsToDictionary(request.getTags());
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
            // 同步保存标签到标签库
            saveTagsToDictionary(request.getTags());
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

    /**
     * 获取所有标签（合并任务中使用的和独立创建的）
     */
    public List<String> getAllTags() {
        // 从任务中获取所有使用的标签
        List<String> usedTags = taskRepository.findAllDistinctTags();
        // 从标签库获取所有标签
        List<String> definedTags = tagRepository.findAll().stream()
                .map(Tag::getName)
                .toList();
        
        // 合并并去重
        Set<String> allTags = new java.util.HashSet<>(usedTags);
        allTags.addAll(definedTags);
        
        return allTags.stream().sorted().toList();
    }

    /**
     * 创建独立标签
     */
    @Transactional
    public void createTag(String name) {
        if (!tagRepository.existsByName(name)) {
            tagRepository.save(new Tag(name));
        }
    }

    /**
     * 删除标签
     */
    @Transactional
    public void deleteTag(String name) {
        // 从标签库删除
        tagRepository.deleteByName(name);
        
        // 现在的逻辑是：即使用户删除了标签库的标签，已经使用了该标签的任务不会受到影响
        // 如果要级联删除（从所有任务中移除该标签），需要额外的逻辑：
        // List<Task> tasks = taskRepository.findByTagsContaining(name);
        // ...
        // 目前保持简单，只删除标签库定义。前端会负责检查是否有关联任务。
    }

    private void saveTagsToDictionary(Set<String> tags) {
        for (String tagName : tags) {
            if (!tagRepository.existsByName(tagName)) {
                tagRepository.save(new Tag(tagName));
            }
        }
    }
}
