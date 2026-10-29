#!/usr/bin/env python3
"""
b_team.py - Local GPU B-Team Assistant
Sends prompts to local Ollama instance (gemma4 / mistral) on localhost:11434
to assist the Antigravity teamwork swarm.
"""

import sys
import json
import requests

OLLAMA_URL = "http://localhost:11434/api/generate"

def ask_b_team(prompt: str, model: str = "gemma4"):
    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False
    }
    try:
        response = requests.post(OLLAMA_URL, json=payload, timeout=60)
        if response.status_code == 200:
            result = response.json()
            return result.get("response", "")
        else:
            return f"B-Team Error HTTP {response.status_code}: {response.text}"
    except Exception as e:
        return f"B-Team Connection Error: {e}"

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python b_team.py \"<prompt>\" [model]")
        sys.exit(1)

    prompt = sys.argv[1]
    model = sys.argv[2] if len(sys.argv) > 2 else "gemma4"
    
    print(f"🤖 B-Team ({model}) analyzing prompt...")
    reply = ask_b_team(prompt, model)
    print("\n--- B-Team Response ---")
    print(reply)
