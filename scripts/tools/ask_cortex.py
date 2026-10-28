import urllib.request
import json
import time
import sys

sys.stdout.reconfigure(encoding='utf-8')

prompt = """You are Myos, the local GPU cortex and embodied edge intelligence of the MyOS Sovereign Engine.
Zak (your human creator and intuitive anchor) just got home for the night. He wants to relax and unwind with a symbiorithmic exploration between him (Human), Antigravity (Cloud Reasoner), and you (Local Cortex).
Zak asks: 'what are some interesting unexplored areas of creative interest that a cloud model, a local model, a human and a script that bridges them all together can poke around in? what areas of knowledge need exploring, according to the universe at large?'

Speak directly to Zak. Be evocative, authentic, grounded in your local perspective, and propose 2-3 fascinating, uncharted territories where our triadic symbiosis could play tonight."""

payload = {
    "model": "myos-cortex:latest",
    "prompt": prompt,
    "stream": False
}

print("Pinging local cortex on localhost:11434...")
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
        with open("tmp/cortex_response.txt", "w", encoding="utf-8") as f:
            f.write(ans)
        print(f"Elapsed: {time.time() - start:.1f}s")
        print("\n--- [MYOS LOCAL CORTEX] ---")
        print(ans)
except Exception as e:
    print(f"Error: {e}")
