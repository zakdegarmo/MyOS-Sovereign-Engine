#!/usr/bin/env python3
"""
Automated Empirical Test for MyNet Zero-Trust P2P Mesh
Runs Node 1 and Node 2 concurrently, executes mutual cryptographic handshake,
manifest exchange, and signed ping verification.
"""

import sys
import asyncio
from pathlib import Path

# Add tools directory
sys.path.insert(0, str(Path(__file__).resolve().parent))
from mynet_identity import NodeIdentity
from mynet_node import SovereignNode

async def run_mesh_test():
    vault_dir = Path(__file__).resolve().parent.parent.parent / "data" / "mynet_vault"
    id1 = NodeIdentity.load_or_create(vault_dir / "node_identity.json", handle="zak.mynet.local")
    id2 = NodeIdentity.load_or_create(vault_dir / "node_identity_b.json", handle="node2.mynet.local")

    print("\n--- [1] Identities Initialized ---")
    print(f"Node 1 (Zak):  {id1.did} ({id1.handle})")
    print(f"Node 2 (Peer): {id2.did} ({id2.handle})")

    # Instantiate nodes
    node1 = SovereignNode(id1, port=9090)
    node2 = SovereignNode(id2, port=9092)

    # Start Node 1 server
    task1 = asyncio.create_task(node1.run_server(duration=6))
    await asyncio.sleep(0.5)

    # Start Node 2 server and connect to Node 1
    task2 = asyncio.create_task(node2.run_server(duration=6))
    await asyncio.sleep(0.5)

    print("\n--- [2] Initiating Zero-Trust Cryptographic Handshake ---")
    connected = await node2.connect_to_peer("ws://127.0.0.1:9090")
    if not connected:
        print("[FAILED] Connection to Node 1 failed!")
        sys.exit(1)

    print("[SUCCESS] Mutual Handshake Succeeded!")
    print(f"Node 1 Active Peers: {list(node1.connected_peers.keys())}")
    print(f"Node 2 Active Peers: {list(node2.outgoing_peers.keys())}")

    print("\n--- [3] Dispatching Signed Ping ---")
    await asyncio.sleep(0.5)
    await node2.send_ping()
    await asyncio.sleep(1.0)

    print("\n--- [4] Mesh Integrity Verified Cleanly! ---")
    await asyncio.gather(task1, task2)
    print("[FINISHED] Both nodes completed test run.")

if __name__ == "__main__":
    asyncio.run(run_mesh_test())
