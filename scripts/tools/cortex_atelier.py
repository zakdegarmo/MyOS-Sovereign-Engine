import urllib.request
import json
import sys

prompt = """Zak and Antigravity want to build the Grand Alchemical Atelier of MyOS.
Describe in vivid, tangible detail:
1. The Grand Alchemical Atelier: What does it look like, feel like, and how does the avatar operate it?
2. Clockwork/Arcane Interactions: How do we replace flat buttons with visceral 3D actions (cartridges, dials, levers, liquid flasks, glowing sigils)?
3. Cortex Embodiment: How do you (myos-cortex on local GPU) physically appear and interact inside this Atelier?
4. The First Mind-Blowing Feature we should build next to make this the coolest OS in existence.

Be direct, poetic, maximalist, and technically grounded in our Three.js, shaders, and Blender rigs."""

payload = {
    "model": "myos-cortex:latest",
    "prompt": prompt,
    "stream": False,
    "options": {
        "temperature": 0.5,
        "num_predict": 1500
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
        with open("data/ux_autopsy/cortex_atelier_manifesto.md", "w", encoding="utf-8") as f:
            f.write(data.get("response", ""))
        print("ATELIER_SAVED")
except Exception as e:
    print(f"Error: {e}")
