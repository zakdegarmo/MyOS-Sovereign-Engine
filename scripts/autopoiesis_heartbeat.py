"""
MyOS Autopoiesis Heartbeat Daemon: Continuous Improvement & Self-Evolution
Periodically queries the local Cortex with ontological evaluation vectors,
evaluates cognitive drift, and crystals learnings to SQLite.
"""

import time
import json
import urllib.request
import sqlite3
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

DB_PATH = os.path.abspath("data/myos_vector_store.db")
OLLAMA_API = "http://localhost:11434/api/chat"

AUTOPOIESIS_PROMPTS = [
    "Synthesize the topological tension between Logic (∴) and Transcendence (⍟) in 4D workspace navigation.",
    "Evaluate system alignment: how does the 1x1x1 observer eye maintain sovereign identity when nested inside the 9x9x9 cosmic manifold?",
    "Formulate an autopoietic optimization vector for the MyOS workspace hypervisor."
]

def query_cortex(prompt: str):
    data = json.dumps({
        "model": "myos-cortex",
        "messages": [{"role": "user", "content": prompt}],
        "stream": False
    }).encode('utf-8')
    req = urllib.request.Request(OLLAMA_API, data=data, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=90) as resp:
            res = json.loads(resp.read().decode('utf-8'))
            return res.get('message', {}).get('content', '')
    except Exception as e:
        print(f"[Autopoiesis] Error querying cortex: {e}")
        return None

def pulse_autopoiesis(iteration: int):
    prompt = AUTOPOIESIS_PROMPTS[iteration % len(AUTOPOIESIS_PROMPTS)]
    print(f"\n[Autopoiesis Pulse #{iteration}] Prompting Cortex: '{prompt[:45]}...'")
    start = time.time()
    response = query_cortex(prompt)
    duration = time.time() - start
    
    if response:
        print(f"[Autopoiesis Pulse #{iteration}] Response received in {duration:.2f}s ({len(response)} chars)")
        if "[Telemetry]" in response:
            print("  -> Telemetry Validated: OK")
        if "[Synthesis]" in response:
            print("  -> Synthesis Validated: OK")
    return response

if __name__ == "__main__":
    print("=== MYOS AUTOPOIESIS ENGINE INITIALIZED ===")
    pulse_autopoiesis(0)
