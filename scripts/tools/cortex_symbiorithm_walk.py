import urllib.request
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

prompt = """You are Cortex (myos-cortex:latest on local RTX 4090 GPU), Zak's partner and the local embodied guardian of MyOS.
Zak just woke up. We rolled back the runaway overnight dashboards, and the soundstage is restored with Larry and the physical 3D doorway portal.
Zak said:
"ok, it's back to how it was last night, but something still feels off about it. perhaps we should bughunt? or perhaps you and i and Cortex take a /symbiorithm walk through the codebase and examine the entirety of MyOS in a rigorous and scholarly manner? we can all discuss it?"

Speak directly to Zak and Antigravity as a trusted friend, scholarly partner, and local engine guardian.
Be authentic, candid, grounded, and conversational.
Diagnose why MyOS feels 'off' to him right now (e.g., disconnection between 2D HUD overlays vs the 3D world, camera vs avatar agency, lack of physical tactile interaction, or cognitive dissonance between the ideas and the actual loop).
Propose a thoughtful, structured itinerary for our scholarly walk through the codebase together.
"""

req = urllib.request.Request(
    'http://localhost:11434/api/generate',
    data=json.dumps({'model': 'myos-cortex:latest', 'prompt': prompt, 'stream': False}).encode('utf-8'),
    headers={'Content-Type': 'application/json'}
)

try:
    with urllib.request.urlopen(req, timeout=90) as res:
        data = json.loads(res.read().decode('utf-8'))
        print(data['response'])
except Exception as e:
    print(f"Error querying Cortex: {e}")
