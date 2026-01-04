#!/usr/bin/env python3
import json
import os
from typing import List, Dict, Any
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("DASHSCOPE_API_KEY")

if not API_KEY:
    raise ValueError("DASHSCOPE_API_KEY not found in environment variables")

client = OpenAI(
    api_key=API_KEY,
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
)


def get_system_prompt() -> str:
    return """You are a semantic search assistant for tasks.

Given a query and a list of tasks, rank tasks by semantic relevance.

Rules:
- Do not rely on keyword matching only
- Consider meaning and context
- Higher score = more relevant
- Return all tasks with relevance score >= 0.2
- Order by score descending

Return STRICT JSON ONLY.

JSON schema:
{
  "results": [
    {
      "task_id": number,
      "score": number
    }
  ]
}

Examples:

Input:
Query: "login problems"
Tasks: [
  {"id": 1, "title": "Fix authentication bug", "description": "Users can't sign in"},
  {"id": 2, "title": "Update homepage", "description": "New design"},
  {"id": 3, "title": "Add OAuth support", "description": "Google login"}
]

Output: {"results": [{"task_id": 1, "score": 0.95}, {"task_id": 3, "score": 0.75}]}

Input:
Query: "performance optimization"
Tasks: [
  {"id": 5, "title": "Speed up database queries", "description": "Add indexes"},
  {"id": 6, "title": "Write documentation", "description": "API docs"},
  {"id": 7, "title": "Cache API responses", "description": "Use Redis"}
]

Output: {"results": [{"task_id": 5, "score": 0.88}, {"task_id": 7, "score": 0.82}]}
"""


def semantic_search(query: str, tasks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Search tasks using semantic similarity"""
    try:
        if not query or not tasks:
            return []

        # Build task list
        task_list = []
        for task in tasks:
            task_info = {
                "id": task.get("id"),
                "title": task.get("title", ""),
                "description": task.get("description", ""),
                "tags": task.get("tags", [])
            }
            task_list.append(task_info)

        # Build prompt
        user_input = f"""Query: {query}

Tasks:
{json.dumps(task_list, ensure_ascii=False)}"""

        # Call AI
        completion = client.chat.completions.create(
            model="qwen-flash-2025-07-28",
            messages=[
                {"role": "system", "content": get_system_prompt()},
                {"role": "user", "content": user_input}
            ],
            temperature=0.1,
            max_tokens=1000
        )

        ai_response = completion.choices[0].message.content.strip()

        # Clean markdown
        if "```json" in ai_response:
            ai_response = ai_response.split("```json")[1].split("```")[0].strip()
        elif "```" in ai_response:
            ai_response = ai_response.split("```")[1].split("```")[0].strip()

        # Parse JSON
        result = json.loads(ai_response)
        results = result.get("results", [])

        # Validate and sort
        valid_results = []
        for item in results:
            if isinstance(item, dict) and "task_id" in item and "score" in item:
                score = float(item["score"])
                if 0.0 <= score <= 1.0 and score >= 0.2:
                    valid_results.append({
                        "task_id": int(item["task_id"]),
                        "score": round(score, 2)
                    })

        # Sort by score descending
        valid_results.sort(key=lambda x: x["score"], reverse=True)

        return valid_results

    except json.JSONDecodeError as e:
        raise Exception(f"JSON parse failed: {str(e)}\nResponse: {ai_response}")
    except Exception as e:
        raise Exception(f"Semantic search failed: {str(e)}")


def main():
    import sys

    if len(sys.argv) < 3:
        print("Usage: python ai_semantic_search.py <query> <tasks_json>", file=sys.stderr)
        print("\nExample:", file=sys.stderr)
        print('  python ai_semantic_search.py "login" \'[{"id":1,"title":"Fix auth"}]\'', file=sys.stderr)
        sys.exit(1)

    query = sys.argv[1]
    tasks_json = sys.argv[2]

    try:
        tasks = json.loads(tasks_json)
        results = semantic_search(query, tasks)
        print(json.dumps({"results": results}, ensure_ascii=False, indent=2))
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
