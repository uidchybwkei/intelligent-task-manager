# Intelligent Task Management System

## Role Track

AI / LLM

## Tech Stack

- Backend: Spring Boot 3.2.1 (Java 17), MySQL 8.0, JPA (Hibernate), Spring Validation, Spring Actuator
- Frontend: React 18 + TypeScript + Vite, Tailwind CSS, shadcn/ui components, TanStack Query, React Hook Form
- AI Agent: Python 3.10 + OpenAI API (Qwen models), FastAPI
- Database: MySQL with UTF8MB4 charset
- Other tools: Cursor IDE, Figma for UI design

## Features Implemented

- [X]  Task CRUD
- [X]  AI: Natural language task creation (parse title/description/due/priority/tags)
- [X]  AI: Tag suggestion
- [X]  AI: Task breakdown / summarization / similar task detection / semantic search
- [X]  Frontend UI with list/kanban views
- [X]  Tag management system
- [X]  OpenAPI/Swagger documentation

## Setup Instructions

### Prerequisites

- Java 17+
- Node 18+
- MySQL 8+

### Configuration

- Backend environment variables (copy from backend/env.example):
  - DB_URL: MySQL connection URL (e.g., jdbc:mysql://localhost:3306/taskdb)
  - DB_USER: MySQL username
  - DB_PASSWORD: MySQL password

- AI Agent environment variables:
  - DASHSCOPE_API_KEY: DashScope API key for Qwen AI models

- Frontend environment variables (optional, defaults to localhost):
  - VITE_API_BASE_URL: Backend API URL (default: http://localhost:8080)
  - VITE_AI_AGENT_URL: AI Agent API URL (default: http://localhost:8001)

- AI calls are made directly from frontend to AI Agent service for simplicity

### Run

1. Start MySQL database and create database schema using SQL_init/SQL_init.sql
2. Configure backend environment variables (copy backend/env.example to .env)
3. Set DASHSCOPE_API_KEY environment variable for AI Agent
4. Backend: cd backend && ./mvnw spring-boot:run
5. AI Agent: cd ai_agent && pip install -r requirements.txt && python api_server.py
6. Frontend: cd frontend && npm install && npm run dev

## API Documentation

- Backend API: http://localhost:8080/swagger-ui.html (SpringDoc OpenAPI)
- AI Agent API: http://localhost:8001/docs (FastAPI automatic docs)
- Backend endpoints (http://localhost:8080):
  - GET/POST/PUT/DELETE /api/tasks - Task CRUD operations
  - GET /api/tasks?status=&priority=&tag=&sortBy=&sortDirection=&page=&size= - Filtered task list
  - GET/POST/DELETE /api/tasks/tags - Tag management

- AI Agent endpoints (http://localhost:8001):
  - POST /api/parse-task - AI natural language task creation
  - POST /api/suggest-tags - AI tag suggestion
  - POST /api/find-similar-tasks - AI similar task detection
  - POST /api/semantic-search - AI semantic search
  - POST /api/generate-summary - AI task summary generation

## Design Decisions

- **Security**: AI API calls are server-side only to protect API keys and prevent client-side exposure
- **Architecture**: Clean separation between backend (data/business logic), AI agent (ML features), and frontend (UI)
- **Database**: MySQL with proper indexing for status, priority, and date fields; supports future Redis caching layer
- **AI Integration**: Python-based AI agent with FastAPI for clean API boundaries and easier ML library integration
- **Frontend**: shadcn/ui for consistent design system, TanStack Query for efficient data fetching and caching
- **Error Handling**: Global exception handling with structured error responses
- **API Design**: RESTful conventions with OpenAPI documentation for maintainability

## Future Improvements

- Authentication and authorization system
- Rate limiting for API endpoints
- Vector database integration for semantic search (Pinecone/ChromaDB)
- Real-time updates with WebSocket
- Unit and integration tests
- CI/CD pipeline with GitHub Actions
- Task dependencies and relationships
- File attachments for tasks
- Mobile app with React Native
- Advanced AI features (task breakdown, smart scheduling)

## Project Structure

```
task-management-system/
├── backend/                    # Spring Boot application
│   ├── src/main/java/com/task/manager/
│   │   ├── config/            # Configuration classes
│   │   ├── controller/        # REST controllers
│   │   ├── domain/           # JPA entities
│   │   ├── dto/              # Data transfer objects
│   │   ├── exception/        # Exception handling
│   │   ├── repository/       # JPA repositories
│   │   └── service/          # Business logic
│   ├── src/test/             # Unit tests
│   └── pom.xml               # Maven configuration
├── frontend/                  # React application
│   ├── src/
│   │   ├── api/              # API client functions
│   │   ├── app/              # Main app components
│   │   │   ├── components/   # Reusable UI components
│   │   │   └── pages/        # Page components
│   │   ├── hooks/            # Custom React hooks
│   │   └── types/            # TypeScript type definitions
│   └── package.json          # NPM dependencies
├── ai_agent/                  # Python AI services
│   ├── ai_*.py               # AI feature implementations
│   ├── api_server.py        # FastAPI server
│   └── requirements.txt      # Python dependencies
├── SQL_init/                 # Database initialization
└── README.md                 # This file
```

## Time Spent

Approximately 4 hours
