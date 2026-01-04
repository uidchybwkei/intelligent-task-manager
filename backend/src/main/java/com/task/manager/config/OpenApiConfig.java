package com.task.manager.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {
    @Bean
    public OpenAPI taskManagerOpenAPI() {
        return new OpenAPI()
            .info(new Info()
                .title("任务管理系统 API")
                .description("任务管理系统核心 REST API")
                .version("1.0.0"));
    }
}
