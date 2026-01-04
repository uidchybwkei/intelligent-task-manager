#!/usr/bin/env python3
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import uvicorn
from ai_new_task import parse_task_with_ai
from ai_tag_suggest import suggest_tags_with_ai

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


class SuggestTagsRequest(BaseModel):
    title: str
    description: Optional[str] = None


class SuggestTagsResponse(BaseModel):
    success: bool
    tags: Optional[List[str]] = None
    error: Optional[str] = None


@app.get("/")
async def root():
    return {"service": "AI Task Parser API", "status": "running"}


@app.post("/api/parse-task", response_model=ParseTaskResponse)
async def parse_task(request: ParseTaskRequest):
    """解析自然语言输入为结构化任务对象"""
    if not request.input or not request.input.strip():
        raise HTTPException(status_code=400, detail="Input cannot be empty")
    
    try:
        task_obj = parse_task_with_ai(request.input.strip())
        return ParseTaskResponse(success=True, data=TaskObject(**task_obj))
    except Exception as e:
        return ParseTaskResponse(success=False, error=str(e))


@app.post("/api/suggest-tags", response_model=SuggestTagsResponse)
async def suggest_tags(request: SuggestTagsRequest):
    """基于任务标题和描述推荐标签（从后端真实标签中选择）"""
    if not request.title or not request.title.strip():
        raise HTTPException(status_code=400, detail="Title cannot be empty")
    
    try:
        tags = suggest_tags_with_ai(request.title.strip(), request.description)
        return SuggestTagsResponse(success=True, tags=tags)
    except Exception as e:
        return SuggestTagsResponse(success=False, error=str(e))


if __name__ == "__main__":
    print("🚀 Starting AI Task Parser API on http://localhost:8001")
    print("📍 API docs: http://localhost:8001/docs")
    print("📝 Endpoints:")
    print("   - POST /api/parse-task: 解析自然语言为任务")
    print("   - POST /api/suggest-tags: AI 标签建议")
    uvicorn.run(app, host="0.0.0.0", port=8001, log_level="info")
