import React, { useEffect, useRef } from 'react';
import { useWorld } from '../../engine/WorldContext';
import { useSocial } from '../../social/SocialContext';
import { useFrame } from '@react-three/fiber';

/**
 * ResonanceLinkEngine
 * 
 * Monitors symbolic links between objects (like modular walls) and agents (NPCs).
 * Triggers behavioral shifts in NPCs based on environment state changes.
 */
export const ResonanceLinkEngine: React.FC = () => {
    const { buildingPieces, symbolicLinks } = useWorld();
    const lastStates = useRef<Record<string, boolean>>({});

    useFrame(() => {
        symbolicLinks.forEach(link => {
            const source = buildingPieces.find(p => p.id === link.sourceId);
            if (!source) return;

            const wasDestroyed = lastStates.current[source.id] || false;
            const isCurrentlyDestroyed = source.isDestroyed || source.health <= 0;

            if (!wasDestroyed && isCurrentlyDestroyed) {
                // TRIGGER: State Transition
                console.log(`[ResonanceLink] Triggering ${link.reaction} for ${link.targetId} due to ${source.id} destruction.`);
                
                // We'll use the existing Social/Council system to trigger behaviors.
                // In a real scenario, this would inject a new "Urgency" state into the NPC's LLM prompt
                // or force a specific animation/walk-target.
                
                if (link.reaction === 'flee') {
                    // For now, we bark and suggest movement via logs/state
                    // The MephitNPC will need to be updated to check these 'external' triggers.
                    window.dispatchEvent(new CustomEvent('NPC_BEHAVIOR_SHIFT', { 
                        detail: { 
                            npcId: link.targetId, 
                            behavior: 'flee',
                            reason: `My ${source.type} was destroyed!`
                        } 
                    }));
                }
            }

            lastStates.current[source.id] = isCurrentlyDestroyed;
        });
    });

    return null;
};
