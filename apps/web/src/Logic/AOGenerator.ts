/** 
 * AOGenerator - The "Overgod" Engine for the Living Realm.
 * Combines GaiaNoise procedural terrain with Canon Lore from the SQLite vector DB.
 */
import { gaiaNoise } from './GaiaNoise';

export interface LoreNode {
    id: string;
    timestamp: string;
    text: string;
}

export interface EntitySpawn {
    id: string;
    type: 'npc' | 'monster' | 'object';
    name: string;
    genome: Record<string, string>;
    x: number;
    y: number;
    z: number;
}

export class AOGenerator {
    private loreNodes: LoreNode[] = [];
    private isReady: boolean = false;
    private entityCache: Map<string, EntitySpawn[]> = new Map();

    constructor() {
        this.fetchLore();
    }

    private async fetchLore() {
        try {
            // MyOS backend proxy runs on 8082
            const res = await fetch('http://localhost:8082/api/lore');
            const data = await res.json();
            if (data.status === 'success') {
                this.loreNodes = data.nodes;
                console.log(`[AO Engine] Assimilated ${this.loreNodes.length} canon lore nodes.`);
            }
        } catch (e) {
            console.warn('[AO Engine] Failed to commune with the Vector DB.', e);
        } finally {
            this.isReady = true;
        }
    }

    /**
     * Get terrain tile ID for a given coordinate.
     */
    public getTerrain(x: number, z: number): { height: number, tileID: number, isCanon: boolean } {
        const base = gaiaNoise.getTileData(x, z);
        
        // --- CANON INJECTION LOGIC ---
        // For our FAFO test, let's create a specific "Canonical Overwrite" region.
        // We will place Neverwinter at coordinates (0, 0) to (5, 5).
        if (this.loreNodes.length > 0) {
            const hasNeverwinter = this.loreNodes.some(n => n.text.includes('Neverwinter'));
            if (hasNeverwinter && x >= 0 && x <= 5 && z >= 0 && z <= 5) {
                // Override with Cobblestone or City terrain (LPC ID for city road is usually 12 or 16, let's use 16)
                return { height: base.height, tileID: 16, isCanon: true };
            }
        }

        return { ...base, isCanon: false };
    }

    /**
     * Get entities that should spawn in a given chunk.
     */
    public getEntitiesInChunk(chunkX: number, chunkZ: number): EntitySpawn[] {
        const chunkKey = `${chunkX},${chunkZ}`;
        if (this.entityCache.has(chunkKey)) {
            return this.entityCache.get(chunkKey)!;
        }

        const entities: EntitySpawn[] = [];

        // FAFO Test: Spawn a Neverwinter Guard at (2, 2)
        if (chunkX === 0 && chunkZ === 0 && this.loreNodes.some(n => n.text.includes('Neverwinter'))) {
            entities.push({
                id: `guard_${chunkX}_${chunkZ}`,
                type: 'npc',
                name: 'Neverwinter Guard',
                x: 2,
                y: gaiaNoise.getTileData(2, 2).height,
                z: 2,
                genome: {
                    body: 'body/bodies/body_bodies_male.png',
                    legs: 'legs/pants/legs_pants_male_brown.png',
                    torso: 'torso/clothes/torso_clothes_male_longsleeve_brown.png',
                    arms: 'arms/armor/arms_armor_male_plate_shoulders.png',
                    head: 'head/heads/head_heads_human_male.png',
                    hair: 'hat/helmets/hat_helmets_male_plate_helm.png',
                    weapon: 'LPC_weapons_pack/1.png'
                }
            });
        }

        this.entityCache.set(chunkKey, entities);
        return entities;
    }
}

export const aoEngine = new AOGenerator();
