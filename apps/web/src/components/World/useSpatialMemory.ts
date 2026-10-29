import { useState, useEffect } from 'react';
import { spatialMemoryBridge, type SpatialMemoryNode } from '../../engine/SpatialMemoryBridge';
import { usePersistentWorldStore } from '../../store/usePersistentWorldStore';

export interface UseSpatialMemoryResult {
    activeMemories: SpatialMemoryNode[];
    activeParallaxPreset: string;
    dmPromptContext: string;
    rulesLawyerPromptContext: string;
    partyPromptContext: string;
    mutateMemory: (id: string, newLore: string, addTags: string[]) => void;
}

export const useSpatialMemory = (currentDimension: string = 'astra_lab'): UseSpatialMemoryResult => {
    const playerPos = usePersistentWorldStore(state => state.playerPos);

    const px = playerPos?.x || 0;
    const py = playerPos?.y || 0;
    const pz = playerPos?.z || 0;

    const [activeMemories, setActiveMemories] = useState<SpatialMemoryNode[]>([]);
    const [activeParallaxPreset, setActiveParallaxPreset] = useState<string>('faerun_overland');
    const [dmPromptContext, setDmPromptContext] = useState<string>('');
    const [rulesLawyerPromptContext, setRulesLawyerPromptContext] = useState<string>('');
    const [partyPromptContext, setPartyPromptContext] = useState<string>('');

    useEffect(() => {
        spatialMemoryBridge.setActiveDimension(currentDimension);
        const memories = spatialMemoryBridge.queryMemoriesAtPosition(px, py, pz, currentDimension);
        setActiveMemories(memories);

        // Auto-switch Parallaxatron atmospheric preset based on spatial memory
        const preset = spatialMemoryBridge.getParallaxPresetForPosition(px, pz, currentDimension);
        setActiveParallaxPreset(preset || 'faerun_overland');

        // Update agent swarm prompt context
        setDmPromptContext(spatialMemoryBridge.formatAgentPromptContext(px, py, pz, 'dm'));
        setRulesLawyerPromptContext(spatialMemoryBridge.formatAgentPromptContext(px, py, pz, 'rulesLawyer'));
        setPartyPromptContext(spatialMemoryBridge.formatAgentPromptContext(px, py, pz, 'party'));

    }, [px, py, pz, currentDimension]);

    const mutateMemory = (id: string, newLore: string, addTags: string[]) => {
        spatialMemoryBridge.mutateWorldMemory(id, newLore, addTags);
        // Refresh memories
        const updated = spatialMemoryBridge.queryMemoriesAtPosition(px, py, pz, currentDimension);
        setActiveMemories(updated);
    };

    return {
        activeMemories,
        activeParallaxPreset,
        dmPromptContext,
        rulesLawyerPromptContext,
        partyPromptContext,
        mutateMemory
    };
};
