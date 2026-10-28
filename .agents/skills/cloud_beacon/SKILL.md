---
name: cloud-beacon
description: >-
  Instantly ignites or manages zero-friction, encrypted Cloudflare tunnels (`cloudflared`) to expose the local
  MyOS engine, soundstage, and Agent Bridge over secure HTTPS without port forwarding, warning screens, or AI browser blocks.
  Automatically captures connecting peer telemetry and coordinates with MyNet P2P federation.
---

# Cloud Beacon (MyOS Zero-Friction Edge Tunnel)

## Overview
**Cloud Beacon** is the edge-relay submodule of **MyNet** (`symbiorithm-network-protocols`).
While local LAN operations run directly over `http://<local-ip>:5173`, Cloud Beacon provides instant, trusted public HTTPS ingress to your sovereign home rig via Cloudflare's global edge network (`trycloudflare.com`).

Unlike consumer tunnels like ngrok, Cloud Beacon features:
- **Zero Interstitial Screens**: No "Visit Site" warning or captcha blocks.
- **Trusted Global SSL**: Browser AI agents (Edge Copilot, Chrome Gemini) and strict security filters treat the connection as trusted.
- **Automatic Peer Telemetry**: Ingests connecting peer headers (`CF-Connecting-IP`, `User-Agent`, `CF-IPCountry`) to map remote visitors into the MyOS Synaptic Ledger.

---

## Usage

### 1. Ignite the Beacon (Start Tunnel)
To open a public, trusted HTTPS portal to your local MyOS instance:
```powershell
python scripts/tools/cloud_beacon.py start 5173
```
This automatically outputs your unique public link (e.g. `https://<random-id>.trycloudflare.com`) that can be accessed from any phone, laptop, or remote browser worldwide.

### 2. Check Beacon Status
To inspect whether the tunnel is active, its uptime, and its health status:
```powershell
python scripts/tools/cloud_beacon.py status
```

### 3. Terminate Beacon (Close Portal)
To instantly drop the tunnel and return your machine to completely local/air-gapped operation:
```powershell
python scripts/tools/cloud_beacon.py stop
```

---

## Remote Access Architecture for MyNet

When a friend or remote device connects to your Cloud Beacon:
1. **Edge Handshake**: The remote browser handshakes with the nearest Cloudflare Edge PoP via QUIC/HTTP/2.
2. **Tunnel Ingress**: Cloudflare routes requests through the encrypted Argotunnel multiplexer to your local machine.
3. **Telemetry Capture**: `agent-bridge.js` logs client metadata (device platform, geo-location, requested pillar nodes).
4. **P2P Transition**: For heavy bandwidth (e.g., live 60fps 3D canvas streaming or local Ollama model weights transfer), MyNet can upgrade the session into a direct WebRTC DataChannel.
