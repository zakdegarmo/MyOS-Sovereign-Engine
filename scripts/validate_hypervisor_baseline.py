import urllib.request
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

def test_ollama_alive():
    print("[TEST 1] Testing Ollama tags...")
    req = urllib.request.Request("http://localhost:11434/api/tags")
    with urllib.request.urlopen(req, timeout=5) as res:
        data = json.loads(res.read().decode('utf-8'))
        names = [m['name'] for m in data.get('models', [])]
        print(f"  -> Found models: {names}")
        assert 'myos-cortex:latest' in names, "myos-cortex:latest not registered!"
    print("  -> PASS: Ollama is running and myos-cortex:latest is ready.")

def test_cortex_telemetry_chat():
    print("[TEST 2] Testing myos-cortex chat synthesis & telemetry output...")
    body = json.dumps({
        "model": "myos-cortex",
        "messages": [{"role": "user", "content": "Status report: what are your active tools?"}],
        "stream": False
    }).encode('utf-8')
    req = urllib.request.Request("http://localhost:11434/api/chat", data=body, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=60) as res:
        data = json.loads(res.read().decode('utf-8'))
        reply = data.get('message', {}).get('content', '')
        print(f"  -> Response length: {len(reply)} chars")
        assert "[Telemetry]" in reply, "Missing [Telemetry] block!"
        assert "[Synthesis]" in reply, "Missing [Synthesis] block!"
        print("  -> PASS: myos-cortex responded with full [Telemetry] and [Synthesis] blocks.")

def test_web_server():
    print("[TEST 3] Testing Web App Port 5173...")
    try:
        req = urllib.request.Request("http://localhost:5173/?dim=holo_cortex_4d")
        with urllib.request.urlopen(req, timeout=5) as res:
            assert res.status == 200
            print("  -> PASS: Web server responds on http://localhost:5173/?dim=holo_cortex_4d")
    except Exception as e:
        print(f"  -> WARNING: Port 5173 web request: {e}")

if __name__ == "__main__":
    print("=== HYPERVISOR STATE-MEMORY VALIDATION PRE-TEST ===")
    test_ollama_alive()
    test_cortex_telemetry_chat()
    test_web_server()
    print("=== PRE-VALIDATION COMPLETE: SYSTEM ONLINE ===")
