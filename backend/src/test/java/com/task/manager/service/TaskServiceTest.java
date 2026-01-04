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
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TaskServiceTest {

    @Mock
    private TaskRepository taskRepository;

    @InjectMocks
    private TaskService taskService;

    @Test
    void createTask_shouldReturnTaskResponse() {
        CreateTaskRequest request = new CreateTaskRequest();
        request.setTitle("Test Task");
        request.setDescription("Description");
        request.setStatus(TaskStatus.PENDING);
        request.setPriority(TaskPriority.HIGH);
        request.setTags(Set.of("urgent"));

        Task savedTask = new Task();
        savedTask.setId(1L);
        savedTask.setTitle(request.getTitle());
        savedTask.setDescription(request.getDescription());
        savedTask.setStatus(request.getStatus());
        savedTask.setPriority(request.getPriority());
        savedTask.setTags(request.getTags());

        when(taskRepository.save(any(Task.class))).thenReturn(savedTask);

        TaskResponse response = taskService.createTask(request);

        assertNotNull(response);
        assertEquals("Test Task", response.getTitle());
        assertEquals(TaskStatus.PENDING, response.getStatus());
        assertEquals(TaskPriority.HIGH, response.getPriority());
        assertTrue(response.getTags().contains("urgent"));
        verify(taskRepository).save(any(Task.class));
    }

    @Test
    void getTask_whenExists_shouldReturnTask() {
        Task task = new Task();
        task.setId(1L);
        task.setTitle("Existing Task");
        task.setStatus(TaskStatus.IN_PROGRESS);
        task.setPriority(TaskPriority.MEDIUM);

        when(taskRepository.findById(1L)).thenReturn(Optional.of(task));

        TaskResponse response = taskService.getTask(1L);

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals("Existing Task", response.getTitle());
    }

    @Test
    void getTask_whenNotExists_shouldThrowException() {
        when(taskRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> taskService.getTask(999L));
    }

    @Test
    void getTasks_withFiltersAndPagination_shouldReturnPagedResults() {
        Task task1 = new Task();
        task1.setId(1L);
        task1.setTitle("Task 1");
        task1.setStatus(TaskStatus.PENDING);
        task1.setPriority(TaskPriority.HIGH);
        task1.setTags(Set.of("backend"));

        Task task2 = new Task();
        task2.setId(2L);
        task2.setTitle("Task 2");
        task2.setStatus(TaskStatus.PENDING);
        task2.setPriority(TaskPriority.HIGH);
        task2.setTags(Set.of("backend"));

        Page<Task> page = new PageImpl<>(List.of(task1, task2));
        when(taskRepository.findWithFilters(
            any(), any(), any(), any(Pageable.class)
        )).thenReturn(page);

        PageResponse<TaskResponse> response = taskService.getTasks(
            TaskStatus.PENDING, TaskPriority.HIGH, "backend",
            "createdAt", "asc", 0, 20
        );

        assertNotNull(response);
        assertEquals(2, response.getContent().size());
        assertEquals(2, response.getTotalElements());
        assertEquals("Task 1", response.getContent().get(0).getTitle());
    }

    @Test
    void updateTask_shouldUpdateFields() {
        Task existingTask = new Task();
        existingTask.setId(1L);
        existingTask.setTitle("Old Title");
        existingTask.setStatus(TaskStatus.PENDING);
        existingTask.setPriority(TaskPriority.LOW);

        UpdateTaskRequest request = new UpdateTaskRequest();
        request.setTitle("New Title");
        request.setStatus(TaskStatus.COMPLETED);

        when(taskRepository.findById(1L)).thenReturn(Optional.of(existingTask));
        when(taskRepository.save(any(Task.class))).thenReturn(existingTask);

        TaskResponse response = taskService.updateTask(1L, request);

        assertEquals("New Title", response.getTitle());
        assertEquals(TaskStatus.COMPLETED, response.getStatus());
        verify(taskRepository).save(existingTask);
    }

    @Test
    void deleteTask_whenExists_shouldDelete() {
        when(taskRepository.existsById(1L)).thenReturn(true);

        taskService.deleteTask(1L);

        verify(taskRepository).deleteById(1L);
    }

    @Test
    void deleteTask_whenNotExists_shouldThrowException() {
        when(taskRepository.existsById(999L)).thenReturn(false);

        assertThrows(ResourceNotFoundException.class, () -> taskService.deleteTask(999L));
    }
}
