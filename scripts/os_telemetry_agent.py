import time
import urllib.request
import json
import psutil

SWARM_SERVER_URL = "http://localhost:3000/telemetry"

def get_system_metrics():
    try:
        cpu_percent = psutil.cpu_percent(interval=1)
        mem = psutil.virtual_memory()
        mem_percent = mem.percent
        process_count = len(psutil.pids())

        return {
            "system": {
                "cpu": cpu_percent,
                "ram": mem_percent,
                "processCount": process_count,
                "status": "online"
            }
        }
    except Exception as e:
        print(f"[OS Telemetry] Error gathering metrics: {e}")
        return None

def push_telemetry(payload):
    try:
        data = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(
            SWARM_SERVER_URL,
            data=data,
            headers={'Content-Type': 'application/json'}
        )
        with urllib.request.urlopen(req, timeout=3) as res:
            if res.status == 200:
                print(f"[OS Telemetry] Sent metrics: CPU {payload['system']['cpu']}% | RAM {payload['system']['ram']}%")
    except Exception as e:
        print(f"[OS Telemetry] Failed to push telemetry to {SWARM_SERVER_URL}: {e}")

def main():
    print("[OS Telemetry Agent] Starting background telemetry loop...")
    while True:
        metrics = get_system_metrics()
        if metrics:
            push_telemetry(metrics)
        time.sleep(4)

if __name__ == "__main__":
    main()
