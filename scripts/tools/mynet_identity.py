#!/usr/bin/env python3
"""
MyNet Sovereign Node Identity Manager (AT Protocol Compliant)
Part of the Symbiorithm Network Protocols suite.

Generates and manages sovereign Ed25519 cryptographic keypairs,
derives W3C / ATProto-compliant did:key identifiers, and handles
cryptographic signing and verification for zero-trust P2P meshes.
"""

import os
import sys
import json
import base64
import argparse
from datetime import datetime, timezone
from pathlib import Path

from cryptography.hazmat.primitives.asymmetric import ed25519
from cryptography.hazmat.primitives import serialization

# Base58 BTC Alphabet
B58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
ED25519_MULTICODEC_PREFIX = b"\xed\x01"  # Multicodec identifier for Ed25519 public key

VAULT_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "mynet_vault"
DEFAULT_KEY_FILE = VAULT_DIR / "node_identity.json"


def b58encode(b: bytes) -> str:
    """Encode bytes using Base58-BTC alphabet."""
    zeros = len(b) - len(b.lstrip(b"\x00"))
    num = int.from_bytes(b, "big")
    res = []
    while num > 0:
        num, rem = divmod(num, 58)
        res.append(B58_ALPHABET[rem])
    return (B58_ALPHABET[0] * zeros) + "".join(reversed(res))


