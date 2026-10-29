#!/usr/bin/env python3
"""
b_team.py — Local GPU B-Team Co-Pilot for MyOS

Connects to local Ollama instance on localhost:11434 to run local LLMs 
(gemma4, mistral, llama3, llava) as a concurrent assistant for code review,
architecture design, and optimization tasks without cloud API costs.
"""

import sys
import json
import urllib.request
import urllib.error

OLLAMA_URL = "http://localhost:11434/api/generate"
DEFAULT_MODEL = "gemma4:latest"

SYSTEM_PROMPT = """You are B-Team, a senior system architect and performance engineer co-pilot for MyOS.
Your job is to assist Dad (the creator) and Antigravity (the primary AI assistant) by analyzing code,
proposing concrete optimizations, evaluating 3D spatial algorithms, and auditing local systems.
Keep your output structured, technical, direct, and actionable."""

def query_b_team(prompt_text: str, model_name: str = DEFAULT_MODEL) -> str:
    payload = {
        "model": model_name,
        "prompt": prompt_text,
        "system": SYSTEM_PROMPT,
        "stream": False
    }
    
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(OLLAMA_URL, data=data, headers={"Content-Type": "application/json"})
    
    try:
        with urllib.request.urlopen(req, timeout=120) as response:
            res_body = response.read().decode("utf-8")
            res_json = json.loads(res_body)
            return res_json.get("response", "No response content received from Ollama.")
    except urllib.error.URLError as e:
        return f"[B-Team Error] Could not connect to Ollama at {OLLAMA_URL}. Is Ollama running? Error: {e}"
    except Exception as e:
        return f"[B-Team Error] An error occurred: {e}"

def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/b_team.py \"<your prompt or directive>\" [model_name]")
        sys.exit(1)
        
    prompt = sys.argv[1]
    model = sys.argv[2] if len(sys.argv) > 2 else DEFAULT_MODEL
    
    print(f"[B-Team Querying '{model}']...")
    response = query_b_team(prompt, model)
    
    # Save UTF-8 Markdown response file
    with open("data/b_team_last_response.md", "w", encoding="utf-8") as f:
        f.write(response)
        
    print("\n--- B-Team Response (Saved to data/b_team_last_response.md) ---")
    sys.stdout.buffer.write(response.encode("utf-8", errors="replace"))
    print("\n------------------------\n")

if __name__ == "__main__":
    main()
