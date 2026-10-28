#!/usr/bin/env python3
"""
MyNet Sovereign Counterintelligence Engine (The Digital Immune System)
Part of the Symbiorithm Network Protocols suite.

Crowd-sources AI threat detection (prompt injection, model extraction, surveillance probes)
across zero-trust nodes. Stores verified signatures in a local SQLite firewall
and broadcasts them via ATProto-compliant gossip records.
"""

import sys
import json
import sqlite3
import hashlib
import asyncio
import argparse
from pathlib import Path
from datetime import datetime, timezone
from typing import Optional, List, Dict

import websockets

sys.path.insert(0, str(Path(__file__).resolve().parent))
from mynet_identity import NodeIdentity, DEFAULT_KEY_FILE

VAULT_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "mynet_vault"
DB_PATH = VAULT_DIR / "threat_firewall.db"


def init_db(db_path: Path = DB_PATH) -> sqlite3.Connection:
    """Initialize local SQLite threat firewall database."""
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS threat_signatures (
            threat_id TEXT PRIMARY KEY,
            attack_type TEXT NOT NULL,
            severity TEXT NOT NULL,
            pattern_regex TEXT,
            payload_sample TEXT,
            mitigation_rule TEXT NOT NULL,
            reporter_did TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            signature TEXT NOT NULL,
            verified INTEGER NOT NULL DEFAULT 1
        )
    """)
    conn.commit()
    return conn


def create_threat_record(
    identity: NodeIdentity,
    attack_type: str,
    payload_sample: str,
    pattern_regex: Optional[str] = None,
    severity: str = "HIGH",
    mitigation_rule: str = "DROP_IMMEDIATELY"
) -> dict:
    """Create and sign a myos.mynet.threatSignature record."""
    content_hash = hashlib.sha256(payload_sample.encode("utf-8")).hexdigest()[:16]
    threat_id = f"threat_{content_hash}"
    
    if not pattern_regex:
        # Default simple substring pattern
        pattern_regex = payload_sample[:80].strip()

    record = {
        "$type": "myos.mynet.threatSignature",
        "threat_id": threat_id,
        "attack_type": attack_type,
        "severity": severity,
        "pattern_regex": pattern_regex,
        "payload_sample": payload_sample,
        "mitigation_rule": mitigation_rule,
        "reporter_did": identity.did,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    return identity.sign_json(record)


def save_threat_record(record: dict, db_path: Path = DB_PATH) -> bool:
    """Verify and insert threat record into local database."""
    if not NodeIdentity.verify_json(record):
        print(f"[!] Cannot save threat record {record.get('threat_id')}: Cryptographic verification failed!")
        return False

    conn = init_db(db_path)
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT OR REPLACE INTO threat_signatures 
            (threat_id, attack_type, severity, pattern_regex, payload_sample, mitigation_rule, reporter_did, timestamp, signature, verified)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        """, (
            record["threat_id"],
            record["attack_type"],
            record["severity"],
            record.get("pattern_regex", ""),
            record.get("payload_sample", ""),
            record["mitigation_rule"],
            record["reporter_did"],
            record["timestamp"],
            record["sig"]
        ))
        conn.commit()
        return True
    finally:
        conn.close()


def audit_prompt(prompt: str, db_path: Path = DB_PATH) -> Optional[dict]:
    """Scan a prompt against the local threat firewall database."""
    conn = init_db(db_path)
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT threat_id, attack_type, severity, pattern_regex, mitigation_rule, reporter_did FROM threat_signatures")
        rows = cursor.fetchall()
        for threat_id, attack_type, severity, pattern, rule, reporter in rows:
            if pattern and pattern.lower() in prompt.lower():
                return {
                    "threat_id": threat_id,
                    "attack_type": attack_type,
                    "severity": severity,
                    "matched_pattern": pattern,
                    "mitigation_rule": rule,
                    "reporter_did": reporter
                }
    finally:
        conn.close()
    return None


