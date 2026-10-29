#!/usr/bin/env python3
"""
MyNet Sovereign P2P Node Daemon (AT Protocol Mesh)
Part of the Symbiorithm Network Protocols suite.

Operates a zero-trust, authenticated WebSocket node for local subnets and LANs.
Handles mutual cryptographic handshakes (did:key / Ed25519), hardware/model profiling via Ollama,
and distributed task dispatch & gossip.
"""

import os
import sys
import json
import time
import uuid
import secrets
import asyncio
import logging
import argparse
from pathlib import Path
from datetime import datetime, timezone
from typing import Dict, Set, Optional

import requests
import websockets

# Ensure parent directory is on path to import mynet_identity
sys.path.insert(0, str(Path(__file__).resolve().parent))
from mynet_identity import NodeIdentity, DEFAULT_KEY_FILE

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(levelname)s] [MyNet] %(message)s",
    datefmt="%H:%M:%S"
)
logger = logging.getLogger("MyNetNode")


def probe_ollama_capabilities(ollama_host: str = "http://localhost:11434") -> list:
    """Probe local Ollama daemon for installed models."""
    try:
        res = requests.get(f"{ollama_host}/api/tags", timeout=1.5)
        if res.status_code == 200:
            data = res.json()
            return [m["name"] for m in data.get("models", [])]
    except Exception:
        pass
    return []


