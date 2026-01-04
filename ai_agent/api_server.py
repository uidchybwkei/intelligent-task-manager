#!/usr/bin/env python3
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import uvicorn
from ai_new_task import parse_task_with_ai

app = FastAPI(title="AI Task Parser API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ParseTaskRequest(BaseModel):
    input: str


class TaskObject(BaseModel):
    title: str
    description: Optional[str] = None
    due_at: Optional[str] = None
    priority: Optional[str] = None


class ParseTaskResponse(BaseModel):
    success: bool
    data: Optional[TaskObject] = None
    error: Optional[str] = None


@app.get("/")
async def root():
    return {"service": "AI Task Parser API", "status": "running"}


@app.post("/api/parse-task", response_model=ParseTaskResponse)
async def parse_task(request: ParseTaskRequest):
    if not request.input or not request.input.strip():
        raise HTTPException(status_code=400, detail="Input cannot be empty")
    
    try:
        task_obj = parse_task_with_ai(request.input.strip())
        return ParseTaskResponse(success=True, data=TaskObject(**task_obj))
    except Exception as e:
        return ParseTaskResponse(success=False, error=str(e))


if __name__ == "__main__":
    print("🚀 Starting AI Task Parser API on http://localhost:8001")
    print("📍 API docs: http://localhost:8001/docs")
    uvicorn.run(app, host="0.0.0.0", port=8001, log_level="info")
