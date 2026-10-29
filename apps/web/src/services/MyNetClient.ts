/**
 * MyNet Browser Web Node Client (Zero-Install Mesh Participant)
 * Part of the Symbiorithm Network Protocols suite.
 * 
 * Runs directly inside any modern web browser using WebCrypto (Ed25519) and WebSockets.
 * Allows any device (laptop, phone, tablet) visiting MyOS to become an authenticated
 * zero-trust node without installing Python, Git, or binaries.
 */

const B58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

function b58encode(bytes: Uint8Array): string {
  let zeros = 0;
  while (zeros < bytes.length && bytes[zeros] === 0) {
    zeros++;
  }

  // Convert to BigInt
  let num = 0n;
  for (let i = 0; i < bytes.length; i++) {
    num = (num << 8n) + BigInt(bytes[i]);
  }

  let res = "";
  while (num > 0n) {
    const rem = Number(num % 58n);
    num = num / 58n;
    res = B58_ALPHABET[rem] + res;
  }

  return "1".repeat(zeros) + res;
}

export interface MyNetPeerManifest {
  author_did: string;
  handle: string;
  port: number;
  models: string[];
  status: string;
}

export interface MyNetThreatAlert {
  threat_id: string;
  attack_type: string;
  severity: string;
  mitigation_rule: string;
  reporter_did: string;
}

export type ThreatListener = (threat: MyNetThreatAlert) => void;
export type ManifestListener = (manifest: MyNetPeerManifest) => void;

export class MyNetBrowserClient {
  private keyPair: CryptoKeyPair | null = null;
  public did: string = "";
  public handle: string = "browser.webnode.local";
  private ws: WebSocket | null = null;
  public isConnected: boolean = false;
  public isAuthenticated: boolean = false;

  private threatListeners: Set<ThreatListener> = new Set();
  private manifestListeners: Set<ManifestListener> = new Set();
  private pendingRequests: Map<string, (output: string) => void> = new Map();

  /**
   * Initialize browser Ed25519 identity using WebCrypto API
   */
  async initIdentity(handle: string = "browser.webnode.local"): Promise<string> {
    this.handle = handle;

    // Check if key exists in IndexedDB / localStorage or generate fresh
    this.keyPair = await crypto.subtle.generateKey(
      { name: "Ed25519" },
      false, // non-extractable private key for maximum browser sandbox safety
      ["sign", "verify"]
    );

    const rawPub = await crypto.subtle.exportKey("raw", this.keyPair.publicKey);
    const pubBytes = new Uint8Array(rawPub);

    // Multicodec prefix 0xed01 for Ed25519
    const multicodec = new Uint8Array(2 + pubBytes.length);
    multicodec[0] = 0xed;
    multicodec[1] = 0x01;
    multicodec.set(pubBytes, 2);

    this.did = `did:key:z${b58encode(multicodec)}`;
    return this.did;
  }

  /**
   * Connect to the local gaming PC's MyNet daemon
   */
  connect(hostUri?: string): Promise<boolean> {
    return new Promise((resolve) => {
      const defaultHost = typeof window !== "undefined" && window.location.hostname
        ? `ws://${window.location.hostname}:9090`
        : "ws://127.0.0.1:9090";

      const uri = hostUri || defaultHost;
      this.ws = new WebSocket(uri);

      this.ws.onopen = () => {
        this.isConnected = true;
      };

      this.ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          await this.handleMessage(data);
          if (data.type === "manifest_exchange") {
            resolve(true);
          }
        } catch {
          // ignore malformed
        }
      };

      this.ws.onerror = () => {
        this.isConnected = false;
        resolve(false);
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.isAuthenticated = false;
      };
    });
  }

  private async handleMessage(msg: any) {
    if (msg.type === "handshake_challenge") {
      // Sign nonce with browser Ed25519 key
      const nonce = msg.nonce;
      if (!this.keyPair) {
        await this.initIdentity();
      }

      const nonceBytes = new TextEncoder().encode(nonce);
      const sigBuffer = await crypto.subtle.sign(
        { name: "Ed25519" },
        this.keyPair!.privateKey,
        nonceBytes
      );

      // Convert signature to URL-safe base64
      const sigBytes = new Uint8Array(sigBuffer);
      let binary = "";
      for (let i = 0; i < sigBytes.byteLength; i++) {
        binary += String.fromCharCode(sigBytes[i]);
      }
      const b64Sig = btoa(binary)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

      // Send reciprocal handshake response
      const response = {
        type: "handshake_response",
        nonce: nonce,
        author_did: this.did,
        sig: b64Sig,
        handle: this.handle
      };

      this.ws?.send(JSON.stringify(response));
      this.isAuthenticated = true;
    } else if (msg.type === "manifest_exchange") {
      const manifest: MyNetPeerManifest = msg.manifest;
      this.manifestListeners.forEach((l) => l(manifest));
    } else if (msg.type === "threat_broadcast") {
      const threat: MyNetThreatAlert = msg.threat_signature;
      this.threatListeners.forEach((l) => l(threat));
    } else if (msg.type === "compute_receipt") {
      const reqId = msg.receipt?.request_id;
      if (reqId && this.pendingRequests.has(reqId)) {
        const cb = this.pendingRequests.get(reqId)!;
        cb(msg.receipt.output || "");
        this.pendingRequests.delete(reqId);
      }
    }
  }

  /**
   * Request remote inference from the sovereign node's local Ollama
   */
  async requestInference(prompt: string, model: string = "mistral:latest"): Promise<string> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("MyNet WebSocket is not connected.");
    }

    const reqId = `req_${Math.random().toString(36).substring(2, 10)}`;
    const taskPayload = {
      type: "compute_task",
      task: {
        request_id: reqId,
        prompt: prompt,
        model: model
      }
    };

    return new Promise((resolve) => {
      this.pendingRequests.set(reqId, resolve);
      this.ws?.send(JSON.stringify(taskPayload));
    });
  }

  onThreatAlert(listener: ThreatListener) {
    this.threatListeners.add(listener);
    return () => this.threatListeners.delete(listener);
  }

  onManifestReceived(listener: ManifestListener) {
    this.manifestListeners.add(listener);
    return () => this.manifestListeners.delete(listener);
  }

  disconnect() {
    this.ws?.close();
  }
}

// Global browser singleton
export const mynetClient = new MyNetBrowserClient();
