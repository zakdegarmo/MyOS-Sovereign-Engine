#!/usr/bin/env python3
"""
MyNet Zero-Click LAN Auto-Discovery Beacon (UDP Broadcast)
Part of the Symbiorithm Network Protocols suite.

Enables zero-configuration peer discovery across the local subnet/WiFi.
Periodically pulses signed UDP beacons and listens for neighboring MyNet nodes.
When a verified beacon is detected, automatically triggers WebSocket peer connections.
"""

import sys
import json
import time
import socket
import asyncio
import argparse
from pathlib import Path
from datetime import datetime, timezone
from typing import Callable, Optional, Dict

sys.path.insert(0, str(Path(__file__).resolve().parent))
from mynet_identity import NodeIdentity, DEFAULT_KEY_FILE

BEACON_PORT = 9099
BROADCAST_ADDR = "255.255.255.255"


class MeshBeacon:
    """Handles UDP broadcast discovery and reciprocal peer detection."""

    def __init__(self, identity: NodeIdentity, ws_port: int = 9090, beacon_port: int = BEACON_PORT):
        self.identity = identity
        self.ws_port = ws_port
        self.beacon_port = beacon_port
        self.discovered_peers: Dict[str, dict] = {}  # did -> peer info
        self.running = False
        self.on_peer_discovered: Optional[Callable[[str, int, str], None]] = None

    def create_beacon_payload(self) -> bytes:
        """Create a cryptographically signed beacon packet."""
        record = {
            "$type": "myos.mynet.beacon",
            "author_did": self.identity.did,
            "handle": self.identity.handle,
            "ws_port": self.ws_port,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        signed_record = self.identity.sign_json(record)
        return json.dumps(signed_record).encode("utf-8")

    async def broadcast_loop(self, interval: float = 3.0):
        """Broadcast discovery beacons periodically."""
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
        sock.setblocking(False)

        loop = asyncio.get_event_loop()
        print(f"[Beacon] Broadcasting on UDP port {self.beacon_port} every {interval}s...")

        try:
            while self.running:
                payload = self.create_beacon_payload()
                await loop.sock_sendto(sock, payload, (BROADCAST_ADDR, self.beacon_port))
                await asyncio.sleep(interval)
        except asyncio.CancelledError:
            pass
        finally:
            sock.close()

    async def listen_loop(self):
        """Listen for UDP discovery beacons from neighboring nodes."""
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        try:
            sock.bind(("", self.beacon_port))
        except Exception as e:
            print(f"[!] Could not bind UDP listener to port {self.beacon_port}: {e}")
            sock.close()
            return

        sock.setblocking(False)
        loop = asyncio.get_event_loop()
        print(f"[Beacon] Listening for subnet beacons on UDP port {self.beacon_port}...")

        try:
            while self.running:
                data, addr = await loop.sock_recvfrom(sock, 2048)
                peer_ip = addr[0]
                try:
                    record = json.loads(data.decode("utf-8"))
                    peer_did = record.get("author_did")
                    ws_port = record.get("ws_port", 9090)
                    handle = record.get("handle", "peer.mynet.local")

                    # Ignore our own beacon
                    if peer_did == self.identity.did:
                        continue

                    # Cryptographically verify beacon signature
                    if NodeIdentity.verify_json(record):
                        if peer_did not in self.discovered_peers:
                            self.discovered_peers[peer_did] = {
                                "ip": peer_ip,
                                "ws_port": ws_port,
                                "handle": handle,
                                "did": peer_did,
                                "last_seen": time.time()
                            }
                            print(f"\n[+] ZERO-CLICK DISCOVERY: Found Peer '{handle}' on LAN!")
                            print(f"    IP:         {peer_ip}:{ws_port}")
                            print(f"    DID:        {peer_did}")
                            print(f"    Target WS:  ws://{peer_ip}:{ws_port}\n")

                            if self.on_peer_discovered:
                                self.on_peer_discovered(peer_ip, ws_port, peer_did)
                        else:
                            self.discovered_peers[peer_did]["last_seen"] = time.time()
                    else:
                        print(f"[!] Discarded unverified/forged beacon from {peer_ip}")
                except Exception:
                    pass
        except asyncio.CancelledError:
            pass
        finally:
            sock.close()

    async def start(self, duration: Optional[float] = None):
        """Start both listening and broadcasting concurrently."""
        self.running = True
        b_task = asyncio.create_task(self.broadcast_loop())
        l_task = asyncio.create_task(self.listen_loop())

        if duration:
            await asyncio.sleep(duration)
            self.running = False
            b_task.cancel()
            l_task.cancel()
            await asyncio.gather(b_task, l_task, return_exceptions=True)
        else:
            await asyncio.gather(b_task, l_task)


def main():
    parser = argparse.ArgumentParser(description="MyNet LAN Zero-Click Beacon")
    parser.add_argument("--ws-port", type=int, default=9090, help="Local WebSocket port to advertise")
    parser.add_argument("--beacon-port", type=int, default=BEACON_PORT, help="UDP beacon port (default: 9099)")
    parser.add_argument("--vault", default=str(DEFAULT_KEY_FILE), help="Path to identity vault JSON")
    parser.add_argument("--duration", type=float, default=None, help="Run duration in seconds")

    args = parser.parse_args()
    identity = NodeIdentity.load_or_create(Path(args.vault))
    beacon = MeshBeacon(identity, ws_port=args.ws_port, beacon_port=args.beacon_port)

    print(f"\n==================================================")
    print(f"  MYNET ZERO-CLICK SUBNET BEACON")
    print(f"==================================================")
    print(f"  Handle:       {identity.handle}")
    print(f"  DID:          {identity.did}")
    print(f"  WS Port:      {args.ws_port}")
    print(f"  Beacon Port:  {args.beacon_port}")
    print(f"==================================================\n")

    try:
        asyncio.run(beacon.start(duration=args.duration))
    except KeyboardInterrupt:
        print("[Beacon] Stopped.")


if __name__ == "__main__":
    main()
