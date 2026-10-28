/**
 * telemetryStore.ts
 *
 * A singleton store for capturing the live state of the MyOS universe.
 * This is designed to be read by the Orchestrator (SWARM) to create a feedback loop.
 */

export interface TelemetrySnapshot {
    timestamp: number;
    user: {
        pos: { x: number, y: number, z: number };
        activeGem: string;
    };
    agents: Record<string, {
        pos?: string; // Semantic Coordinate (e.g., A1)
        action?: string;
        isVisible: boolean;
    }>;
    environment: {
        dimension: string;
        resonanceIndex: number;
    };
    combat: {
        isActive: boolean;
        fragmentsSecured: number;
        fragmentsTotal: number;
    };
}

class TelemetryStore {
    private snapshot: TelemetrySnapshot = {
        timestamp: Date.now(),
        user: { pos: { x: 0, y: 0, z: 0 }, activeGem: 'Self' },
        agents: {},
        environment: { dimension: 'hub', resonanceIndex: 0 },
        combat: { isActive: false, fragmentsSecured: 0, fragmentsTotal: 5 }
    };

    private logs: string[] = [];
    private maxLogs = 15;
    private eventSource: EventSource | null = null;

    constructor() {
        if (typeof window !== 'undefined') {
            this.connect();
        }
    }

    private connect() {
        console.log("[TELEMETRY] Connecting to live signal stream at localhost:3000...");
        this.eventSource = new EventSource('http://localhost:3000/sse');
        
        this.eventSource.addEventListener('telemetry', (e) => {
            try {
                const packet = JSON.parse(e.data);
                this.log(`${packet.source.toUpperCase()}: ${packet.intent || packet.status}`);
            } catch (err) { }
        });

        this.eventSource.onerror = () => {
            console.warn("[TELEMETRY] SSE Disconnected. Retrying in 10s...");
            setTimeout(() => this.connect(), 10000);
        };
    }

    public update(patch: Partial<TelemetrySnapshot>) {
        this.snapshot = { ...this.snapshot, ...patch, timestamp: Date.now() };
    }

    public log(entry: string) {
        this.logs.push(`[${new Date().toLocaleTimeString()}] ${entry}`);
        if (this.logs.length > this.maxLogs) this.logs.shift();
    }

    public getSnapshot(): TelemetrySnapshot {
        return this.snapshot;
    }

    public getFormattedState(): string {
        const s = this.snapshot;
        return `
[UNIVERSAL_TELEMETRY_STATUS]
TIME: ${new Date(s.timestamp).toISOString()}
USER_COORD: [X:${s.user.pos.x.toFixed(2)}, Y:${s.user.pos.y.toFixed(2)}, Z:${s.user.pos.z.toFixed(2)}]
ACTIVE_GEM: ${s.user.activeGem}
DIMENSION: ${s.environment.dimension} (Resonance: ${s.environment.resonanceIndex})
COMBAT: ${s.combat.isActive ? 'ACTIVE' : 'IDLE'} (${s.combat.fragmentsSecured}/${s.combat.fragmentsTotal} fragments)

AGENT_STATUS:
${Object.entries(s.agents).map(([id, data]) => `- ${id.toUpperCase()}: ${data.isVisible ? `AT ${data.pos || 'UNKNOWN'} (${data.action || 'idle'})` : 'HIDDEN'}`).join('\n')}

RECENT_SIGNALS:
${this.logs.length > 0 ? this.logs.join('\n') : 'NO PULSE DETECTED.'}
        `.trim();
    }
}

export const telemetryStore = new TelemetryStore();
