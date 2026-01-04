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
    return """You are a task similarity analyzer.

Given a target task and a list of existing tasks, identify the most similar ones.

Rules:
- Similarity based on meaning, not exact wording
- Return at most 5 tasks
- Include similarity score (0.0–1.0)
- Only return tasks with score >= 0.3

Return STRICT JSON ONLY.

JSON schema:
{
  "similar_tasks": [
    {
      "task_id": number,
      "score": number
    }
  ]
}

Examples:

Input:
Target: {"title": "Fix login bug", "description": "Users can't sign in"}
Tasks: [
  {"id": 1, "title": "Implement authentication", "description": "Add JWT login"},
  {"id": 2, "title": "Update homepage design", "description": "New layout"},
  {"id": 3, "title": "Debug authentication issue", "description": "Login fails"}
]

Output: {"similar_tasks": [{"task_id": 3, "score": 0.92}, {"task_id": 1, "score": 0.65}]}

Input:
Target: {"title": "Write unit tests", "description": "Add tests for API"}
Tasks: [
  {"id": 5, "title": "Add integration tests", "description": "Test full flow"},
  {"id": 6, "title": "Setup database", "description": "Configure MySQL"},
  {"id": 7, "title": "Create test framework", "description": "Setup Jest"}
]

Output: {"similar_tasks": [{"task_id": 7, "score": 0.75}, {"task_id": 5, "score": 0.68}]}
"""


def find_similar_tasks(target_task: Dict[str, Any], all_tasks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Find similar tasks using AI"""
    try:
        if not all_tasks or len(all_tasks) == 0:
            return []

        # Build target task info
        target_info = {
            "title": target_task.get("title", ""),
            "description": target_task.get("description", "")
        }

        # Build task list for comparison
        task_list = []
        for task in all_tasks:
            # Skip the target task itself
            if task.get("id") == target_task.get("id"):
                continue
            
            task_info = {
                "id": task.get("id"),
                "title": task.get("title", ""),
                "description": task.get("description", "")
            }
            task_list.append(task_info)

        if len(task_list) == 0:
            return []

        # Build prompt
        user_input = f"""Target task:
{json.dumps(target_info, ensure_ascii=False)}

Existing tasks:
{json.dumps(task_list, ensure_ascii=False)}"""

        # Call AI
        completion = client.chat.completions.create(
            model="qwen-flash-2025-07-28",
            messages=[
                {"role": "system", "content": get_system_prompt()},
                {"role": "user", "content": user_input}
            ],
            temperature=0.1,
            max_tokens=500
        )

        ai_response = completion.choices[0].message.content.strip()

        # Clean markdown
        if "```json" in ai_response:
            ai_response = ai_response.split("```json")[1].split("```")[0].strip()
        elif "```" in ai_response:
            ai_response = ai_response.split("```")[1].split("```")[0].strip()

        # Parse JSON
        result = json.loads(ai_response)
        similar_tasks = result.get("similar_tasks", [])

        # Validate results
        valid_tasks = []
        for task in similar_tasks[:5]:  # Max 5 tasks
            if isinstance(task, dict) and "task_id" in task and "score" in task:
                score = float(task["score"])
                if 0.0 <= score <= 1.0 and score >= 0.3:  # Only scores >= 0.3
                    valid_tasks.append({
                        "task_id": int(task["task_id"]),
                        "score": round(score, 2)
                    })

        return valid_tasks

    except json.JSONDecodeError as e:
        raise Exception(f"JSON parse failed: {str(e)}\nResponse: {ai_response}")
    except Exception as e:
        raise Exception(f"Similar tasks search failed: {str(e)}")


def main():
    import sys

    if len(sys.argv) < 3:
        print("Usage: python ai_similar_tasks.py <target_task_json> <all_tasks_json>", file=sys.stderr)
        print("\nExample:", file=sys.stderr)
        print('  python ai_similar_tasks.py \'{"title":"Fix bug"}\' \'[{"id":1,"title":"Debug issue"}]\'', file=sys.stderr)
        sys.exit(1)

    target_json = sys.argv[1]
    tasks_json = sys.argv[2]

    try:
        target_task = json.loads(target_json)
        all_tasks = json.loads(tasks_json)
        similar = find_similar_tasks(target_task, all_tasks)
        print(json.dumps({"similar_tasks": similar}, ensure_ascii=False, indent=2))
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
