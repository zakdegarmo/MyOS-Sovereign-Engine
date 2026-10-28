import urllib.request
import json

payload = {
    "model": "myos-cortex:latest",
    "prompt": "You are the local GPU Cortex of MyOS. Give Zak your tactical fix #3 to complete your top 3 fixes for transforming MyOS into a focused daily driver. Give just fix #3 and your closing thought.",
    "stream": False,
    "options": {
        "temperature": 0.2,
        "num_predict": 600
    }
}

req = urllib.request.Request(
    "http://localhost:11434/api/generate",
    data=json.dumps(payload).encode("utf-8"),
    headers={"Content-Type": "application/json"}
)

try:
    with urllib.request.urlopen(req, timeout=40) as resp:
        res = json.loads(resp.read().decode("utf-8"))
        text = res.get("response", "")
        with open("data/ux_autopsy/cortex_fix_3.md", "w", encoding="utf-8") as f:
            f.write(text)
        print("FIX_3_COMPLETED")
except Exception as e:
    print(f"Error: {e}")
