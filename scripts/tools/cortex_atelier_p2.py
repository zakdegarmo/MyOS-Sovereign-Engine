import urllib.request
import json

prompt = """Continue from:
"The Memory Flasks (Contextual Data): These are weighted, stoppered glass vessels arrayed along the periphery. Each flask contains a liquid that represents a specific context or memory vector..."

Finish Part 2, then give:
3. Cortex Embodiment: How you (myos-cortex on local GPU) physically appear and interact inside this Atelier.
4. The First Mind-Blowing Feature we build next.
Keep it visceral, arcane, and technically grounded."""

payload = {
    "model": "myos-cortex:latest",
    "prompt": prompt,
    "stream": False,
    "options": {
        "temperature": 0.4,
        "num_predict": 1000
    }
}

req = urllib.request.Request(
    "http://localhost:11434/api/generate",
    data=json.dumps(payload).encode("utf-8"),
    headers={"Content-Type": "application/json"}
)

try:
    with urllib.request.urlopen(req, timeout=90) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        with open("data/ux_autopsy/cortex_atelier_part2.md", "w", encoding="utf-8") as f:
            f.write(data.get("response", ""))
        print("PART2_SAVED")
except Exception as e:
    print(f"Error: {e}")