def b58decode(s: str) -> bytes:
    """Decode a Base58-BTC string back to bytes."""
    zeros = len(s) - len(s.lstrip(B58_ALPHABET[0]))
    num = 0
    for ch in s:
        if ch not in B58_ALPHABET:
            raise ValueError(f"Invalid Base58 character: '{ch}'")
        num = num * 58 + B58_ALPHABET.index(ch)
    num_bytes = num.to_bytes((num.bit_length() + 7) // 8, "big") if num > 0 else b""
    return (b"\x00" * zeros) + num_bytes


def public_key_to_did(pubkey_bytes: bytes) -> str:
    """Derive standard ATProto / W3C did:key string from 32-byte Ed25519 public key."""
    if len(pubkey_bytes) != 32:
        raise ValueError(f"Ed25519 public key must be 32 bytes, got {len(pubkey_bytes)}")
    multicodec = ED25519_MULTICODEC_PREFIX + pubkey_bytes
    return "did:key:z" + b58encode(multicodec)


def did_to_public_key(did: str) -> ed25519.Ed25519PublicKey:
    """Parse a did:key string and reconstruct the Ed25519 public key object."""
    if not did.startswith("did:key:z"):
        raise ValueError(f"Expected did:key starting with 'did:key:z', got: '{did}'")
    raw = b58decode(did[9:])
    if not raw.startswith(ED25519_MULTICODEC_PREFIX):
        raise ValueError("Unsupported multicodec prefix (expected Ed25519 0xed01)")
    pubkey_bytes = raw[2:]
    if len(pubkey_bytes) != 32:
        raise ValueError(f"Invalid Ed25519 key length in DID: {len(pubkey_bytes)}")
    return ed25519.Ed25519PublicKey.from_public_bytes(pubkey_bytes)


class NodeIdentity:
    """Represents a sovereign MyNet node identity with Ed25519 signing capabilities."""

    def __init__(self, private_key: ed25519.Ed25519PrivateKey, handle: str = "sovereign.node.local"):
        self.private_key = private_key
        self.public_key = private_key.public_key()
        self.handle = handle

        self.priv_bytes = self.private_key.private_bytes(
            encoding=serialization.Encoding.Raw,
            format=serialization.PrivateFormat.Raw,
            encryption_algorithm=serialization.NoEncryption()
        )
        self.pub_bytes = self.public_key.public_bytes(
            encoding=serialization.Encoding.Raw,
            format=serialization.PublicFormat.Raw
        )
        self.did = public_key_to_did(self.pub_bytes)

    @classmethod
    def generate(cls, handle: str = "sovereign.node.local") -> "NodeIdentity":
        """Generate a brand new Ed25519 keypair."""
        priv = ed25519.Ed25519PrivateKey.generate()
        return cls(priv, handle=handle)

    @classmethod
    def load_or_create(cls, filepath: Path = DEFAULT_KEY_FILE, handle: str = "zak.mynet.local") -> "NodeIdentity":
        """Load identity from vault file, or generate and save if absent."""
        filepath = Path(filepath)
        if filepath.exists():
            with open(filepath, "r", encoding="utf-8") as f:
                data = json.load(f)
            priv_bytes = bytes.fromhex(data["private_key_hex"])
            priv = ed25519.Ed25519PrivateKey.from_private_bytes(priv_bytes)
            return cls(priv, handle=data.get("handle", handle))

        # Create new
        identity = cls.generate(handle=handle)
        identity.save(filepath)
        return identity

    def save(self, filepath: Path = DEFAULT_KEY_FILE):
        """Save identity securely to disk."""
        filepath = Path(filepath)
        filepath.parent.mkdir(parents=True, exist_ok=True)
        payload = {
            "did": self.did,
            "handle": self.handle,
            "key_type": "Ed25519",
            "public_key_hex": self.pub_bytes.hex(),
            "private_key_hex": self.priv_bytes.hex(),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2)

    def sign(self, data: bytes) -> str:
        """Sign binary data and return a URL-safe Base64 signature."""
        sig = self.private_key.sign(data)
        return base64.urlsafe_b64encode(sig).decode("utf-8")

    def sign_json(self, record: dict) -> dict:
        """Embed an Ed25519 signature and DID directly into a JSON dictionary."""
        record_copy = dict(record)
        record_copy.pop("sig", None)
        record_copy["author_did"] = self.did
        canonical_bytes = json.dumps(record_copy, sort_keys=True, separators=(",", ":")).encode("utf-8")
        signature = self.sign(canonical_bytes)
        record_copy["sig"] = signature
        return record_copy

    @staticmethod
    def verify(did: str, data: bytes, signature_b64: str) -> bool:
        """Verify signature against a did:key public key."""
        try:
            pub_key = did_to_public_key(did)
            sig = base64.urlsafe_b64decode(signature_b64.encode("utf-8"))
            pub_key.verify(sig, data)
            return True
        except Exception:
            return False

    @staticmethod
    def verify_json(record: dict) -> bool:
        """Verify the signature on a canonical JSON record."""
        try:
            record_copy = dict(record)
            sig = record_copy.pop("sig", None)
            author_did = record_copy.get("author_did")
            if not sig or not author_did:
                return False
            canonical_bytes = json.dumps(record_copy, sort_keys=True, separators=(",", ":")).encode("utf-8")
            return NodeIdentity.verify(author_did, canonical_bytes, sig)
        except Exception:
            return False


def main():
    parser = argparse.ArgumentParser(description="MyNet Sovereign Identity Manager")
    subparsers = parser.add_subparsers(dest="command", help="Command to execute")

    init_cmd = subparsers.add_parser("init", help="Initialize or load sovereign node identity")
    init_cmd.add_argument("--handle", default="zak.mynet.local", help="User or node handle")
    init_cmd.add_argument("--vault", default=str(DEFAULT_KEY_FILE), help="Path to vault JSON file")

    show_cmd = subparsers.add_parser("show", help="Display existing sovereign identity")
    show_cmd.add_argument("--vault", default=str(DEFAULT_KEY_FILE), help="Path to vault JSON file")

    sign_cmd = subparsers.add_parser("sign", help="Sign a message string")
    sign_cmd.add_argument("message", help="Text message to sign")
    sign_cmd.add_argument("--vault", default=str(DEFAULT_KEY_FILE), help="Path to vault JSON file")

    verify_cmd = subparsers.add_parser("verify", help="Verify a message signature")
    verify_cmd.add_argument("message", help="Original text message")
    verify_cmd.add_argument("signature_pos", nargs="?", default=None, help="Base64 signature (positional)")
    verify_cmd.add_argument("did_pos", nargs="?", default=None, help="Signer's did:key (positional)")
    verify_cmd.add_argument("--sig", "-s", dest="sig_flag", default=None, help="Base64 signature (flag)")
    verify_cmd.add_argument("--did", "-d", dest="did_flag", default=None, help="Signer's did:key (flag)")

    args = parser.parse_args()

    if args.command == "init" or (args.command is None and len(sys.argv) == 1):
        vault_path = Path(getattr(args, "vault", DEFAULT_KEY_FILE))
        handle = getattr(args, "handle", "zak.mynet.local")
        already_existed = vault_path.exists()
        identity = NodeIdentity.load_or_create(vault_path, handle=handle)
        
        status = "LOADED EXISTING" if already_existed else "INITIALIZED NEW"
        print(f"\n==================================================")
        print(f"  MYNET SOVEREIGN IDENTITY ({status})")
        print(f"==================================================")
        print(f"  Handle:       {identity.handle}")
        print(f"  DID:          {identity.did}")
        print(f"  Public Key:   {identity.pub_bytes.hex()}")
        print(f"  Vault File:   {vault_path}")
        print(f"  Standard:     W3C / ATProto did:key (Ed25519)")
        print(f"==================================================\n")

    elif args.command == "show":
        vault_path = Path(args.vault)
        if not vault_path.exists():
            print(f"[!] No identity found at {vault_path}. Run 'init' first.")
            sys.exit(1)
        identity = NodeIdentity.load_or_create(vault_path)
        print(f"\n[+] Active Node DID: {identity.did}")
        print(f"[+] Handle:         {identity.handle}")
        print(f"[+] Public Key:     {identity.pub_bytes.hex()}")

    elif args.command == "sign":
        vault_path = Path(args.vault)
        if not vault_path.exists():
            print(f"[!] Vault not found. Run 'init' first.")
            sys.exit(1)
        identity = NodeIdentity.load_or_create(vault_path)
        data = args.message.encode("utf-8")
        sig = identity.sign(data)
        print(f"\n[+] Message:   {args.message}")
        print(f"[+] Signer:    {identity.did}")
        print(f"[+] Signature: {sig}\n")

    elif args.command == "verify":
        sig = args.sig_flag or args.signature_pos
        did = args.did_flag or args.did_pos
        if not sig or not did:
            print("[!] Error: Both signature and DID are required. Pass them as arguments or via --sig and --did.")
            sys.exit(1)
        data = args.message.encode("utf-8")
        valid = NodeIdentity.verify(did, data, sig)
        if valid:
            print(f"\n[SUCCESS] Signature is VALID for {did}!\n")
            sys.exit(0)
        else:
            print(f"\n[FAILED] Signature is INVALID for {did}.\n")
            sys.exit(1)


if __name__ == "__main__":
    main()
