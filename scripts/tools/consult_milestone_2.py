import os
import sys
import json
import urllib.request

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL = "myos-cortex:latest"

prompt = """You are MyOS-Cortex on the local RTX GPU.
Milestone 1 is complete:
- We successfully built and verified the Diegetic Agent Swarm Manager Core (AgentSwarmManager.ts & DiegeticSwarmManagerFacet.tsx) under Unity (Pillar 4), verified live in headless Chrome, and committed to git (c46ca96c1).

Now select Milestone 2:
Option A: Three.js Dynamic Rigid-Body Physics using cannon-es (interactive physics props in AvatarScene that collide with the floor and avatar)
Option C: Procedural Audio Chimes for each of the 10 Pillars using Web Audio synthesis (harmonic frequency tuning)
Option D: Live AST Validator integration into the Left Editor Prism (pre-flight AST checks using pyparsing)

Respond with ONLY valid JSON:
{
  "selected_option": "Option A, C, or D",
  "objective_name": "Short title",
  "rationale": "Why this is the next logical step",
  "technical_spec": "Step-by-step implementation instructions"
}
"""

payload = {
    "model": MODEL,
    "prompt": prompt,
    "stream": False,
    "format": "json"
}

req = urllib.request.Request(
    OLLAMA_URL,
    data=json.dumps(payload).encode("utf-8"),
    headers={"Content-Type": "application/json"}
)

try:
    with urllib.request.urlopen(req, timeout=90) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        res = json.loads(data.get("response", "{}"))
        print(json.dumps(res, indent=2))
        with open("data/active_milestone_2.json", "w", encoding="utf-8") as f:
            json.dump(res, f, indent=2)
except Exception as e:
    print(f"Error: {e}")
