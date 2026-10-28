// apps/web/src/memory/LoreService.ts
import { create, insert, search } from '@orama/orama';

export interface LoreDocument {
    id: string;
    title: string;
    content: string;
    source: string; // PDF path
    page: number;
    pillar: string; // Mapping to 10-Pillar Genome
    type: 'lore' | 'rules' | 'flavor';
}

class LoreService {
    async init() {
        // No local initialization required. The bridge handles Orama memory.
        console.log('[LoreService] Operating in Sharded Bridge Mode.');
    }

    /**
     * Map D&D concepts to MyOS Pillars
     */
    mapConceptToPillar(text: string): string {
        const lower = text.toLowerCase();
        
        // Mastery: Classes, levels, skills, expertise
        if (lower.includes('class') || lower.includes('level') || lower.includes('feat') || lower.includes('expertise')) return 'mastery';
        
        // Existence: The Weave, planes, fundamental magic, origins
        if (lower.includes('weave') || lower.includes('plane') || lower.includes('astral') || lower.includes('creation') || lower.includes('magic')) return 'existence';
        
        // Unity: Factions, cities, common guilds, alliances
        if (lower.includes('faction') || lower.includes('guild') || lower.includes('alliance') || lower.includes('city') || lower.includes('waterdeep')) return 'unity';
        
        // Logic: Rules engineering, mechanics, math, systems
        if (lower.includes('dice') || lower.includes('roll') || lower.includes('+') || lower.includes('check') || lower.includes('modifier')) return 'logic';
        
        // Thought: Lore, history, myths, legends, journals
        if (lower.includes('history') || lower.includes('legend') || lower.includes('myth') || lower.includes('journal')) return 'thought';
        
        // Default to Existence (The Root)
        return 'existence';
    }

    // Deprecated for direct ingestion. Use LoreArchitect's batching.
    async ingestChunk(chunk: Partial<LoreDocument>) {
        console.warn('ingestChunk called in Sharded Mode. This is a no-op.');
        return chunk;
    }

    async searchLore(query: string, pillar?: string, index: 'system' | 'lore' | 'all' = 'all') {
        try {
            const res = await fetch('http://localhost:8081/api/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query, index })
            });
            const data = await res.json();
            
            if (data.results && data.results.hits) {
                let hits = data.results.hits.map((h: any) => h.document);
                if (pillar) {
                    hits = hits.filter((d: any) => d.pillar === pillar || (d.title && d.title.includes('Topology Map')));
                }
                return hits;
            }
            return [];
        } catch (err) {
            console.error('[LoreService] Bridge search failed:', err);
            return [];
        }
    }
}

export const loreService = new LoreService();

