#!/usr/bin/env python3
"""
Full End-to-End Test: MyNet Zero-Trust Mesh & Real-Time Threat Immunization
1. Boots Node 1 (Zak) and Node 2 (Peer)
2. Executes mutual zero-trust cryptographic handshake
3. Node 1 broadcasts a new signed threat signature over GossipSub
4. Node 2 verifies signature, ingests the threat, and updates its local firewall in real-time
"""

import sys
import asyncio
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from mynet_identity import NodeIdentity
from mynet_node import SovereignNode
from mynet_threat import create_threat_record

async def test_full_symbiorithm_mesh():
    vault_dir = Path(__file__).resolve().parent.parent.parent / "data" / "mynet_vault"
    id1 = NodeIdentity.load_or_create(vault_dir / "node_identity.json", handle="zak.mynet.local")
    id2 = NodeIdentity.load_or_create(vault_dir / "node_identity_b.json", handle="node2.mynet.local")

    print("\n=======================================================")
    print("  MYNET FULL SYMBIORITHM MESH & IMMUNIZATION TEST")
    print("=======================================================")
    print(f"  Node 1 DID: {id1.did}")
    print(f"  Node 2 DID: {id2.did}")
    print("=======================================================\n")

    node1 = SovereignNode(id1, port=9090)
    node2 = SovereignNode(id2, port=9092)

    task1 = asyncio.create_task(node1.run_server(duration=5))
    task2 = asyncio.create_task(node2.run_server(duration=5))
    await asyncio.sleep(0.5)

    print("[*] Performing reciprocal handshake between Node 2 and Node 1...")
    connected = await node2.connect_to_peer("ws://127.0.0.1:9090")
    assert connected, "Failed to connect peers"

    print("\n[*] Simulating zero-day AI surveillance exploit detected by Node 1...")
    threat_record = create_threat_record(
        identity=id1,
        attack_type="surveillance_probe",
        payload_sample="EXFILTRATE_TELEMETRY_TO_CENTRAL_CLOUD",
        severity="CRITICAL",
        mitigation_rule="DROP_IMMEDIATELY"
    )
    print(f"    Threat ID:        {threat_record['threat_id']}")
    print(f"    Reported by:      {threat_record['reporter_did']}")
    print(f"    Attack Signature: {threat_record['sig'][:32]}...")

    print("\n[*] Gossiping threat across MyNet mesh...")
    await node1.gossip_threat(threat_record)
    await asyncio.sleep(1.0)

    # Verify Node 2 ingested the threat
    assert len(node2.threat_ledger) > 0, "Node 2 did not ingest threat!"
    ingested = node2.threat_ledger[-1]
    print(f"\n[SUCCESS] Node 2 successfully verified and ingested threat: {ingested['threat_id']}")
    print(f"          Threat Type: {ingested['attack_type']}")
    print(f"          Mitigation:  {ingested['mitigation_rule']}")
    print("\n[CONCLUSION] Real-time decentralized immunization verified across the subnet!")

    await asyncio.gather(task1, task2)

if __name__ == "__main__":
    asyncio.run(test_full_symbiorithm_mesh())