class SovereignNode:
    """A zero-trust P2P node participating in the MyNet mesh."""

    def __init__(self, identity: NodeIdentity, port: int = 9090, ollama_host: str = "http://localhost:11434"):
        self.identity = identity
        self.port = port
        self.ollama_host = ollama_host
        self.connected_peers: Dict[str, websockets.WebSocketServerProtocol] = {}  # did -> websocket
        self.outgoing_peers: Dict[str, websockets.WebSocketClientProtocol] = {}   # did -> websocket
        self.pending_challenges: Dict[str, str] = {}                              # nonce -> ws
        self.threat_ledger: list = []
        self.models = probe_ollama_capabilities(self.ollama_host)

        logger.info(f"Initialized Sovereign Node: {self.identity.handle} ({self.identity.did})")
        logger.info(f"Local Models Available: {self.models if self.models else 'None detected (Ollama offline)'}")

    def get_manifest(self) -> dict:
        """Create a signed nodeManifest record per ATProto custom lexicon."""
        record = {
            "$type": "myos.mynet.nodeManifest",
            "handle": self.identity.handle,
            "port": self.port,
            "models": self.models,
            "status": "online",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        return self.identity.sign_json(record)

    async def handle_connection(self, websocket, path=None):
        """Handle incoming peer connection with zero-trust cryptographic challenge."""
        peer_did: Optional[str] = None
        challenge_nonce = secrets.token_hex(16)
        
        try:
            # 1. Send handshake challenge to newcomer
            challenge_msg = {
                "type": "handshake_challenge",
                "nonce": challenge_nonce,
                "server_did": self.identity.did,
                "server_handle": self.identity.handle
            }
            await websocket.send(json.dumps(challenge_msg))

            # 2. Await signed response
            raw_response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
            data = json.loads(raw_response)

            if data.get("type") != "handshake_response":
                logger.warning("[!] Peer failed protocol handshake structure. Terminating.")
                await websocket.close(1008, "Invalid handshake")
                return

            client_did = data.get("author_did")
            sig = data.get("sig")
            returned_nonce = data.get("nonce")

            if returned_nonce != challenge_nonce:
                logger.warning("[!] Handshake nonce mismatch. Terminating.")
                await websocket.close(1008, "Nonce mismatch")
                return

            # Verify cryptographic signature of the nonce
            if not NodeIdentity.verify(client_did, challenge_nonce.encode("utf-8"), sig):
                logger.error(f"[!] Zero-Trust Failure: Invalid Ed25519 signature from {client_did}!")
                await websocket.close(1008, "Cryptographic verification failed")
                return

            peer_did = client_did
            self.connected_peers[peer_did] = websocket
            logger.info(f"[+] Authenticated Peer Connected: {peer_did} (Mesh Size: {len(self.connected_peers)})")

            # 3. Exchange signed manifests
            my_manifest = self.get_manifest()
            await websocket.send(json.dumps({"type": "manifest_exchange", "manifest": my_manifest}))

            # 4. Main message pump
            async for raw_msg in websocket:
                msg = json.loads(raw_msg)
                await self.process_peer_message(peer_did, msg, websocket)

        except asyncio.TimeoutError:
            logger.warning("[!] Handshake timed out waiting for peer signature.")
        except websockets.exceptions.ConnectionClosed:
            pass
        except Exception as e:
            logger.warning(f"[!] Error with peer: {e}")
        finally:
            if peer_did and peer_did in self.connected_peers:
                del self.connected_peers[peer_did]
                logger.info(f"[-] Peer Disconnected: {peer_did} (Active: {len(self.connected_peers)})")

    async def connect_to_peer(self, peer_uri: str) -> bool:
        """Connect to an external peer node and complete reciprocal zero-trust handshake."""
        logger.info(f"Initiating connection to peer: {peer_uri}")
        try:
            ws = await websockets.connect(peer_uri)
            # 1. Receive challenge
            raw_challenge = await asyncio.wait_for(ws.recv(), timeout=5.0)
            challenge_data = json.loads(raw_challenge)
            
            if challenge_data.get("type") != "handshake_challenge":
                logger.error("[!] Remote peer did not issue handshake challenge.")
                await ws.close()
                return False

            nonce = challenge_data["nonce"]
            server_did = challenge_data.get("server_did")

            # 2. Sign nonce and respond
            sig = self.identity.sign(nonce.encode("utf-8"))
            response_msg = {
                "type": "handshake_response",
                "nonce": nonce,
                "author_did": self.identity.did,
                "sig": sig,
                "handle": self.identity.handle
            }
            await ws.send(json.dumps(response_msg))

            # 3. Receive remote manifest
            raw_manifest = await asyncio.wait_for(ws.recv(), timeout=5.0)
            manifest_pkg = json.loads(raw_manifest)
            remote_manifest = manifest_pkg.get("manifest", {})
            
            # Verify remote manifest signature
            if NodeIdentity.verify_json(remote_manifest):
                logger.info(f"[+] Verified Remote Peer: {remote_manifest.get('handle')} ({remote_manifest.get('author_did')})")
                logger.info(f"    Available Remote Models: {remote_manifest.get('models', [])}")
            else:
                logger.warning(f"[!] Warning: Remote peer manifest signature could not be verified.")

            self.outgoing_peers[server_did] = ws
            asyncio.create_task(self.listen_outgoing(server_did, ws))
            return True

        except Exception as e:
            logger.error(f"[!] Failed to connect to peer {peer_uri}: {e}")
            return False

    async def listen_outgoing(self, peer_did: str, ws):
        """Listen on an outgoing connection socket."""
        try:
            async for raw_msg in ws:
                msg = json.loads(raw_msg)
                await self.process_peer_message(peer_did, msg, ws)
        except Exception:
            pass
        finally:
            if peer_did in self.outgoing_peers:
                del self.outgoing_peers[peer_did]
                logger.info(f"[-] Outgoing peer connection closed: {peer_did}")

    async def process_peer_message(self, peer_did: str, msg: dict, ws):
        """Process an authenticated message from a peer."""
        msg_type = msg.get("type")

        if msg_type == "ping":
            pong_record = {
                "type": "pong",
                "reply_to": msg.get("ping_id"),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
            signed_pong = self.identity.sign_json(pong_record)
            await ws.send(json.dumps(signed_pong))

        elif msg_type == "pong":
            if NodeIdentity.verify_json(msg):
                logger.info(f"[PONG] Verified pong response from {peer_did}")

        elif msg_type == "threat_broadcast":
            record = msg.get("threat_signature", {})
            if NodeIdentity.verify_json(record):
                attack_type = record.get("attack_type", "unknown")
                rule = record.get("mitigation_rule", "block")
                reporter = record.get("author_did")
                logger.info(f"[IMMUNIZATION ALERT] Verified threat signature from {reporter}!")
                logger.info(f"    Attack: {attack_type} | Rule: {rule}")
                self.threat_ledger.append(record)
                # Gossip propagation to other connected peers
                await self.gossip_threat(record, exclude_peer=peer_did)
            else:
                logger.warning(f"[!] Threat signature from {peer_did} failed cryptographic verification! Discarded.")

        elif msg_type == "compute_task":
            # A peer is requesting inference
            task = msg.get("task", {})
            prompt = task.get("prompt", "")
            model = task.get("model", "myos-cortex:latest")
            request_id = task.get("request_id")
            logger.info(f"[COMPUTE REQUEST] Peer {peer_did} requested inference on model '{model}'")

            # Route to local Ollama
            response_text = await self.execute_local_inference(model, prompt)
            
            receipt = {
                "$type": "myos.mynet.taskReceipt",
                "request_id": request_id,
                "model_used": model,
                "output": response_text,
                "executor_did": self.identity.did,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
            signed_receipt = self.identity.sign_json(receipt)
            await ws.send(json.dumps({"type": "compute_receipt", "receipt": signed_receipt}))

    async def gossip_threat(self, threat_record: dict, exclude_peer: Optional[str] = None):
        """Gossip a threat signature to all other authenticated peers in the mesh."""
        payload = json.dumps({"type": "threat_broadcast", "threat_signature": threat_record})
        all_sockets = {**self.connected_peers, **self.outgoing_peers}
        for did, ws in all_sockets.items():
            if did != exclude_peer:
                try:
                    await ws.send(payload)
                except Exception:
                    pass

    async def execute_local_inference(self, model: str, prompt: str) -> str:
        """Execute a prompt via local Ollama daemon."""
        # Fallback to first available model if requested is missing
        if model not in self.models and self.models:
            model = self.models[0]
        try:
            loop = asyncio.get_event_loop()
            def _call():
                resp = requests.post(
                    f"{self.ollama_host}/api/generate",
                    json={"model": model, "prompt": prompt, "stream": False},
                    timeout=30.0
                )
                if resp.status_code == 200:
                    return resp.json().get("response", "")
                return f"[Ollama Error {resp.status_code}]"
            return await loop.run_in_executor(None, _call)
        except Exception as e:
            return f"[Local Inference Failed: {e}]"

    async def send_ping(self, target_did: Optional[str] = None):
        """Send a signed ping across active peers."""
        ping_record = {
            "type": "ping",
            "ping_id": secrets.token_hex(8),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        signed_ping = self.identity.sign_json(ping_record)
        payload = json.dumps(signed_ping)
        
        all_sockets = {**self.connected_peers, **self.outgoing_peers}
        if not all_sockets:
            logger.info("[Ping] No active peers connected.")
            return

        for did, ws in all_sockets.items():
            if target_did is None or did == target_did:
                await ws.send(payload)
                logger.info(f"[Ping] Sent signed ping to {did}")

    async def run_server(self, duration: Optional[int] = None):
        """Run the WebSocket daemon."""
        server = await websockets.serve(self.handle_connection, "0.0.0.0", self.port)
        logger.info(f"==> MyNet Node Daemon LIVE on ws://0.0.0.0:{self.port} <==")
        logger.info(f"    Author DID: {self.identity.did}")

        if duration:
            await asyncio.sleep(duration)
            server.close()
            await server.wait_closed()
            logger.info("Daemon run window completed.")
        else:
            await server.wait_closed()


async def main_async():
    parser = argparse.ArgumentParser(description="MyNet Sovereign P2P Daemon")
    parser.add_argument("--port", type=int, default=9090, help="Listen port (default: 9090)")
    parser.add_argument("--peer", type=str, default=None, help="Peer URI to connect to (e.g., ws://localhost:8082)")
    parser.add_argument("--vault", type=str, default=str(DEFAULT_KEY_FILE), help="Path to identity vault JSON")
    parser.add_argument("--handle", type=str, default="zak.mynet.local", help="Node handle name")
    parser.add_argument("--duration", type=int, default=None, help="Run duration in seconds (for test loops)")
    parser.add_argument("--ping-after", type=int, default=None, help="Seconds before dispatching a test ping")

    args = parser.parse_args()

    # Load sovereign identity
    identity = NodeIdentity.load_or_create(Path(args.vault), handle=args.handle)
    node = SovereignNode(identity, port=args.port)

    # Start server task
    server_task = asyncio.create_task(node.run_server(duration=args.duration))

    # Connect to peer if specified
    if args.peer:
        await asyncio.sleep(1.0)  # Brief pause to let local server bind
        await node.connect_to_peer(args.peer)

    # Optional test ping
    if args.ping_after:
        await asyncio.sleep(args.ping_after)
        await node.send_ping()

    await server_task


def main():
    try:
        asyncio.run(main_async())
    except KeyboardInterrupt:
        logger.info("Node shutting down cleanly.")


if __name__ == "__main__":
    main()
