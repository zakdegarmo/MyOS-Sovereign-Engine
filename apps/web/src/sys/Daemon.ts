/**
 * Daemon.ts
 * 
 * Implements the BaseDaemon and Holographic Proxy system.
 * Allows micro-processes to execute in a "shadowed" environment before 
 * their wisdom (StickyNotes) is submitted to the Crucible.
 */

import { SemanticAddress } from './SemanticAddress';
import type { WorldState } from '../engine/WorldState';

/**
 * A StickyNote represents a proposed mutation to the system's reality.
 */
export interface StickyNote {
    id: string;
    name: string;
    originAddress: string;
    targetAddress: string;
    proposedChanges: Record<string, any>; // The delta found by the Proxy
    metadata: {
        timestamp: number;
        duration: number;
        complexity: number;
        intent: string;
        daemonType?: string;
    };
}

export interface IDaemon {
    id: string;
    address: SemanticAddress;
    execute(state: WorldState): Promise<void>;
    propose(): StickyNote;
}

/**
 * The BaseDaemon class providing the Holographic Fork (Proxy) mechanism.
 */
export abstract class BaseDaemon implements IDaemon {
    public id: string;
    public address: SemanticAddress;
    protected shadowState: WorldState;
    protected originalState: WorldState;
    protected mutations: Record<string, any> = {};
    protected startTime: number = 0;

    constructor(id: string, address: string) {
        this.id = id;
        this.address = SemanticAddress.decode(address);
    }

    /**
     * Initializes the Holographic Fork using a JavaScript Proxy.
     */
    protected createHolographicFork(state: WorldState): WorldState {
        this.originalState = state;
        this.mutations = {};
        this.startTime = performance.now();

        const handler: ProxyHandler<any> = {
            get: (target, prop, receiver) => {
                const value = Reflect.get(target, prop, receiver);
                // If it's an object, we should probably wrap it recursively for deep mutations
                if (typeof value === 'object' && value !== null) {
                    return new Proxy(value, handler);
                }
                return value;
            },
            set: (target, prop, value, receiver) => {
                const path = prop.toString();
                this.mutations[path] = value;
                return Reflect.set(target, prop, value, receiver);
            }
        };

        // Note: For a true "fork", we should really be proxying a clone or 
        // intercepting sets without touching the original. 
        // A better version of a non-destructive Proxy:
        const sandbox = { ...state };
        return new Proxy(sandbox, {
            get: (target, prop) => {
                if (prop in this.mutations) return this.mutations[prop.toString()];
                return (target as any)[prop];
            },
            set: (target, prop, value) => {
                this.mutations[prop.toString()] = value;
                return true;
            }
        }) as WorldState;
    }

    /**
     * The core execution logic. 
     * Subclasses must call super.execute(state) to initialize the fork.
     */
    public async execute(state: WorldState): Promise<void> {
        this.shadowState = this.createHolographicFork(state);
        await this.run(this.shadowState);
    }

    /**
     * Subclasses implement their logic here, operating on the shadowState.
     */
    protected abstract run(shadowState: WorldState): Promise<void>;

    /**
     * Generates a StickyNote (Wisdom) from the captured mutations.
     */
    public propose(): StickyNote {
        const endTime = performance.now();
        return {
            id: `note-${this.id}-${Date.now()}`,
            name: this.id,
            originAddress: this.address.fullAddress,
            targetAddress: this.address.fullAddress, // Default to self-improvement
            proposedChanges: this.mutations,
            metadata: {
                timestamp: Date.now(),
                duration: endTime - this.startTime,
                complexity: Object.keys(this.mutations).length,
                intent: 'OPTIMIZE',
                daemonType: this.constructor.name
            }
        };
    }
}
