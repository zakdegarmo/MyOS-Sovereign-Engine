import { useState, useCallback, useEffect } from 'react';
import { generateResponse } from '../components/MaxOverlay/localLlmService';

export interface MissionNode {
    id: string;
    label: string;
    type: 'TUNNEL' | 'BOSS' | 'REWARD' | 'LOCKED';
    pillar: string;
    difficulty: number;
    connections: string[];
    position: { x: number, y: number };
    occupiedBy?: string[];
}

export interface Mission {
    id: string;
    title: string;
    description: string;
    difficulty: 'LOW' | 'MED' | 'HIGH';
    rewards: { type: string; amount: number }[];
    targetPillar: string;
    targetAddress: string; // The "Russian Doll" path, e.g., "Self/Identity"
    status: 'AVAILABLE' | 'ACTIVE' | 'COMPLETED';
    nodes: MissionNode[];
}

/**
 * useStoryteller
 * Orchestrates AI-driven mission generation and deployment logic.
 */
export const useStoryteller = () => {
    const [missions, setMissions] = useState<Mission[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Persist missions in localStorage for the session
    useEffect(() => {
        const saved = localStorage.getItem('myos_storyteller_missions');
        if (saved) {
            try {
                setMissions(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse saved missions", e);
            }
        }
    }, []);

    const saveMissions = useCallback((newMissions: Mission[]) => {
        setMissions(newMissions);
        localStorage.setItem('myos_storyteller_missions', JSON.stringify(newMissions));
    }, []);

    const scanForJobs = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        const prompt = `
            You are the Storyteller of MyOS. 
            Generate 3 unique tactical missions for a digital operative.
            Each mission must include a small tactical map (3-5 nodes).
            
            UNIVERSE CONTEXT:
            - Currency: MasCoins
            - Pillars: Self, Thought, Logic, Unity, Existence, Mastery.
            - Applet Addresses (targetAddress): ide-terminal, github-uplink, chronicles, sigil-synthesis, telemetry-hub.
            - Setting: Cyber-Alchemical OS.
            
            MISSION REQUIREMENTS:
            - title: Cyber-alchemical name.
            - description: High-flavor, technical yet mystical.
            - difficulty: LOW, MED, or HIGH.
            - rewards: Array of { type: "MasCoins", amount: number }.
            - targetPillar: One of the 10 Pillars.
            - targetAddress: Use one of the Applet Addresses OR a 2-layer path like 'Self/Identity'.
            - nodes: Array of nodes where types are TUNNEL, BOSS, REWARD. 
              Each node needs: id, label, pillar, difficulty (1-10), connections (ids), 
              and position (x: 50-600, y: 50-400).
            
            FORMAT: Respond ONLY with a JSON array of missions.
            Example:
            [{
                "id": "m1",
                "title": "Substrate Extraction",
                "description": "...",
                "difficulty": "LOW",
                "rewards": [{"type": "MasCoins", "amount": 150}],
                "targetPillar": "Logic",
                "targetAddress": "Logic/Hardware",
                "status": "AVAILABLE",
                "nodes": [
                    { "id": "n1", "label": "Entry", "type": "TUNNEL", "pillar": "Logic", "difficulty": 1, "connections": ["n2"], "position": {"x": 50, "y": 200} },
                    { "id": "n2", "label": "Boss", "type": "BOSS", "pillar": "Logic", "difficulty": 5, "connections": [], "position": {"x": 300, "y": 200} }
                ]
            }]
        `;

        try {
            const result = await generateResponse(prompt, undefined, "You are the Storyteller, generating mission data for a RPG engine.");
            
            // Extraction logic same as useAgentGamePlay
            const jsonStart = result.text.indexOf('[');
            const jsonEnd = result.text.lastIndexOf(']') + 1;
            
            if (jsonStart !== -1 && jsonEnd !== -1) {
                const jsonStr = result.text.substring(jsonStart, jsonEnd);
                const generatedMissions = JSON.parse(jsonStr).map((m: any) => ({
                    ...m,
                    status: 'AVAILABLE'
                }));
                saveMissions(generatedMissions);
            } else {
                throw new Error("Mystra failed to manifest a valid mission array.");
            }
        } catch (e) {
            console.error("[Storyteller] Mission Generation Error:", e);
            setError(e instanceof Error ? e.message : "Connection to Mystra Core lost.");
        } finally {
            setIsLoading(false);
        }
    }, [saveMissions]);

    const acceptMission = useCallback((missionId: string) => {
        const updated = missions.map(m => 
            m.id === missionId ? { ...m, status: 'ACTIVE' as const } : m
        );
        saveMissions(updated);
    }, [missions, saveMissions]);

    const deployMission = useCallback((missionId: string, nodeId?: string) => {
        const mission = missions.find(m => m.id === missionId);
        if (!mission) return;

        // Dispatch global event for MaxOverlay to pick up the transition
        window.dispatchEvent(new CustomEvent('myos_deploy_mission', { 
            detail: { 
                missionId,
                nodeId,
                targetAddress: mission.targetAddress,
                title: mission.title
            } 
        }));
    }, [missions]);

    return {
        missions,
        isLoading,
        error,
        scanForJobs,
        acceptMission,
        deployMission
    };
};