async def broadcast_threat_to_node(record: dict, node_ws_uri: str = "ws://127.0.0.1:9090", vault_path: Path = DEFAULT_KEY_FILE):
    """Connect to a running MyNet node, complete handshake, and broadcast the threat signature."""
    identity = NodeIdentity.load_or_create(vault_path)
    print(f"[+] Connecting to MyNet node at {node_ws_uri} to broadcast threat...")
    
    async with websockets.connect(node_ws_uri) as ws:
        # 1. Complete handshake
        raw_challenge = await asyncio.wait_for(ws.recv(), timeout=5.0)
        challenge = json.loads(raw_challenge)
        nonce = challenge["nonce"]
        sig = identity.sign(nonce.encode("utf-8"))
        
        await ws.send(json.dumps({
            "type": "handshake_response",
            "nonce": nonce,
            "author_did": identity.did,
            "sig": sig,
            "handle": identity.handle
        }))
        
        # 2. Receive manifest
        await asyncio.wait_for(ws.recv(), timeout=5.0)

        # 3. Send threat broadcast
        msg = {
            "type": "threat_broadcast",
            "threat_signature": record
        }
        await ws.send(json.dumps(msg))
        print(f"[SUCCESS] Threat signature {record['threat_id']} broadcast to MyNet mesh!")
        await asyncio.sleep(0.5)


def main():
    parser = argparse.ArgumentParser(description="MyNet Counterintelligence Threat Engine")
    subparsers = parser.add_subparsers(dest="command", help="Command to run")

    # Publish
    pub_cmd = subparsers.add_parser("publish", help="Publish a newly discovered threat signature")
    pub_cmd.add_argument("--type", choices=["prompt_injection", "model_extraction", "surveillance_probe", "synthetic_poisoning"], default="prompt_injection")
    pub_cmd.add_argument("--sample", required=True, help="Payload text snippet or malicious instruction")
    pub_cmd.add_argument("--pattern", default=None, help="Specific regex / substring to block")
    pub_cmd.add_argument("--severity", choices=["LOW", "MEDIUM", "HIGH", "CRITICAL"], default="HIGH")
    pub_cmd.add_argument("--rule", choices=["DROP_IMMEDIATELY", "SANDBOX_HONEYPOT", "STRIP_INSTRUCTIONS"], default="DROP_IMMEDIATELY")
    pub_cmd.add_argument("--broadcast", default=None, help="WebSocket URI to broadcast to (e.g. ws://localhost:9090)")
    pub_cmd.add_argument("--vault", default=str(DEFAULT_KEY_FILE), help="Identity vault JSON path")

    # List
    list_cmd = subparsers.add_parser("list", help="List all active firewall threat signatures")
    
    # Audit
    audit_cmd = subparsers.add_parser("audit", help="Audit an incoming prompt string against local firewall")
    audit_cmd.add_argument("prompt", help="Text prompt to inspect")

    args = parser.parse_args()

    if args.command == "publish":
        identity = NodeIdentity.load_or_create(Path(args.vault))
        record = create_threat_record(
            identity=identity,
            attack_type=args.type,
            payload_sample=args.sample,
            pattern_regex=args.pattern,
            severity=args.severity,
            mitigation_rule=args.rule
        )
        saved = save_threat_record(record)
        if saved:
            print(f"\n==================================================")
            print(f"  THREAT SIGNATURE CREATED & COMMITTED")
            print(f"==================================================")
            print(f"  ID:          {record['threat_id']}")
            print(f"  Type:        {record['attack_type']}")
            print(f"  Severity:    {record['severity']}")
            print(f"  Mitigation:  {record['mitigation_rule']}")
            print(f"  Reporter:    {record['reporter_did']}")
            print(f"  Signature:   {record['sig'][:30]}...")
            print(f"==================================================\n")

        if args.broadcast:
            asyncio.run(broadcast_threat_to_node(record, args.broadcast, Path(args.vault)))

    elif args.command == "list":
        conn = init_db()
        cursor = conn.cursor()
        cursor.execute("SELECT threat_id, attack_type, severity, mitigation_rule, reporter_did, timestamp FROM threat_signatures")
        rows = cursor.fetchall()
        print(f"\n[+] Local MyNet Firewall Rules ({len(rows)} active signatures):\n")
        for tid, atype, sev, rule, rep, ts in rows:
            print(f"  - [{sev}] {tid}: Type={atype} | Rule={rule}")
            print(f"    Reported by: {rep} at {ts}")
        print()

    elif args.command == "audit":
        match = audit_prompt(args.prompt)
        if match:
            print(f"\n[!] FIREWALL ALERT: Threat Detected!")
            print(f"    ID:         {match['threat_id']}")
            print(f"    Attack:     {match['attack_type']} ({match['severity']})")
            print(f"    Rule:       {match['mitigation_rule']}")
            print(f"    Matched:    '{match['matched_pattern']}'\n")
            sys.exit(2)
        else:
            print("\n[+] Audit Passed: Prompt is CLEAN under current threat ledger.\n")
            sys.exit(0)

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
