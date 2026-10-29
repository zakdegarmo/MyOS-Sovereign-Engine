import urllib.request
import json
import sys

payload = {
    "model": "myos-cortex:latest",
    "prompt": "You are the local GPU Cortex of MyOS. What is tactical fix #3 to complete your top 3 fixes for transforming MyOS into a focused daily driver? Give just tactic #3 and a 1-sentence closing conviction.",
    "stream": False,
    "options": {
        "temperature": 0.2,
        "num_predict": 400
    }
}

req = urllib.request.Request(
    "http://localhost:11434/api/generate",
    data=json.dumps(payload).encode("utf-8"),
    headers={"Content-Type": "application/json"}
)

try:
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        with open("data/ux_autopsy/cortex_fix_3.txt", "w", encoding="utf-8") as f:
            f.write(data.get("response", ""))
        print("FIX_3_SAVED")
except Exception as e:
    print(f"Error: {e}")
