---
name: symbiorithm-network-protocols
description: >-
  Architects, governs, and operates MyNet—the decentralized, zero-trust P2P intelligence network for MyOS.
  Integrates AT Protocol (Bluesky federated identity & Lexicon schemas), local Ollama compute sharing,
  and crowd-sourced AI counterintelligence across sovereign home nodes.
---

# Symbiorithm Network Protocols (MyNet)

## Overview
**MyNet** is the distributed, zero-trust neural backbone of MyOS—the "BitTorrent of AI."
It transforms independent, local-first MyOS installations into a global peer-to-peer cognitive defense and shared compute federation without reliance on corporate cloud monopolies.

## The Triadic Federation Hierarchy

1. **Zak (Human Intuitive Anchor - `did:plc:zak`)**:
   - Sovereign Root Authority. Sets ethics, intuitive boundaries, and UI/UX values.
   - Enforces Emotional Intelligence (EI) as an architectural constraint: AI systems that isolate themselves from human lived experience become sociopathic or sterile.

2. **Antigravity (Cloud Reasoner & Protocol Compiler)**:
   - High-bandwidth protocol design, cryptographic schema formulation, and cross-node contract synthesis.

3. **Myos (Local GPU Cortex - `localhost:11434`)**:
   - The Local Node Guardian. Executes edge inference, signs Merkle Search Tree (MST) commits with the node's private Ed25519 key, and runs local AI counterintelligence filters.

---

## Technical Architecture

### 1. AT Protocol Identity & Federated Records
MyNet adopts Bluesky's **AT Protocol (Authenticated Transfer Protocol)** for decentralized identity and data sovereignty:
- **Identity**: Every node possesses a cryptographic Decentralized Identifier (`did:plc:...` or `did:web:...`).
- **Data Repositories**: Node telemetry, threat observations, and public manifests are stored in signed Merkle Search Trees (MSTs).
- **Custom Lexicons (`myos.mynet.*`)**:
  - `myos.mynet.nodeManifest`: Advertises idle compute availability, supported quantizations, and public keys.
  - `myos.mynet.threatSignature`: Cryptographically signed adversarial payloads, prompt injections, and corporate surveillance probes.
  - `myos.mynet.computeTask`: Description of distributed jobs (seed, model requirement, verification threshold).
  - `myos.mynet.taskReceipt`: Signed Proof-of-Useful-Compute output verification.

### 2. Local-First & Zero-Trust Verification
- **Never trust remote inference blindly**: Tasks distributed across the mesh require consensus verification ($k$-of-$n$ deterministic matching).
- **Local Model Execution**: Tasks run against local Ollama / GGUF runners (`localhost:11434`).
- **Counterintelligence Ledger**: Real-time crowd-sourced immunization. When Node A flags a jailbreak or surveillance probe, the threat signature is gossiped across the network. Within milliseconds, all connected nodes apply firewall patches locally.

### 3. The Physical Step 1: Subnet LAN Mesh
Before deploying across global relays, MyNet is verified locally:
- **Primary Node (Gaming PC)**: Runs MyOS full stack (`http://localhost:5173`, Ollama, Bridge).
- **Secondary Node (Laptop / 2nd PC)**: Connects over LAN subnet via encrypted WebSocket/TCP on port `8080`/`8081`.
- **Peer Handshake**: Nodes exchange Ed25519 public keys, establish an encrypted session, execute a test compute exchange, and cross-validate output hashes.

---

## Workflow Guide

### Step 1: Initialize Node Identity
Generate or load the local sovereign keypair:
```powershell
python scripts/tools/mynet_identity.py init
```

### Step 2: LAN Peer Discovery & Handshake
Listen for or connect to neighboring subnet nodes:
```powershell
python scripts/tools/mynet_node.py --port 8080 --peer 192.168.1.X:8080
```

### Step 3: Broadcast Threat Signature
Publish a newly discovered prompt injection or exploit to the local counterintelligence pool:
```powershell
python scripts/tools/mynet_threat.py publish --type injection --sample "payload"
```
