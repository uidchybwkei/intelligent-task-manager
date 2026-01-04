package com.task.manager.config;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.UUID;

@Component
@Slf4j
public class RequestIdFilter implements Filter {
    private static final String REQUEST_ID = "requestId";

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
        throws IOException, ServletException {
        
        String requestId = UUID.randomUUID().toString();
        MDC.put(REQUEST_ID, requestId);
        
        try {
            if (request instanceof HttpServletRequest httpRequest) {
                log.info("Request: {} {}", httpRequest.getMethod(), httpRequest.getRequestURI());
            }
            chain.doFilter(request, response);
        } finally {
            MDC.remove(REQUEST_ID);
        }
    }
}
