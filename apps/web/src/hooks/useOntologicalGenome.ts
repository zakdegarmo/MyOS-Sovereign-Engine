/**
 * useOntologicalGenome.ts
 *
 * Deterministic mapping from an ontological path string (e.g. "self.identity.ego")
 * to a unique, reproducible AvatarGenome. Same path always yields same sprite.
 *
 * Hash space mathematics:
 *   17 genome layers × avg ~10 options per layer = 10^17 combinations (100 quadrillion+)
 *   With the full LPC manifest (often 20-50 options per layer) this easily exceeds 5.27 quintillion.
 *   The path hash seeds a PRNG so every node in an ontological tree of depth ≤ 28
 *   gets a unique, stable visual identity.
 */

import { useMemo } from 'react';
import { GENOME_LAYERS, type AvatarGenome, type GenomeLayer } from './useAvatarCompositor';
import { getPersonaByPath } from '../memory/personaLibrary';

// --- Constants ---
export const defaultGenome: AvatarGenome = {
    body: 'body/bodies/body_bodies_male.png',
    legs: 'legs/pants/legs_pants_male_brown.png',
    torso: 'none',
    hair: 'hair/bangs/hair_bangs_male_orange.png',
    feet: 'none',
    hat: 'none',
    head: 'head/nose/head_nose_straight_adult.png',
    eyes: 'eyes/human/eyes_human_adult_blue.png',
    facial: 'none',
    shoulders: 'none',
    arms: 'none',
    weapon: 'none',
    offhand: 'none'
};

// --- Pillar index mapping ---
const PILLAR_NAMES = [
    'self', 'thought', 'logic', 'unity', 'existence',
    'improvement', 'mastery', 'resonance', 'transcendence', 'omni'
] as const;

// --- Relationship numerical values (based on Row 1) ---
const RELATIONSHIP_VALUES: Record<string, number> = {
    'identity': 1, 'subject of': 2, 'applies': 3, 'seeks': 4, 'affirms': 5,
    'undergoes': 6, 'pursues': 7, 'experiences': 8, 'aspires to': 9, 'is realized by': 10,
    // Synonyms found in matrix rows
    'recursion': 4, 'utilizes': 6, 'synthesizes': 8, 'represents': 10, 'informs': 2, 'drives': 2,
    'develops': 4, 'articulate': 6, 'enables': 8, 'transcends': 10, 'governs': 6, 'foundation': 9,
    'ensures': 2, 'describes': 5, 'validates': 8, 'underpins': 1, 'contradicts': 4, 'grounds': 7,
    'requires': 2, 'essence': 6, 'binds': 10, 'fosters': 4, 'culminates in': 8, 'manifests in': 1,
    'is': 5, 'evolves through': 10, 'is domain of': 5, 'is path to': 9, 'leades to': 7,
    'integrates': 4, 'harmonizes': 8, 'amplifies': 2, 'achieves': 6, 'ultimate expression of': 10,
    'is pondered by': 10, 'obeys': 5, 'comprises': 10, 'vibrates in': 10, 'is surpassed by': 5, 'gives rise to': 10
};

/**
 * cyrb53 — fast, high-quality 53-bit hash.
 * Deterministic: same seed + input always yields the same output.
 */
