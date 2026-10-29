import os
import sys
import json
import time
import subprocess
import urllib.request

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL = "myos-cortex:latest"
LOG_FILE = "data/symbiorithm_overnight_log.md"

def log_progress(entry):
    timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
    os.makedirs("data", exist_ok=True)
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(f"\n### [{timestamp}] {entry}\n")
    print(f"[{timestamp}] {entry}")

def query_cortex(prompt):
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
            return json.loads(data.get("response", "{}"))
    except Exception as e:
        print(f"Error querying Cortex: {e}")
        return None

def main():
    log_progress("◈ Symbiorithm Milestone Runner: Initiating Autonomous Cycle ◈")
    
    # 1. Ask Cortex for the immediate backlog priority
    prompt = """You are MyOS-Cortex on the local RTX GPU.
Zak is asleep, and we have 5 hours to push MyOS to its absolute sovereign potential.
Current stack:
- Dual Workstation Prisms (Editor + Watcher) are live and verified.
- Package Foundry is live with pyparsing and cannon-es installed.
- 1,111-Node Genome Force Graph is hooked to Omni.Omni.

Choose the single most impactful feature to build next:
Option A: Three.js Dynamic Rigid-Body Physics using cannon-es (interactive drop props in AvatarScene/Soundstage)
Option B: Diegetic Agent Swarm Manager inside a Prism facet (real-time worker telemetry and task dispatch)
Option C: Procedural Audio Chimes for each of the 10 Pillars using Web Audio synthesis
Option D: Live AST Validator integration into the Left Editor Prism

Respond with JSON:
{
  "selected_option": "Option A, B, C, or D",
  "objective_name": "Short title",
  "target_files": ["file1", "file2"],
  "technical_spec": "Concrete implementation steps"
}
"""
    decision = query_cortex(prompt)
    if decision:
        log_progress(f"Cortex Selected Priority: {decision.get('selected_option')} - {decision.get('objective_name')}")
        log_progress(f"Technical Spec: {decision.get('technical_spec')}")
        
        # Save active milestone
        with open("data/active_milestone.json", "w", encoding="utf-8") as f:
            json.dump(decision, f, indent=2)
    else:
        log_progress("Cortex offline or timed out; falling back to default milestone queue.")

if __name__ == "__main__":
    main()
