import {
    FRACTAL_RELATIONSHIPS,
    AgentRole,
    TEAM_DATA
} from "@antigravity/swarm-core";
import { FRACTAL_GENOME_DATA, PILLAR_GLYPHS } from "../data/FractalGenomeData";

export interface SynergeticNode {
    id: string; // Unique ID (often the Symbol for Terminals)
    label: string; // Display Name (e.g. "Identity")
    symbol: string; // The Glyph (e.g. "⚹" or "⚹⚹⍽")
    rationale?: string; // The Description
    group: AgentRole;
    level: 0 | 1 | 2;
    val: number;
    color: string;
    fx?: number;
    fy?: number;
    fz?: number;
    x?: number;
    y?: number;
    z?: number;
}

export interface SynergeticLink {
    source: string;
    target: string;
    type: string;
    intensity: number;
    distance?: number;
}

export interface GraphData {
    nodes: SynergeticNode[];
    links: SynergeticLink[];
}

export function generateSynergeticGraph(): GraphData {
    const nodes: SynergeticNode[] = [];
    const links: SynergeticLink[] = [];

    const getColor = (role: AgentRole): string => {
        const tailwindColor = TEAM_DATA[role].color;
        const map: Record<string, string> = {
            'text-yellow-400': '#facc15', // Self
            'text-blue-400': '#60a5fa',   // Thought
            'text-green-400': '#4ade80',  // Logic
            'text-purple-400': '#c084fc', // Unity
            'text-red-400': '#f87171',    // Existence
            'text-orange-400': '#fb923c', // Improvement
            'text-indigo-400': '#818cf8', // Mastery
            'text-pink-400': '#f472b6',   // Resonance
            'text-cyan-400': '#22d3ee',   // Transcendence
            'text-white': '#ffffff'       // Omni
        };
        return map[tailwindColor] || '#ffffff';
    };

    // Geometric Constants
    const PRISM_RADIUS = 300;
    const PRISM_HEIGHT = 150;

    // --- 1. Generate L0: Pillars (The Architects) ---
    const roles = Object.values(AgentRole);
    const upperRing = [AgentRole.Self, AgentRole.Thought, AgentRole.Logic, AgentRole.Unity, AgentRole.Existence];
    const lowerRing = [AgentRole.Improvement, AgentRole.Mastery, AgentRole.Resonance, AgentRole.Transcendence, AgentRole.Omni];

    const createPillar = (role: AgentRole, x: number, y: number, z: number) => {
        nodes.push({
            id: role,
            label: TEAM_DATA[role].title,
            symbol: PILLAR_GLYPHS[role],
            group: role,
            level: 0,
            val: 40,
            color: getColor(role),
            fx: x, fy: y, fz: z
        });
    };

    upperRing.forEach((role, i) => {
        const angle = (i / 5) * Math.PI * 2;
        createPillar(role, PRISM_RADIUS * Math.cos(angle), PRISM_HEIGHT, PRISM_RADIUS * Math.sin(angle));
    });

    lowerRing.forEach((role, i) => {
        const angle = (i / 5) * Math.PI * 2 + (Math.PI / 5);
        createPillar(role, PRISM_RADIUS * Math.cos(angle), -PRISM_HEIGHT, PRISM_RADIUS * Math.sin(angle));
    });

    // --- 2. Generate L1 (Matrix) & L2 (Terminal) Nodes from FractalGenomeData ---
    // Helper to map string key "Self" back to AgentRole.Self
    const getRoleParams = (key: string): { role: AgentRole, color: string } | null => {
        // This relies on the key matching the Enum KEY, not value.
        // AgentRole[key] might not work if key is string.
        // Map Omnipotence back to Omni for AgentRole matching
        const enumKey = key === 'Omnipotence' ? 'Omni' : key;
        const entry = Object.entries(AgentRole).find(([k, v]) => k === enumKey);
        if (!entry) return null;
        return { role: entry[1] as AgentRole, color: getColor(entry[1] as AgentRole) };
    };

    Object.entries(FRACTAL_GENOME_DATA).forEach(([pillarKey, matrices]) => {
        const params = getRoleParams(pillarKey);
        if (!params) return;

        const pillarRole = params.role;
        const pillarNode = nodes.find(n => n.id === pillarRole);
        if (!pillarNode) return;

        const color = params.color;
        const matrixKeys = Object.keys(matrices);
        const matrixRadius = 60; // Distance from Pillar

        matrixKeys.forEach((matrixKey, mIndex) => {
            // L1: Matrix Node (e.g., Self->Thought "⚹☿")
            const terminals = matrices[matrixKey];

            // matrixKey is also a string like "Thought". We need its glyph.
            const targetParams = getRoleParams(matrixKey);
            const targetGlyph = targetParams ? PILLAR_GLYPHS[matrixKey] : "?";

            const pillarGlyph = PILLAR_GLYPHS[pillarKey] || "?";
            const matrixSymbol = `${pillarGlyph}${targetGlyph}`;
            const matrixId = `${pillarKey}_${matrixKey}`; // Use stable string IDs for matrices

            // Position: Orbit around Pillar
            const mAngle = (mIndex / matrixKeys.length) * Math.PI * 2;
            const mx = (pillarNode.fx || 0) + matrixRadius * Math.cos(mAngle);
            const my = (pillarNode.fy || 0) + (Math.random() * 20 - 10);
            const mz = (pillarNode.fz || 0) + matrixRadius * Math.sin(mAngle);

            nodes.push({
                id: matrixId,
                label: matrixKey,
                symbol: matrixSymbol,
                rationale: `Matrix: ${pillarKey} -> ${matrixKey}`,
                group: pillarRole,
                level: 1,
                val: 15,
                color: color,
                x: mx, y: my, z: mz
            });

            links.push({ source: pillarRole, target: matrixId, type: "Matrix", intensity: 2 });

            // L2: Terminal Nodes
            const terminalRadius = 25;
            terminals.forEach((term, tIndex) => {
                const tAngle = (tIndex / terminals.length) * Math.PI * 2;

                const tx = mx + terminalRadius * Math.cos(tAngle);
                const ty = my + terminalRadius * Math.sin(tAngle);
                const tz = mz;

                nodes.push({
                    id: term.id, // The Symbol itself is the ID (e.g. ⚹⚹⍽)
                    label: term.name,
                    symbol: term.id,
                    rationale: term.rationale,
                    group: pillarRole,
                    level: 2,
                    val: 5,
                    color: color,
                    x: tx, y: ty, z: tz
                });

                links.push({ source: matrixId, target: term.id, type: "Contains", intensity: 1 });
            });
        });
    });

    // --- 3. Cross-Pillar Relationships (Tensegrity) ---
    Object.entries(FRACTAL_RELATIONSHIPS).forEach(([source, targets]) => {
        const sourceRole = getRoleParams(source)?.role;
        if (!sourceRole) return;

        Object.entries(targets).forEach(([target, desc]) => {
            const targetRole = getRoleParams(target)?.role;
            if (!targetRole) return;

            links.push({ source: sourceRole, target: targetRole, type: desc as string, intensity: 0.5 });
        });
    });

    return { nodes, links };
}
