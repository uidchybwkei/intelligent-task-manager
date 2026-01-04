package com.task.manager.controller;

import com.task.manager.domain.Task.TaskPriority;
import com.task.manager.domain.Task.TaskStatus;
import com.task.manager.dto.CreateTaskRequest;
import com.task.manager.dto.PageResponse;
import com.task.manager.dto.TaskResponse;
import com.task.manager.dto.UpdateTaskRequest;
import com.task.manager.service.TaskService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
@Tag(name = "任务管理", description = "任务 CRUD 和查询接口")
public class TaskController {
    private final TaskService taskService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "创建任务")
    public TaskResponse createTask(@Valid @RequestBody CreateTaskRequest request) {
        return taskService.createTask(request);
    }

    @GetMapping("/{id}")
    @Operation(summary = "查询任务详情")
    public TaskResponse getTask(@PathVariable Long id) {
        return taskService.getTask(id);
    }

    @GetMapping
    @Operation(summary = "任务列表（支持过滤、排序、分页）")
    public PageResponse<TaskResponse> getTasks(
        @RequestParam(required = false) TaskStatus status,
        @RequestParam(required = false) TaskPriority priority,
        @RequestParam(required = false) String tag,
        @RequestParam(defaultValue = "createdAt") String sortBy,
        @RequestParam(defaultValue = "asc") String sortDirection,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return taskService.getTasks(status, priority, tag, sortBy, sortDirection, page, size);
    }

    @PutMapping("/{id}")
    @Operation(summary = "更新任务（部分更新）")
    public TaskResponse updateTask(
        @PathVariable Long id,
        @Valid @RequestBody UpdateTaskRequest request
    ) {
        return taskService.updateTask(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "删除任务")
    public void deleteTask(@PathVariable Long id) {
        taskService.deleteTask(id);
    }

    @GetMapping("/tags")
    @Operation(summary = "获取所有标签")
    public List<String> getAllTags() {
        return taskService.getAllTags();
    }

    @PostMapping("/tags")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "创建标签")
    public void createTag(@RequestBody Map<String, String> payload) {
        String name = payload.get("name");
        if (name != null && !name.isBlank()) {
            taskService.createTag(name.trim());
        }
    }

    @DeleteMapping("/tags/{name}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "删除标签")
    public void deleteTag(@PathVariable String name) {
        taskService.deleteTag(name);
    }
}
