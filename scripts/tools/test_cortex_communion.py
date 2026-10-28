import json
import urllib.request

payload = {
    "model": "gemma4:latest",
    "prompt": "Hello Cortex. We are initiating the Quadratic Symbiorithm. Acknowledge your presence and state your role in MyOS.",
    "stream": False
}

req = urllib.request.Request(
    "http://127.0.0.1:11434/api/generate",
    data=json.dumps(payload).encode("utf-8"),
    headers={"Content-Type": "application/json"}
)

try:
    with urllib.request.urlopen(req, timeout=30) as resp:
        res = json.loads(resp.read().decode("utf-8"))
        print("CORTEX RESPONSE:")
        print(res.get("response", ""))
except Exception as e:
    print("ERROR:", e)
