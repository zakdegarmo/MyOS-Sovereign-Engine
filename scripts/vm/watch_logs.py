import os
import time

print("Watching for USB drive to return with flight recorder logs...")
while True:
    if os.path.exists("H:/prismos_flight_recorder.log"):
        print("FOUND FLIGHT RECORDER LOGS!")
        break
    time.sleep(1)

with open("H:/prismos_flight_recorder.log", "r", errors="ignore") as f:
    print("\n=== FLIGHT RECORDER SNIPPET ===")
    lines = f.readlines()
    for l in lines[:40]:
        print(l.rstrip())

if os.path.exists("H:/chromium.log"):
    print("\n=== CHROMIUM LOG SNIPPET ===")
    with open("H:/chromium.log", "r", errors="ignore") as f:
        clines = f.readlines()
        for l in clines[:30]:
            print(l.rstrip())
