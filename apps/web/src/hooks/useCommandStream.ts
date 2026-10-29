import { useRef, useCallback } from 'react';

/** 
 * PILLAR INTENT TYPES (The "What")
 */
export const IntentType = {
    IDLE: 0,
    WANDER: 1,
    MOVE: 2,
    STRIKE: 3,
    RESONATE: 4,
    HURT: 5,
    DEAD: 6,
    INTERACT: 7
} as const;

export type IntentType = typeof IntentType[keyof typeof IntentType];

/**
 * THE COMMAND PACKET
 */
export interface CommandPacket {
    entityId: string;       // Who is doing it
    type: IntentType;
    intensity?: number;      // 0.0 to 1.0 (velocity or power)
    targetId?: string;      // Optional target
    vector?: [number, number, number]; // Directional data
    timestamp: number;
}

// Precedence Mapping (Lower = Higher Priority)
const PRECEDENCE: Record<IntentType, number> = {
    [IntentType.DEAD]: 0,
    [IntentType.HURT]: 1,
    [IntentType.INTERACT]: 2,
    [IntentType.STRIKE]: 3,
    [IntentType.RESONATE]: 3,
    [IntentType.MOVE]: 4,
    [IntentType.WANDER]: 5,
    [IntentType.IDLE]: 6
};

// Intent Types that "Lock" the state (Prevent lower priority actions in the same frame)
const LOCKING_INTENTS: IntentType[] = [IntentType.DEAD, IntentType.HURT, IntentType.INTERACT];

export const useCommandStream = () => {
    // The Atomic Buffer Ref
    const buffer = useRef<CommandPacket[]>([]);

    /**
     * Dispatch an Intent (The Producer)
     */
    const dispatchIntent = useCallback((packet: Omit<CommandPacket, 'timestamp'>) => {
        buffer.current.push({ ...packet, timestamp: Date.now() });
    }, []);

    /**
     * Consume and Resolve Intents (The Consumer/Arbiter)
     * To be called inside the useFrame loop.
     */
    const resolveIntents = useCallback(() => {
        if (buffer.current.length === 0) return new Map<string, CommandPacket[]>();

        // 1. Atomic Swap/Drain
        const batch = [...buffer.current];
        buffer.current = [];

        // 2. Group by Entity and Sort by Precedence
        const entityMap = new Map<string, CommandPacket[]>();
        
        batch.forEach(packet => {
            if (!entityMap.has(packet.entityId)) {
                entityMap.set(packet.entityId, []);
            }
            entityMap.get(packet.entityId)!.push(packet);
        });

        // 3. Apply Conflict Resolution Logic
        const resolvedMap = new Map<string, CommandPacket[]>();
        
        entityMap.forEach((packets, entityId) => {
            // Sort by Precedence rank (Numerical Ascending)
            const sorted = packets.sort((a, b) => PRECEDENCE[a.type] - PRECEDENCE[b.type]);
            
            // If the highest priority intent is a "Locking" one, discard others
            const topIntent = sorted[0];
            if (LOCKING_INTENTS.includes(topIntent.type)) {
                resolvedMap.set(entityId, [topIntent]);
            } else {
                // Otherwise, return all (Sequential execution)
                resolvedMap.set(entityId, sorted);
            }
        });

        return resolvedMap;
    }, []);

    return { dispatchIntent, resolveIntents };
};