export function cyrb53(str: string, seed = 0): number {
    let h1 = 0xdeadbeef ^ seed;
    let h2 = 0x41c6ce57 ^ seed;
    for (let i = 0; i < str.length; i++) {
        const ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

/**
 * Seeded pseudo-random number generator (mulberry32).
 * Returns a function that yields a deterministic float in [0, 1).
 */
function seededRng(seed: number) {
    let s = seed >>> 0;
    return () => {
        s |= 0; s = s + 0x6d2b79f5 | 0;
        let t = Math.imul(s ^ s >>> 15, 1 | s);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

/**
 * Derive the pillar index (0-9) from the first segment of a path.
 * e.g. "self.identity.ego" → 0 (self)
 * Falls back to a hash-based value if the root is unknown.
 */
export function pillarIndexFromPath(path: string): number {
    const root = path.toLowerCase().split('.')[0] ?? '';
    const idx = PILLAR_NAMES.indexOf(root as any);
    if (idx !== -1) return idx;
    // Unknown root: derive a stable index from the path hash
    return cyrb53(root) % 10;
}

/**
 * Calculates a deterministic axiomatic seed from an ontological path.
 * Axiom: P_seed = (PillarA_val * Rel_val) % 10
 */
export function getAxiomaticSeed(path: string): number {
    const segments = path.toLowerCase().split('.');
    if (segments.length < 2) return cyrb53(path);

    const pillar = segments[0];
    const rel = segments[1];

    const pVal = PILLAR_NAMES.indexOf(pillar as any) + 1; // 1-10
    const rVal = RELATIONSHIP_VALUES[rel] || (cyrb53(rel) % 10) + 1;

    let product = (pVal * rVal) % 10;
    if (product === 0) product = 10;

    // We can also add secondary sub-path influence by adding a small offset from the hash of the full string
    const jitter = cyrb53(path) % 1000;
    return (product * 1000) + jitter;
}

/**
 * Core function: map any ontological path to a deterministic AvatarGenome.
 *
 * @param path - Dot-separated ontological path, e.g. "self.identity.ego"
 * @param manifest - LPC asset manifest (layer → available filenames)
 * @param forceNoneChance - Probability (0-1) that an optional layer is set to 'none'.
 *                          Default 0.15 (15%) keeps sprites varied but not naked.
 */
export function genomeFromPath(
    path: string,
    manifest: Record<GenomeLayer, string[]>,
    forceNoneChance = 0.15,
): AvatarGenome {
    const seed = getAxiomaticSeed(path.toLowerCase().trim());
    const rng = seededRng(seed);

    // Required layers always get an asset (never 'none')
    const required = new Set<GenomeLayer>(['body', 'eyes', 'legs']);

    const genome = {} as AvatarGenome;

    for (const layer of GENOME_LAYERS) {
        // --- CATEGORY NORMALIZATION (⚹ The Mesh of Self) ---
        // Map genome layer (e.g. 'head') to all manifest categories starting with that prefix (e.g. 'head/heads')
        let options: string[] = [];
        const ll = layer.toLowerCase();
        
        Object.keys(manifest).forEach(key => {
            const lk = key.toLowerCase();
            if (lk === ll || lk.startsWith(ll + '/') || lk.startsWith(ll + '_')) {
                const entries = (manifest as any)[key];
                if (Array.isArray(entries)) {
                    options.push(...entries);
                }
            }
        });

        if (options.length === 0) {
            genome[layer] = 'none';
            continue;
        }

        const isRequired = required.has(layer) || layer === 'head';
        if (!isRequired && rng() < forceNoneChance) {
            genome[layer] = 'none';
        } else {
            // Filter out animation sheets, keep only "base" sprites for these static genome previews
            const filtered = options.filter(a => {
                const lp = a.toLowerCase();
                return !['walk', 'run', 'shoot', 'slash', 'spellcast', 'thrust', 'hurt', 'climb', 'bow'].some(k => lp.includes(k));
            });
            
            if (filtered.length === 0) {
                genome[layer] = 'none';
                continue;
            }

            const idx = Math.floor(rng() * filtered.length);
            genome[layer] = filtered[idx];
        }
    }

    return genome;
}

/**
 * Advanced fuzzy matching: Maps high-level persona tags to specific manifest asset paths.
 */
export function genomeFromPersonaTags(
    tags: string[],
    manifest: Record<GenomeLayer, string[]>
): AvatarGenome {
    const genome = {} as AvatarGenome;
    const lowerTags = tags.map(t => t.toLowerCase());

    // Basic gender detection for better defaults
    const isFemale = lowerTags.includes('female');

    for (const layer of GENOME_LAYERS) {
        // --- CATEGORY NORMALIZATION (⚹ The Mesh of Self) ---
        // Map genome layer (e.g. 'head') to all manifest categories starting with that prefix
        let options: string[] = [];
        const ll = layer.toLowerCase();
        
        Object.keys(manifest).forEach(key => {
            const lk = key.toLowerCase();
            // Handle both exact matches and sub-category folder paths (e.g., torso/clothes)
            if (lk === ll || lk.startsWith(ll + '/') || lk.startsWith(ll + '_')) {
                const entries = (manifest as any)[key];
                if (Array.isArray(entries)) {
                    options.push(...entries);
                }
            }
        });

        if (options.length === 0) {
            genome[layer] = 'none';
            continue;
        }

        // Find the "best fit" file by counting tag overlaps in the filename
        let bestOption = 'none';
        let highestScore = -1;

        for (const opt of options) {
            const fileName = opt.toLowerCase();
            let score = 0;

            // Give points for each tag found in the filename/path
            for (const tag of lowerTags) {
                if (fileName.includes(tag)) score += 10;
                // Sub-string matching for partial tags
                const tagParts = tag.split('_');
                for (const part of tagParts) {
                    if (part.length > 2 && fileName.includes(part)) score += 2;
                }
            }

            // Gender bias points
            if (isFemale && (fileName.includes('female') || fileName.includes('_f_'))) score += 5;
            if (!isFemale && (fileName.includes('male') || fileName.includes('_m_'))) score += 5;

            if (score > highestScore) {
                highestScore = score;
                bestOption = opt;
            }
        }

        // Fallback: if no tags matched at all, and it's a required layer, pick the first one
        if (highestScore <= 0) {
            const required = ['body', 'eyes', 'legs'];
            if (required.includes(layer)) {
                bestOption = options[0];
            } else {
                bestOption = 'none';
            }
        }

        genome[layer] = bestOption;
    }

    return genome;
}

/**
 * Derive the hue shift (0-359) for a given path.
 * The first pillar contributes a base hue (every 36°),
 * and sub-path segments shift it slightly for variety.
 */
export function hueFromPath(path: string): number {
    const pillarIdx = pillarIndexFromPath(path);
    const baseHue = pillarIdx * 36;
    const subSeed = cyrb53(path, 42);
    const subShift = subSeed % 36; // up to ±18° variation within pillar band
    return (baseHue + subShift) % 360;
}

// --- React Hook ---

type OntologicalGenomeResult = {
    genome: AvatarGenome;
    pillarIndex: number;
    hue: number;
    seed: number;
};

/**
 * Hook: derive a memoized genome for any ontological path.
 * Re-derives only when path or manifest changes.
 */
export function useOntologicalGenome(
    path: string,
    manifest: Record<GenomeLayer, string[]>,
): OntologicalGenomeResult {
    return useMemo(() => {
        if (!path || Object.keys(manifest).length === 0) {
            return {
                genome: Object.fromEntries(GENOME_LAYERS.map(l => [l, 'none'])) as AvatarGenome,
                pillarIndex: 0,
                hue: 0,
                seed: 0,
            };
        }

        const normalizedPath = path.toLowerCase().trim();
        const persona = getPersonaByPath(normalizedPath);

        if (persona && persona.genomeTags) {
            return {
                genome: genomeFromPersonaTags(persona.genomeTags, manifest),
                pillarIndex: pillarIndexFromPath(normalizedPath),
                hue: hueFromPath(normalizedPath),
                seed: cyrb53(normalizedPath)
            };
        }

        const seed = cyrb53(normalizedPath);
        return {
            genome: genomeFromPath(normalizedPath, manifest),
            pillarIndex: pillarIndexFromPath(normalizedPath),
            hue: hueFromPath(normalizedPath),
            seed,
        };
    }, [path, manifest]);
}

/**
 * Procedural randomization using the full manifest.
 * Used by Mephit NPCs and the Sprite Laboratory (Avatar Editor).
 */
export function randomizeGenome(manifest: any): AvatarGenome {
    const newGenome: Record<string, string> = { ...defaultGenome };
    
    // We expect the "sprites" part of the manifest
    const sprites = manifest.sprites || manifest;

    if (sprites && Object.keys(sprites).length > 0) {
        GENOME_LAYERS.forEach(layer => {
            const candidates: any[] = [];
            // --- PRECISE MAPPING FOR COLLIDING CATEGORIES ---
            // If the layer is 'head', we MUST prioritize 'head/heads' or else we get floating ears/noses as heads.
            Object.keys(sprites).forEach(key => {
                const lk = key.toLowerCase();
                const ll = layer.toLowerCase();
                
                let matches = false;
                if (ll === 'head') {
                    matches = lk === 'head/heads'; // Base head skin
                } else if (ll === 'ears') {
                    matches = lk.startsWith('head/ears') || lk.startsWith('head/fins');
                } else if (ll === 'nose') {
                    matches = lk.startsWith('head/nose');
                } else {
                    // Match "body", "body/", "body_", etc.
                    matches = lk === ll || lk.startsWith(ll + '/') || lk.startsWith(ll + '_');
                }

                if (matches) {
                    const entries = (sprites as any)[key];
                    if (Array.isArray(entries)) {
                        candidates.push(...entries);
                    }
                }
            });

            // Filter out animation sheets, keep only "base" sprites if possible
            const filtered = candidates.filter(a => {
                const path = typeof a === 'string' ? a : (a.path || '');
                const lp = path.toLowerCase();
                // Exclude common LPC action keywords
                return !['walk', 'run', 'shoot', 'slash', 'spellcast', 'thrust', 'hurt', 'climb', 'bow'].some(k => lp.includes(k));
            });

            if (filtered.length > 0) {
                const isRequired = ['body', 'legs', 'head', 'eyes'].includes(layer);
                // 15% chance to skip optional layers for variety
                if (!isRequired && Math.random() > 0.85) {
                    newGenome[layer] = 'none';
                } else {
                    const choice = filtered[Math.floor(Math.random() * filtered.length)];
                    newGenome[layer] = typeof choice === 'string' ? choice : choice.path;
                }
            }
        });
    }
    return newGenome as AvatarGenome;
}
