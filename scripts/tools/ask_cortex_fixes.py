import urllib.request
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

payload = {
    "model": "myos-cortex:latest",
    "prompt": "You are the local GPU Cortex of MyOS. Give Zak the Top 3 Concrete Tactical Fixes to transform MyOS from an oversaturated tech demo into a focused, razor-sharp daily driver OS that prioritizes FUNCTION over cognitive noise. Be direct, punchy, and architectural.",
    "stream": False,
    "options": {
        "temperature": 0.3,
        "num_predict": 1200
    }
}

req = urllib.request.Request(
    "http://localhost:11434/api/generate",
    data=json.dumps(payload).encode("utf-8"),
    headers={"Content-Type": "application/json"}
)

try:
    with urllib.request.urlopen(req, timeout=60) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        with open("data/ux_autopsy/cortex_fixes.md", "w", encoding="utf-8") as f:
            f.write(data.get("response", ""))
        print("SUCCESS_SAVED_TO_FILE")
except Exception as e:
    print(f"Error: {e}")
