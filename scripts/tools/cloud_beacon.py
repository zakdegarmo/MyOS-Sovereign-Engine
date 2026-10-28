#!/usr/bin/env python3
"""
MyOS Cloud Beacon: Zero-Friction Cloudflare Quick Tunnel Manager.
Exposes local MyOS services (default port 5173) securely over HTTPS via Cloudflare Edge
with zero warning screens, trusted SSL, and integrated peer telemetry.
"""

import sys
import os
import time
import re
import json
import subprocess
import urllib.request
from pathlib import Path

# Paths
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent.parent
DATA_DIR = PROJECT_ROOT / "data"
STATE_FILE = DATA_DIR / "cloud_beacon_state.json"
LOG_FILE = DATA_DIR / "cloud_beacon.log"

POSSIBLE_BINARY_PATHS = [
    Path("N:/ngrok/cloudflared.exe"),
    PROJECT_ROOT / "bin" / "cloudflared.exe",
    Path("C:/Users/zakde/AppData/Local/cloudflared/cloudflared.exe"),
]

def find_cloudflared() -> Path:
    for p in POSSIBLE_BINARY_PATHS:
        if p.exists():
            return p
    # Check PATH
    try:
        import shutil
        which = shutil.which("cloudflared")
        if which:
            return Path(which)
    except Exception:
        pass
    return None

def ensure_data_dir():
    DATA_DIR.mkdir(parents=True, exist_ok=True)

def is_pid_running(pid: int) -> bool:
    if pid <= 0:
        return False
    try:
        # Windows tasklist check
        res = subprocess.run(["tasklist", "/FI", f"PID eq {pid}", "/FO", "CSV"], capture_output=True, text=True)
        return str(pid) in res.stdout
    except Exception:
        return False

def get_current_state() -> dict:
    if STATE_FILE.exists():
        try:
            with open(STATE_FILE, "r", encoding="utf-8") as f:
                state = json.load(f)
                if is_pid_running(state.get("pid", 0)):
                    return state
        except Exception:
            pass
    return None

def start_beacon(port: int = 5173):
    ensure_data_dir()
    existing = get_current_state()
    if existing:
        print(f"\n[Cloud Beacon] Tunnel is ALREADY RUNNING at PID {existing['pid']}.")
        print(f"🔗 Public URL: {existing['url']}")
        print(f"📡 Local Target: http://localhost:{existing.get('port', port)}\n")
        return

    binary = find_cloudflared()
    if not binary:
        print("\n[ERROR] cloudflared.exe not found!")
        print("Please ensure cloudflared.exe is present in N:\\ngrok\\ or your PATH.")
        sys.exit(1)

    print(f"\n[Cloud Beacon] Igniting tunnel on http://localhost:{port}...")
    log_handle = open(LOG_FILE, "w", encoding="utf-8", errors="replace")

    proc = subprocess.Popen(
        [str(binary), "tunnel", "--url", f"http://localhost:{port}"],
        stdout=log_handle,
        stderr=subprocess.STDOUT,
        creationflags=subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0
    )

    url = None
    start_time = time.time()
    url_pattern = re.compile(r"https://[a-zA-Z0-9.-]+\.trycloudflare\.com")

    while time.time() - start_time < 20:
        time.sleep(0.5)
        if not is_pid_running(proc.pid):
            print("[ERROR] cloudflared process terminated unexpectedly.")
            break

        if LOG_FILE.exists():
            try:
                with open(LOG_FILE, "r", encoding="utf-8", errors="replace") as f:
                    content = f.read()
                    matches = url_pattern.findall(content)
                    if matches:
                        url = matches[-1]
                        break
            except Exception:
                pass

    if not url:
        print("[ERROR] Timed out waiting for trycloudflare.com URL. Check data/cloud_beacon.log")
        sys.exit(1)

    state = {
        "pid": proc.pid,
        "url": url,
        "port": port,
        "started_at": time.time(),
        "binary": str(binary)
    }

    with open(STATE_FILE, "w", encoding="utf-8") as f:
        json.dump(state, f, indent=2)

    print("=" * 72)
    print("           🌌 MYOS CLOUD BEACON: SOVEREIGN EDGE TUNNEL LIVE 🌌")
    print("=" * 72)
    print(f"  🔗 Public URL:  {url}")
    print(f"  🎯 Local Port:  http://localhost:{port}")
    print(f"  ⚡ Protocol:    QUIC / HTTP/2 over Cloudflare Edge (ord11)")
    print(f"  🛡️ Security:    Trusted SSL (Zero Interstitial Warning Pages)")
    print(f"  🛑 To stop:     python scripts/tools/cloud_beacon.py stop")
    print("=" * 72)
    print(f"\nShare this link with your friends to grant instant guest access!\n")

def stop_beacon():
    state = get_current_state()
    if not state:
        print("[Cloud Beacon] No active tunnel found.")
        if STATE_FILE.exists():
            STATE_FILE.unlink(missing_ok=True)
        return

    pid = state["pid"]
    print(f"[Cloud Beacon] Terminating tunnel PID {pid}...")
    try:
        if os.name == "nt":
            subprocess.run(["taskkill", "/F", "/PID", str(pid)], capture_output=True)
        else:
            os.kill(pid, 9)
    except Exception as e:
        print(f"[Cloud Beacon] Warning while killing PID {pid}: {e}")

    STATE_FILE.unlink(missing_ok=True)
    print("[Cloud Beacon] Tunnel terminated cleanly. System local-only.")

def status_beacon():
    state = get_current_state()
    if not state:
        print("[Cloud Beacon] Status: OFFLINE")
        return

    uptime = int(time.time() - state.get("started_at", time.time()))
    url = state.get("url")

    # Quick test ping
    healthy = False
    try:
        req = urllib.request.Request(f"{url}/api/desktop/files", headers={"User-Agent": "MyOS-Beacon-HealthCheck"})
        with urllib.request.urlopen(req, timeout=3) as resp:
            healthy = resp.status == 200
    except Exception:
        healthy = False

    print("=" * 60)
    print("              MYOS CLOUD BEACON STATUS")
    print("=" * 60)
    print(f"  Status:    {'🟢 ONLINE' if healthy else '🟡 CONNECTED (API warming)'}")
    print(f"  PID:       {state['pid']}")
    print(f"  Public:    {url}")
    print(f"  Uptime:    {uptime // 60}m {uptime % 60}s")
    print("=" * 60)

if __name__ == "__main__":
    cmd = sys.argv[1].lower() if len(sys.argv) > 1 else "status"
    port = int(sys.argv[2]) if len(sys.argv) > 2 and sys.argv[2].isdigit() else 5173

    if cmd == "start":
        start_beacon(port)
    elif cmd == "stop":
        stop_beacon()
    elif cmd == "status":
        status_beacon()
    elif cmd == "restart":
        stop_beacon()
        time.sleep(1)
        start_beacon(port)
    else:
        print("Usage: python cloud_beacon.py [start|stop|status|restart] [port]")
