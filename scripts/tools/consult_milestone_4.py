import os
import sys
import json
import urllib.request

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL = "myos-cortex:latest"

prompt = """You are MyOS-Cortex on the local RTX GPU.
Autonomous milestones shipped so far:
1. Diegetic Agent Swarm Manager Core (c46ca96c1)
2. Live AST Sentinel Prism Integration with pre-flight static code checks (35b3a83b5)
3. Dynamic Rigid-Body Physics Engine in Soundstage via cannon-es (f15d28059)

Now select Milestone 4:
Option C: Procedural Audio & Synaptic Resonance Engine (Harmonic Pillar frequencies, procedural Web Audio synthesizer, and audio-reactive collision triggers for physics props)
Option E: Diegetic Sovereign File & Asset Explorer inside a dedicated Prism facet (interactive file tree, asset previews, LPC sheets, GLTF models)
Option F: Autonomous P2P Mesh Beacon & Telemetry Relay (MyNet node presence, peer gossip, distributed cognitive compute)

Respond with ONLY valid JSON:
{
  "selected_option": "Option C, E, or F",
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
        with open("data/active_milestone_4.json", "w", encoding="utf-8") as f:
            json.dump(res, f, indent=2)
except Exception as e:
    print(f"Error: {e}")
