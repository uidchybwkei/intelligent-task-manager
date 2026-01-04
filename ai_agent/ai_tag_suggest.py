#!/usr/bin/env python3
"""
AI 标签建议模块
基于任务标题和描述，从后端已有标签中推荐相关标签，必要时创建新标签
"""
import json
import os
import requests
from typing import List
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("DASHSCOPE_API_KEY")
BACKEND_API_URL = os.getenv("BACKEND_API_URL", "http://localhost:8080")

if not API_KEY:
    raise ValueError("DASHSCOPE_API_KEY not found in environment variables")

client = OpenAI(
    api_key=API_KEY,
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
)


def fetch_existing_tags() -> List[str]:
    """从后端获取所有现有标签"""
    try:
        response = requests.get(f"{BACKEND_API_URL}/api/tasks/tags", timeout=5)
        response.raise_for_status()
        tags = response.json()
        return tags if isinstance(tags, list) else []
    except Exception as e:
        print(f"Warning: Failed to fetch tags from backend: {str(e)}")
        return []


def get_system_prompt(existing_tags: List[str]) -> str:
    """构建 AI 系统提示词"""
    tags_list = ", ".join(f'"{tag}"' for tag in existing_tags) if existing_tags else "暂无已有标签"
    
    return f"""You are an expert task tagging assistant for a task management system.

Your goal is to suggest practical, meaningful tags that help users organize and find tasks easily.

**Available tags in the system:**
{tags_list}

**Tag Selection Strategy:**
1. **Prioritize existing tags** - Always prefer tags from the available list when they match the task
2. **Domain/Area** (必选): What area? (frontend, backend, design, devops, marketing, etc.)
3. **Technology** (如适用): Specific tech mentioned (react, java, python, sql, etc.)
4. **Task Type** (推荐): What kind of work? (feature, bug, refactor, docs, test, research, etc.)
5. **Priority/Urgency** (如适用): Time sensitivity (urgent, blocked, waiting, etc.)
6. **Status Indicators** (可选): Current state (in-progress, review, planning, etc.)

**Rules:**
- Return 3-6 tags (minimum 3, maximum 6)
- Each tag: 1-2 words, lowercase, no spaces or symbols (use hyphen for compound words like "code-review")
- BE SPECIFIC: "react" better than "code", "database" better than "work"
- Match input language: Chinese task → Chinese tags, English task → English tags
- **MUST use existing tags when relevant** - only create new tags if absolutely necessary

Return STRICT JSON ONLY. No explanation, no markdown.

JSON schema:
{{
  "tags": string[]
}}

**Examples:**

Input:
Title: 完成前端登录页面
Description: 使用 React 和 Tailwind CSS 实现用户认证

Available tags: "frontend", "backend", "react", "vue", "bug", "feature"
Output: {{"tags": ["frontend", "react", "feature", "认证", "ui"]}}

Input:
Title: Fix MySQL slow query performance issue
Description: Users reporting 5s load time on dashboard

Available tags: "backend", "database", "frontend", "bug", "performance", "urgent"
Output: {{"tags": ["backend", "database", "bug", "performance", "urgent"]}}

Input:
Title: 研究 Redis 缓存方案
Description: 评估不同的缓存策略

Available tags: "backend", "研究", "性能优化"
Output: {{"tags": ["backend", "redis", "研究", "性能优化", "cache"]}}

Input:
Title: Write API documentation for v2 endpoints
Description: Document all new REST APIs

Available tags: "docs", "api", "backend"
Output: {{"tags": ["docs", "api", "backend", "writing"]}}
"""


def suggest_tags_with_ai(title: str, description: str = None) -> List[str]:
    """
    使用 AI 根据标题和描述推荐标签
    
    Args:
        title: 任务标题
        description: 任务描述（可选）
    
    Returns:
        推荐的标签列表
    """
    try:
        # 获取后端现有标签
        existing_tags = fetch_existing_tags()
        
        # 构建用户输入
        user_input = f"Title: {title}"
        if description:
            user_input += f"\nDescription: {description}"
        
        # 调用 AI
        completion = client.chat.completions.create(
            model="qwen-flash-2025-07-28",
            messages=[
                {"role": "system", "content": get_system_prompt(existing_tags)},
                {"role": "user", "content": f"请为以下任务推荐标签（优先使用已有标签）：\n\n{user_input}"}
            ],
            temperature=0.1,  # 降低温度，使输出更稳定和确定性
            max_tokens=300
        )
        
        ai_response = completion.choices[0].message.content.strip()
        
        # 清理 markdown 代码块
        if "```json" in ai_response:
            ai_response = ai_response.split("```json")[1].split("```")[0].strip()
        elif "```" in ai_response:
            ai_response = ai_response.split("```")[1].split("```")[0].strip()
        
        # 解析 JSON
        result = json.loads(ai_response)
        tags = result.get("tags", [])
        
        # 验证和清理标签
        cleaned_tags = []
        for tag in tags:
            if not tag or not isinstance(tag, str):
                continue
            
            # 清理标签
            tag = tag.strip().lower()
            
            # 移除特殊字符（保留连字符、中文、字母、数字）
            tag = ''.join(c for c in tag if c.isalnum() or c == '-' or c == '_' or '\u4e00' <= c <= '\u9fff')
            
            # 跳过空标签或过长标签
            if not tag or len(tag) > 20:
                continue
            
            # 跳过重复标签
            if tag in cleaned_tags:
                continue
            
            cleaned_tags.append(tag)
        
        # 确保返回 3-6 个标签
        cleaned_tags = cleaned_tags[:6]
        
        if len(cleaned_tags) < 3:
            # 如果标签太少，添加一些通用标签
            existing_tags = fetch_existing_tags()
            if existing_tags and len(cleaned_tags) < 3:
                for etag in existing_tags[:3]:
                    if etag.lower() not in cleaned_tags:
                        cleaned_tags.append(etag.lower())
                        if len(cleaned_tags) >= 3:
                            break
        
        return cleaned_tags[:6]
        
    except json.JSONDecodeError as e:
        raise Exception(f"JSON parse failed: {str(e)}\nResponse: {ai_response}")
    except Exception as e:
        raise Exception(f"Tag suggestion failed: {str(e)}")


def main():
    """命令行测试入口"""
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python ai_tag_suggest.py <title> [description]", file=sys.stderr)
        print("\nExample:", file=sys.stderr)
        print('  python ai_tag_suggest.py "完成用户认证功能" "实现JWT登录和注册"', file=sys.stderr)
        sys.exit(1)
    
    title = sys.argv[1]
    description = sys.argv[2] if len(sys.argv) > 2 else None
    
    try:
        tags = suggest_tags_with_ai(title, description)
        print(json.dumps({"tags": tags}, ensure_ascii=False, indent=2))
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
