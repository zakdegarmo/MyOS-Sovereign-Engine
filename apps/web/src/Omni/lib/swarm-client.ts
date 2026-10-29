
/**
 * SwarmClient
 * Handles the raw SSE connection and JSON-RPC posting.
 */
export class SwarmClient {
    private eventSource: EventSource | null = null;
    private endpoint: string;

    constructor(endpoint: string = 'http://localhost:3000') {
        this.endpoint = endpoint;
    }

    public connect(onMessage: (data: any) => void, onConnect?: () => void) {
        console.log(`Connecting to Swarm at ${this.endpoint}/sse...`);
        this.eventSource = new EventSource(`${this.endpoint}/sse`);

        this.eventSource.onopen = () => {
            console.log('SSE connection opened.');
            if (onConnect) onConnect();
        };

        this.eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                onMessage(data);
            } catch (err) {
                console.error('Failed to parse SSE message:', err);
            }
        };

        // [TELEMETRY SUPPORT]
        this.eventSource.addEventListener('telemetry', (event: MessageEvent) => {
            try {
                const data = JSON.parse(event.data);
                // Wrap in a structure if needed, or just pass raw ThoughtPacket
                // TelemetryPanel expects raw ThoughtPacket or array?
                // NexusTerminal expects JSON-RPC result.
                // Let's pass it through. Consumers must differentiate.
                onMessage(data);
            } catch (err) {
                console.error('Failed to parse Telemetry message:', err);
            }
        });

        this.eventSource.onerror = (err) => {
            console.error('Swarm Uplink Error:', err);
            // Optional: Reconnection logic
        };
    }

    public async sendMessage(method: string, params: any) {
        // Simple JSON-RPC 2.0 Wrapper
        const payload = {
            jsonrpc: "2.0",
            method,
            params,
            id: Date.now()
        };

        try {
            const res = await fetch(`${this.endpoint}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                throw new Error(`Swarm replied with status: ${res.status}`);
            }
            return await res.json();
        } catch (err) {
            console.error('Failed to send message:', err);
            throw err;
        }
    }

    public async callTool(tool: string, args: any) {
        try {
            const res = await fetch(`${this.endpoint}/tools`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tool, args })
            });

            if (!res.ok) {
                throw new Error(`Tool Execution Failed: ${res.status}`);
            }
            return await res.json();
        } catch (err) {
            console.error(`Failed to call tool ${tool}:`, err);
            throw err;
        }
    }

    public disconnect() {
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
        }
    }
}
