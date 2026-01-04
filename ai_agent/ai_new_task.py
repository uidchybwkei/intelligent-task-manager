#!/usr/bin/env python3
import json
import sys
import os
from datetime import datetime, timedelta
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


def get_system_prompt():
    today = datetime.now()
    return f"""You are an intelligent task parsing assistant.

Your job is to convert a natural language instruction into a structured task object.

Today's date is: {today.strftime('%Y-%m-%d %A')}

Rules:
- The input may be Chinese, English, or mixed.
- If information is missing, infer conservatively.
- Do NOT hallucinate dates or priorities if not implied.
- Prefer clarity over verbosity.
- For relative dates like "明天" (tomorrow), "下周" (next week), calculate based on today's date.
- Time format: ISO 8601 (e.g., 2026-01-05T15:00:00)

Return STRICT JSON ONLY. No explanation, no markdown code blocks, just pure JSON.

JSON schema:
{{
  "title": string,
  "description": string | null,
  "due_at": string | null,        // ISO 8601, e.g. 2026-01-05T15:00:00
  "priority": "LOW" | "MEDIUM" | "HIGH" | null
}}

Examples:

Input: 明天下午三点提醒我买菜
Output: {{"title": "买菜", "description": "提醒买菜", "due_at": "{(today + timedelta(days=1)).strftime('%Y-%m-%d')}T15:00:00", "priority": "MEDIUM"}}

Input: Finish backend pagination
Output: {{"title": "Finish backend pagination", "description": null, "due_at": null, "priority": "MEDIUM"}}

Input: 高优先级：完成季度报告，本周五前
Output: {{"title": "完成季度报告", "description": "季度报告", "due_at": "<this Friday at 23:59>", "priority": "HIGH"}}
"""


def parse_task_with_ai(user_input: str) -> dict:
    try:
        completion = client.chat.completions.create(
            model="qwen-flash-2025-07-28",
            messages=[
                {"role": "system", "content": get_system_prompt()},
                {"role": "user", "content": f"Now parse the following input:\n{user_input}"}
            ],
            temperature=0.3,
            max_tokens=500
        )
        
        ai_response = completion.choices[0].message.content.strip()
        
        # Extract JSON from markdown code blocks if present
        if "```json" in ai_response:
            ai_response = ai_response.split("```json")[1].split("```")[0].strip()
        elif "```" in ai_response:
            ai_response = ai_response.split("```")[1].split("```")[0].strip()
        
        task_obj = json.loads(ai_response)
        
        if "title" not in task_obj or not task_obj["title"]:
            raise ValueError("Task title is required")
        
        valid_priorities = ["LOW", "MEDIUM", "HIGH", None]
        if task_obj.get("priority") not in valid_priorities:
            task_obj["priority"] = None
            
        return task_obj
        
    except json.JSONDecodeError as e:
        raise Exception(f"JSON parse failed: {str(e)}\nResponse: {ai_response}")
    except Exception as e:
        raise Exception(f"Parse task failed: {str(e)}")


def main():
    if len(sys.argv) < 2:
        print("Usage: python ai_new_task.py <task description>", file=sys.stderr)
        sys.exit(1)
    
    user_input = " ".join(sys.argv[1:])
    
    try:
        task_obj = parse_task_with_ai(user_input)
        print(json.dumps(task_obj, ensure_ascii=False, indent=2))
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
