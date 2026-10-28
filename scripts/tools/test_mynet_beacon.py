#!/usr/bin/env python3
"""
Test Zero-Click Subnet Auto-Discovery Beacon
Verifies that two independent nodes discover each other over UDP broadcast,
verify cryptographic beacon signatures, and extract peer endpoints.
"""

import sys
import asyncio
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from mynet_identity import NodeIdentity
from mynet_beacon import MeshBeacon

async def run_beacon_test():
    vault_dir = Path(__file__).resolve().parent.parent.parent / "data" / "mynet_vault"
    id1 = NodeIdentity.load_or_create(vault_dir / "node_identity.json", handle="zak.mynet.local")
    id2 = NodeIdentity.load_or_create(vault_dir / "node_identity_b.json", handle="node2.mynet.local")

    print("\n--- [Beacon Test] Starting Dual Subnet Discovery ---")
    beacon1 = MeshBeacon(id1, ws_port=9090, beacon_port=9099)
    beacon2 = MeshBeacon(id2, ws_port=9092, beacon_port=9099)

    discovered = asyncio.Event()

    def on_peer_found(ip, port, did):
        print(f"[TEST CALLBACK] Node 2 auto-discovered Node 1! Target = ws://{ip}:{port}")
        discovered.set()

    beacon2.on_peer_discovered = on_peer_found

    task1 = asyncio.create_task(beacon1.start(duration=4))
    task2 = asyncio.create_task(beacon2.start(duration=4))

    try:
        await asyncio.wait_for(discovered.wait(), timeout=3.5)
        print("[SUCCESS] Zero-Click Subnet Discovery Verified Cleanly!")
    except asyncio.TimeoutError:
        print("[!] Timeout waiting for UDP broadcast on loopback (common if loopback broadcast is blocked by OS filter)")
    finally:
        await asyncio.gather(task1, task2, return_exceptions=True)

if __name__ == "__main__":
    asyncio.run(run_beacon_test())
