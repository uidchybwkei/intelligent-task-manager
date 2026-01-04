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
    return """You are an assistant that summarizes task activity.

Given a list of tasks, generate a concise summary in English.

Rules:
- Focus on progress and patterns
- Mention completed vs pending tasks
- Highlight priority items
- Note any overdue tasks
- Be concise (5–7 sentences)
- Use clear, professional language
- Always respond in English

Return STRICT JSON ONLY.

JSON schema:
{
  "summary": string
}

Examples:

Input:
Tasks: [
  {"title": "Complete login page", "status": "COMPLETED", "priority": "HIGH"},
  {"title": "Fix database bug", "status": "IN_PROGRESS", "priority": "HIGH"},
  {"title": "Write documentation", "status": "PENDING", "priority": "LOW"}
]

Output: {"summary": "Today has 3 tasks. Completed 1 high-priority task (login page). Currently working on database bug fix. One low-priority task pending (documentation). Good overall progress with key work completed. Focus on completing the high-priority database fix."}

Input:
Tasks: [
  {"title": "Setup CI/CD pipeline", "status": "COMPLETED", "priority": "HIGH"},
  {"title": "Code review PR #123", "status": "COMPLETED", "priority": "MEDIUM"},
  {"title": "Update dependencies", "status": "PENDING", "priority": "LOW"}
]

Output: {"summary": "Completed 2 out of 3 tasks today. Successfully set up CI/CD pipeline (high priority) and reviewed PR #123. One low-priority task remains: updating dependencies. Strong progress on critical infrastructure work. Consider scheduling the dependency update for tomorrow."}
"""


def generate_summary(tasks: List[Dict[str, Any]], period: str = "daily") -> str:
    try:
        if not tasks:
            if period == "daily":
                return "No tasks today. Consider creating some tasks to plan your day."
            else:
                return "No tasks this week. Consider creating some tasks to organize your work."

        task_data = []
        for task in tasks:
            task_info = {
                "title": task.get("title", ""),
                "status": task.get("status", "PENDING"),
                "priority": task.get("priority", "MEDIUM"),
            }
            if task.get("dueAt"):
                task_info["dueAt"] = task["dueAt"]
            task_data.append(task_info)

        period_text = "this week" if period == "weekly" else "today"
        user_input = f"Tasks for {period_text}:\n{json.dumps(task_data, ensure_ascii=False, indent=2)}"

        completion = client.chat.completions.create(
            model="qwen-flash-2025-07-28",
            messages=[
                {"role": "system", "content": get_system_prompt()},
                {"role": "user", "content": user_input}
            ],
            temperature=0.3,
            max_tokens=500
        )

        ai_response = completion.choices[0].message.content.strip()

        if "```json" in ai_response:
            ai_response = ai_response.split("```json")[1].split("```")[0].strip()
        elif "```" in ai_response:
            ai_response = ai_response.split("```")[1].split("```")[0].strip()

        result = json.loads(ai_response)
        summary = result.get("summary", "")

        if not summary:
            raise Exception("AI returned empty summary")

        return summary

    except json.JSONDecodeError as e:
        raise Exception(f"JSON parse failed: {str(e)}\nResponse: {ai_response}")
    except Exception as e:
        raise Exception(f"Summary generation failed: {str(e)}")


def main():
    import sys

    if len(sys.argv) < 2:
        print("Usage: python ai_summary.py <tasks_json> [period]", file=sys.stderr)
        print("\nExample:", file=sys.stderr)
        print('  python ai_summary.py \'[{"title":"Complete login","status":"COMPLETED"}]\' daily', file=sys.stderr)
        sys.exit(1)

    tasks_json = sys.argv[1]
    period = sys.argv[2] if len(sys.argv) > 2 else "daily"

    try:
        tasks = json.loads(tasks_json)
        summary = generate_summary(tasks, period)
        print(json.dumps({"summary": summary}, ensure_ascii=False, indent=2))
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
