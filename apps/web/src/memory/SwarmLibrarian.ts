/**
 * SwarmLibrarian.ts
 *
 * Core Service for Fractal Semantic Sorting in MyOS.
 * Powered by the local SWARM (Mistral @ localhost:3000).
 * Handles Recursive, Atomic Ontological Sorting for any data volume.
 */

import { SwarmClient } from '../Omni/lib/swarm-client';

export interface FractalVolume {
    id: string;
    name: string;
    pillars: Record<number, string>; // 1-10 local names
    concepts: Record<string, string>; // Symbol path -> Concept Name
    deweyBase: string; // The starting Dewey code
}

const swarm = new SwarmClient('http://localhost:3000');
const VOL_STORAGE_KEY = 'myos_swarm_volumes';

export const BOOTSTRAP_VOLUMES: Record<string, FractalVolume> = {
    codebase: {
        id: 'codebase',
        name: 'MyOS Codebase',
        pillars: {
            "1": "Self (Identity)", "2": "UI (Thought/View)", "3": "Logic (Structure)", "4": "Networking (Unity)",
            "5": "State (Existence)", "6": "Refactor (Improvement)", "7": "Execution (Mastery)", "8": "Context (Resonance)",
            "9": "Synthesis (Transcendence)", "10": "Kernel (Omni)"
        },
        concepts: {},
        deweyBase: "005.1"
    },
    movies: {
        id: 'movies',
        name: 'Cinema World',
        pillars: {
            "1": "Identity (Themes)", "2": "Genre (Thought)", "3": "Structure (Script)", "4": "Casting (Unity)",
            "5": "Production (Existence)", "6": "Editing (Improvement)", "7": "Performance (Mastery)", "8": "Score (Resonance)",
            "9": "Impact (Transcendence)", "10": "Auteur (Omni)"
        },
        concepts: {},
        deweyBase: "791.43"
    }
};

export const getVolumes = (): Record<string, FractalVolume> => {
    const raw = localStorage.getItem(VOL_STORAGE_KEY);
    if (!raw) {
        localStorage.setItem(VOL_STORAGE_KEY, JSON.stringify(BOOTSTRAP_VOLUMES));
        return BOOTSTRAP_VOLUMES;
    }
    return JSON.parse(raw);
};

export const saveVolume = (volume: FractalVolume) => {
    const volumes = getVolumes();
    volumes[volume.id] = volume;
    localStorage.setItem(VOL_STORAGE_KEY, JSON.stringify(volumes));
};

/**
 * Uses the local SWARM to generate a 10-Pillar Fractal Ontology for a topic or sub-concept.
 * parentPath: "" for root, "1" for Pillar 1, "1.2" for Pillar 1 -> Sub 2...
 */
export const fractalizeTopic = async (topic: string, deweyBase: string, parentPath: string = ""): Promise<FractalVolume> => {
    console.log(`[SWARM] Generating Fractal Ontology for: ${topic} (Path: ${parentPath || 'ROOT'})`);

    const depth = parentPath ? parentPath.split('.').length : 0;
    
    const prompt = `
        TOPIC: ${topic}
        PARENT_PATH: ${parentPath || "ROOT"}
        DEPTH: ${depth}
        TASK: Partition this domain into 10 distinct pillars/concepts.
        
        RULES:
        - Output valid JSON only.
        - Exactly 10 numbered children (1-10).
        - Map each child to its parent path (e.g., if parent is "1", children are "1.1", "1.2"... "1.10").
        - Align descriptions with the 10 MyOS Pillars (Self, Thought, Logic, Unity, Existence, Improvement, Mastery, Resonance, Transcendence, Omni).
        
        FORMAT:
        {
            "pillars": { "1": "Name", ... (only if depth 0) },
            "concepts": { 
                "${parentPath ? parentPath + '.1' : '1'}": { "title": "Concept", "description": "...", "deweyOffset": X },
                ...
            }
        }
    `;

    try {
        const response = await swarm.sendMessage('chat', { 
            prompt,
            system: "You are the SWARM Ontological Engine. You partition knowledge with fractal precision (Base 10)."
        });

        const data = typeof response.result === 'string' ? JSON.parse(response.result) : response.result;

        const volume: FractalVolume = {
            id: topic.toLowerCase().replace(/\s+/g, '_'),
            name: topic,
            pillars: data.pillars || {},
            concepts: data.concepts,
            deweyBase: deweyBase
        };

        saveVolume(volume);
        return volume;
    } catch (e) {
        console.error("[SWARM] Fractalization failed", e);
        throw e;
    }
};

/**
 * Performs Mitosis: Takes an existing concept and splits it into 10 more refined concepts.
 */
export const performMitosis = async (volumeId: string, parentPath: string): Promise<void> => {
    const volumes = getVolumes();
    const vol = volumes[volumeId];
    if (!vol) throw new Error("Volume not found");
    
    // Find the parent's title for context
    const parentConcept = vol.concepts[parentPath] as any;
    const parentTitle = typeof parentConcept === 'object' ? parentConcept.title : parentConcept;

    console.log(`[SWARM] Mitosis: Splitting ${parentTitle} into 10 nodes...`);
    
    const newVol = await fractalizeTopic(parentTitle, vol.deweyBase, parentPath);
    
    // Merge new concepts into absolute volume
    vol.concepts = { ...vol.concepts, ...newVol.concepts };
    saveVolume(vol);
};

/**
 * Parses a codebase and maps functions to the Fractal Semantic Genome.
 */
export const sortCodebaseAtomatic = async (files: { path: string, content: string }[]) => {
    console.log(`[SWARM] Commencing Atomic Sorting of ${files.length} code units.`);
    
    // Summary of the codebase for context
    const fileSummary = files.map(f => f.path).join(', ');
    console.log(`[SWARM] Library context initialized for: ${fileSummary.slice(0, 100)}...`);
    
    const results = [];
    
    for (const file of files) {
        const prompt = `
            UNIT: ${file.path}
            CODE: ${file.content.slice(0, 1500)}
            
            Determine the semantic coordinates (1-10) based on the project's Pillars:
            1:Self (Identity), 2:Thought (Cognition), 3:Logic (Structure), 4:Unity (Integration), 5:Existence (Reality), 6:Improvement (Refining), 7:Mastery (Pinnacle), 8:Resonance (Connection), 9:Transcendence (Beyond), 10:Omni (Total).
            
            Return JSON: { "pillar": X, "relationship": Y, "atom": "Name", "dewey": "700.X" }
        `;
        
        try {
            const res = await swarm.sendMessage('chat', { prompt });
            const mapping = typeof res.result === 'string' ? JSON.parse(res.result) : res.result;
            results.push({
                ...file,
                ...mapping
            });
        } catch (e) {
            console.warn(`[SWARM] Failed to classify ${file.path}`);
        }
    }
    
    return results;
};

export const resolveFractalConcept = (volumeId: string, path: string): string => {
    const volumes = getVolumes();
    const vol = volumes[volumeId];
    if (!vol) return 'UNMAPPED';
    return vol.concepts[path] || 'GENERIC RELATIONSHIP';
};
