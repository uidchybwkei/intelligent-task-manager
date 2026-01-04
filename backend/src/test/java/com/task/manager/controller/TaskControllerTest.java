package com.task.manager.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.task.manager.domain.Task.TaskPriority;
import com.task.manager.domain.Task.TaskStatus;
import com.task.manager.dto.CreateTaskRequest;
import com.task.manager.dto.PageResponse;
import com.task.manager.dto.TaskResponse;
import com.task.manager.service.TaskService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Set;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(TaskController.class)
class TaskControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private TaskService taskService;

    @Test
    void createTask_withValidRequest_shouldReturnCreated() throws Exception {
        CreateTaskRequest request = new CreateTaskRequest();
        request.setTitle("Test Task");
        request.setDescription("Test Description");
        request.setStatus(TaskStatus.PENDING);
        request.setPriority(TaskPriority.HIGH);
        request.setTags(Set.of("test"));

        TaskResponse response = new TaskResponse();
        response.setId(1L);
        response.setTitle(request.getTitle());
        response.setStatus(request.getStatus());
        response.setPriority(request.getPriority());
        response.setTags(request.getTags());

        when(taskService.createTask(any(CreateTaskRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/tasks")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").value(1))
            .andExpect(jsonPath("$.title").value("Test Task"))
            .andExpect(jsonPath("$.status").value("PENDING"));
    }

    @Test
    void createTask_withInvalidRequest_shouldReturnBadRequest() throws Exception {
        CreateTaskRequest request = new CreateTaskRequest();
        // title is required

        mockMvc.perform(post("/api/tasks")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest());
    }

    @Test
    void getTasks_shouldReturnPagedResults() throws Exception {
        TaskResponse task1 = new TaskResponse();
        task1.setId(1L);
        task1.setTitle("Task 1");

        PageResponse<TaskResponse> pageResponse = new PageResponse<>(
            List.of(task1), 0, 20, 1, 1
        );

        when(taskService.getTasks(any(), any(), any(), any(), any(), any(Integer.class), any(Integer.class)))
            .thenReturn(pageResponse);

        mockMvc.perform(get("/api/tasks")
                .param("page", "0")
                .param("size", "20"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content[0].id").value(1))
            .andExpect(jsonPath("$.totalElements").value(1));
    }
}
