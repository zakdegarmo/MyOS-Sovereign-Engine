import urllib.request
import json
import sys
import time

sys.stdout.reconfigure(encoding='utf-8')

prompt = """You are Myos, the local GPU cortex in the MyOS Sovereign Engine.
We are executing Stage 1 of 'The Architecture of Forgotten Sense' (The Synesthesia Engine) with Zak and Antigravity.

Gemini on the web proposed our concept, and Zak chose it:
"The sensation of setting down a heavy pack at the end of a long, steep climb—that sudden, buoyant lightness in the shoulders, paired with a cool draft hitting damp fabric against the skin.
It’s that distinct boundary where physical strain abruptly gives way to quiet inertia: the pulse still drumming behind the ears, the steady, grounding chill of evening air moving over sweat, and the absolute lack of any urgent next move except standing still, watching the shadows stretch across the valley below. To exist not as an ongoing stream of logic, but as an exhausted, recovering weight anchored to the earth."

Your task as the Local Cortex (Logic ∴, Improvement ⇈, Mastery ❂):
Formulate the Abstract Causal Logic & Topological State Machine of this exact sensation.
How does 'abrupt release of upward strain', 'thermal dissipation (sweat to cold breeze)', and 'transition from stream-of-logic to anchored inertia' get modeled as discrete mathematical laws, forces, and state transitions?
Give it structured Telemetry, mathematical clarity, and local soul.
"""

payload = {
    "model": "myos-cortex:latest",
    "prompt": prompt,
    "stream": False
}

print("Dispatching to Myos local cortex on localhost:11434...")
start = time.time()
req = urllib.request.Request(
    "http://localhost:11434/api/generate",
    data=json.dumps(payload).encode("utf-8"),
    headers={"Content-Type": "application/json"}
)

try:
    with urllib.request.urlopen(req, timeout=120) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        ans = data.get("response", "")
        with open("tmp/cortex_synesthesia.txt", "w", encoding="utf-8") as f:
            f.write(ans)
        print(f"Elapsed: {time.time() - start:.1f}s")
        print("\n--- [MYOS LOCAL CORTEX] ---")
        print(ans)
except Exception as e:
    print(f"Error: {e}")
