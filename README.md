# Intelligent Task Management System

## Role Track
AI / LLM

## Tech Stack
- Backend: Spring Boot (Java 17), MySQL, JPA (Hibernate)
- Frontend: React + TypeScript
- AI: Qwen API (via server-side integration)

## Features Implemented
- [ ] Task CRUD
- [ ] Filtering / sorting / pagination
- [ ] AI: Natural language task creation (parse title/description/due/priority/tags)
- [ ] AI: Tag suggestion
- [ ] AI: Task breakdown / summarization / similar task detection / semantic search

## Setup Instructions
### Prerequisites
- Java 17+
- Node 18+
- MySQL 8+
- (Optional) Docker

### Configuration
- Backend reads env vars:
  - DB_URL, DB_USER, DB_PASSWORD
  - QWEN_API_KEY
  - QWEN_BASE_URL (optional)
- Do not commit secrets.

### Run
- backend: ./mvnw spring-boot:run
- frontend: npm install && npm run dev

## API Documentation
TBD (OpenAPI/Swagger will be added)

## Design Decisions
- AI calls are server-side to protect API keys.
- MySQL as primary persistence layer; room for adding Redis + vector index later.

## Future Improvements
- Auth, rate limiting, vector search, WebSocket updates, tests, CI

## Time Spent
Approximately X hours
