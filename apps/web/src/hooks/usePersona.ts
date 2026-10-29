/**
 * usePersona.ts
 *
 * React hook for managing the active Orchestrator persona.
 * Integrates with OntologicalContext, the brain library, and the Tutor system prompt.
 *
 * Usage:
 *   const { activePersona, shapeshift, resetPersona, personaSystemPromptFragment } = usePersona();
 */

import { useState, useCallback } from 'react';
import {
    type Persona,
    getPersonaByPath,
    getPersonasByPillar,
    ALL_PERSONAS,
} from '../memory/personaLibrary';
import { useOntologicalContext } from '../council/OntologicalContext';

// Default persona when no shapeshift is active
const DEFAULT_PERSONA_SLUG = 'omni.orchestrator';

interface UsePersonaReturn {
    /** Currently active persona, or null if in default Orchestrator mode */
    activePersona: Persona | null;
    /** Shapeshift to a persona by ontological path e.g. "logic.terry_davis" */
    shapeshift: (path: string) => { success: boolean; message: string };
    /** Reset to default Orchestrator persona */
    resetPersona: () => void;
    /** System prompt fragment to prepend — empty string if default */
    personaSystemPromptFragment: string;
    /** Gossip lines for the active persona */
    personaGossipLines: string[];
    /** Genome tags for paperdoll avatar generation */
    personaGenomeTags: string[];
    /** Full list of all personas grouped by pillar */
    personasByPillar: Record<string, Persona[]>;
    /** Get all personas for a specific pillar */
    getByPillar: (pillar: string) => Persona[];
    /** Format a help string listing personas */
    listPersonas: (pillar?: string) => string;
}

export const usePersona = (): UsePersonaReturn => {
    const [activePersona, setActivePersona] = useState<Persona | null>(null);
    const { setActivePath } = useOntologicalContext();

    const shapeshift = useCallback((input: string): { success: boolean; message: string } => {
        const trimmed = input.trim().toLowerCase();

        // List command
        if (trimmed === 'list' || trimmed.startsWith('list ')) {
            const targetPillar = trimmed.split(' ')[1];
            return { success: true, message: listPersonasInternal(targetPillar) };
        }

        // Reset command
        if (trimmed === 'reset' || trimmed === 'default' || trimmed === DEFAULT_PERSONA_SLUG) {
            setActivePersona(null);
            setActivePath('omni');
            return { success: true, message: 'Orchestrator returned to default form.' };
        }

        // Try direct path lookup first (e.g. "logic.terry_davis")
        let persona: Persona | undefined;
        if (trimmed.includes('.')) {
            persona = getPersonaByPath(trimmed);
        }

        // Fallback: fuzzy search by slug or name
        if (!persona) {
            persona = ALL_PERSONAS.find(
                p =>
                    p.slug.toLowerCase() === trimmed ||
                    p.slug.toLowerCase().includes(trimmed) ||
                    p.name.toLowerCase().includes(trimmed)
            );
        }

        if (!persona) {
            return {
                success: false,
                message: `No persona matching "${input}" found. Try /shapeshift list or /shapeshift list {pillar}`,
            };
        }

        // Activate the persona
        setActivePersona(persona);

        // Update global ontological path to this persona's address
        setActivePath(`${persona.pillar}.${persona.slug}`);

        return {
            success: true,
            message: `Shapeshifting to ${persona.name} (${persona.pillar} pillar, ${persona.type})...`,
        };
    }, [setActivePath]);

    const resetPersona = useCallback(() => {
        setActivePersona(null);
        setActivePath('omni');
    }, [setActivePath]);

    // Group all personas by pillar for UI rendering
    const personasByPillar: Record<string, Persona[]> = {};
    for (const persona of ALL_PERSONAS) {
        if (!personasByPillar[persona.pillar]) {
            personasByPillar[persona.pillar] = [];
        }
        personasByPillar[persona.pillar].push(persona);
    }

    const listPersonas = useCallback((pillar?: string): string => {
        return listPersonasInternal(pillar);
    }, []);

    return {
        activePersona,
        shapeshift,
        resetPersona,
        personaSystemPromptFragment: activePersona?.systemPromptFragment ?? '',
        personaGossipLines: activePersona?.gossipLines ?? [],
        personaGenomeTags: activePersona?.genomeTags ?? [],
        personasByPillar,
        getByPillar: getPersonasByPillar,
        listPersonas,
    };
};

// ─────────────────────────────────────────────────────────────────────────────

function listPersonasInternal(pillar?: string): string {
    const pillars = pillar
        ? [pillar]
        : [...new Set(ALL_PERSONAS.map(p => p.pillar))];

    const lines: string[] = ['**Available Personas:**\n'];
    for (const pName of pillars) {
        const personas = getPersonasByPillar(pName);
        if (personas.length === 0) continue;
        lines.push(`**${pName.toUpperCase()}**`);
        for (const p of personas) {
            const tag = p.type === 'historical' ? '📜' : '🎭';
            lines.push(`  ${tag} \`/shapeshift ${pName}.${p.slug}\` — ${p.name} (${p.era})`);
        }
        lines.push('');
    }
    lines.push('_Type `/shapeshift reset` to return to default Orchestrator._');
    return lines.join('\n');
}
