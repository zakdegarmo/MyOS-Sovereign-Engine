import type { NexusContext, ContextPacket, LocationState, KnowledgeState } from '@Omni/types_context';
import type { AgentName } from '@Omni/lib/types/manifestation';

// RENAMED: NexusRouter -> ResonantAether
// The Decentralized Event Fabric
class ResonantAetherService {
    private static instance: ResonantAetherService;
    private context: NexusContext;

    // Legacy Global Subscribers
    private subscribers: ((context: NexusContext, packet?: ContextPacket) => void)[] = [];

    // NEW: Channel Subscribers (Map<Channel, Callback[]>)
    private channelSubscribers: Map<string, ((packet: ContextPacket) => void)[]> = new Map();

    private packetHistory: ContextPacket[] = [];

    // THE AKASHIC WEAVE: Content-Addressable Memory
    private contentStore: Map<string, any> = new Map(); // Hash -> Content
    private nlblIndex: Map<string, any> = new Map();    // Hash -> NLBLCoordinate

    // Initial Empty Context
    private constructor() {
        this.context = {
            gestalt: {
                // Default Gestalt (Empty)
                archetype: "Unknown",
                coreValues: [],
                narrativeArc: "Initialization",
                logicPreference: "Balanced",
                attributes: {
                    construct: { level: 1, xp: 0, history: [] },
                    resonance: { level: 1, xp: 0, history: [] },
                    vision: { level: 1, xp: 0, history: [] },
                    endurance: { level: 1, xp: 0, history: [] }
                },
                cognitiveModel: {
                    learningStyle: 'visual',
                    riskTolerance: 'balanced',
                    communicationDensity: 'concise'
                },
                symbiosis: {
                    coherence: 50,
                    friction: 0,
                    flowState: false
                },
                identity: { name: "User" },
                biometrics: { appearance: "Digital Avatar" },
                favorites: { color: "Blue", food: "Data" }
            },
            location: {
                currentInterface: 'unity',
                activeTab: 'matrix'
            },
            knowledge: {
                librarySnapshot: null,
                activeMemories: []
            },
            system: {
                telemetry: {
                    cpuLoad: 0,
                    memoryUsage: 0,
                    latency: 0,
                    errorRate: 0,
                    activeConnections: 0
                },
                activeAgents: [],
                routingTraffic: []
            }
        };
    }

    public static getInstance(): ResonantAetherService {
        if (!ResonantAetherService.instance) {
            ResonantAetherService.instance = new ResonantAetherService();
            // @ts-ignore
            window.NexusRouter = ResonantAetherService.instance;
        }
        return ResonantAetherService.instance;
    }

    // --- READ ---
    public get currentContext(): NexusContext {
        return { ...this.context };
    }

    public getContext(): NexusContext {
        return { ...this.context };
    }

    public getPackets(): ContextPacket[] {
        return [...this.packetHistory];
    }

    // --- WRITE (Push Updates) ---

    public updateLocation(update: Partial<LocationState>) {
        this.context.location = { ...this.context.location, ...update };
        this.broadcast({
            id: Date.now().toString(),
            timestamp: Date.now(),
            source: 'system',
            target: 'global',
            type: 'state_update',
            payload: { location: update }
        });
    }

    public updateKnowledge(update: Partial<KnowledgeState>) {
        this.context.knowledge = { ...this.context.knowledge, ...update };
        // Don't broadcast full library on every update, maybe just a summary
        this.broadcast({
            id: Date.now().toString(),
            timestamp: Date.now(),
            source: 'thought',
            target: 'global',
            type: 'thought',
            payload: { updateType: 'knowledge_change' }
        });
    }

    public emitPacket(packet: Omit<ContextPacket, 'id' | 'timestamp'>) {
        const fullPacket: ContextPacket = {
            ...packet,
            id: Math.random().toString(36).substr(2, 9),
            timestamp: Date.now()
        };

        // Add to History (Keep last 50)
        this.packetHistory = [fullPacket, ...this.packetHistory].slice(0, 50);
        this.context.system.routingTraffic = this.packetHistory;

        this.broadcast(fullPacket);
    }

    // --- NEW: AETHER PUB/SUB ---

    /**
     * Publish a payload to a specific frequency (channel).
     * @param channel e.g. "thought.stream.new_idea"
     * @param payload The data to transmit
     * @param source Who is sending it
     */
    public publish(channel: string, payload: any, source: AgentName | 'user' | 'system' = 'system') {
        const packet: ContextPacket = {
            id: Math.random().toString(36).substr(2, 9),
            timestamp: Date.now(),
            source: source,
            target: 'global',
            channel: channel,
            type: 'insight', // Default type, can be inferred
            payload: payload
        };

        this.emitPacket(packet); // Pipe into main stream for now
    }

    /**
     * Tune into a specific frequency.
     * @param channel The channel to listen to
     * @param callback Function to run when data arrives
     */
    public subscribeToChannel(channel: string, callback: (packet: ContextPacket) => void) {
        if (!this.channelSubscribers.has(channel)) {
            this.channelSubscribers.set(channel, []);
        }
        this.channelSubscribers.get(channel)?.push(callback);

        // Return Unsubscribe Function
        return () => {
            const subs = this.channelSubscribers.get(channel) || [];
            this.channelSubscribers.set(channel, subs.filter(cb => cb !== callback));
        };
    }

    // --- SUB ---
    public subscribe(callback: (context: NexusContext, packet?: ContextPacket) => void) {
        this.subscribers.push(callback);
        // Instant callback with current state
        callback(this.context);
        return () => {
            this.subscribers = this.subscribers.filter(cb => cb !== callback);
        };
    }

    private broadcast(packet?: ContextPacket) {
        // 1. Notify Legacy Global Subscribers
        this.subscribers.forEach(cb => cb(this.context, packet));

        // 2. Notify Channel Subscribers
        if (packet && packet.channel) {
            const channelSubs = this.channelSubscribers.get(packet.channel);
            if (channelSubs) {
                channelSubs.forEach(cb => cb(packet));
            }
        }
    }

    // --- THE AKASHIC WEAVE (Non-Linear State) ---

    /**
     * Records a piece of content into the Akashic Weave.
     * Generates a hash and NLBL coordinate for addressing.
     */
    public async record(content: any, origin: string = 'system') {
        const json = JSON.stringify(content);
        // Simple Hash (In a production app, use crypto.subtle.digest)
        const hash = Array.from(json).reduce((s, c) => Math.imul(31, s) + c.charCodeAt(0) | 0, 0).toString(16);

        // 1. Store Content (Content Addressing)
        this.contentStore.set(hash, content);

        // 2. Map to NLBL Space
        const { NLBLMapper } = await import('@Omni/utils/nlblUtils');
        const coordinate = NLBLMapper.mapToCoordinate(hash);
        this.nlblIndex.set(hash, coordinate);

        // 3. Broadcast Vibe
        this.publish('existence.weave.new_record', { hash, coordinate, origin });

        return { hash, coordinate };
    }

    public getContent(hash: string) {
        return this.contentStore.get(hash);
    }

    public getWeaveSnapshot() {
        return {
            storeSize: this.contentStore.size,
            index: Array.from(this.nlblIndex.entries())
        };
    }
}

export const NexusRouter = ResonantAetherService.getInstance();
