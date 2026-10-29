import type { ChunkNode } from './CampaignLatticeOntology';

export const CHUNK_SIZE = 100; // 100m x 100m spatial chunk size

export class ChunkPersistenceManager {
    private static STORAGE_PREFIX = 'myos_chunk_store_';
    private static memoryCache: Map<string, ChunkNode> = new Map();

    /**
     * Converts world x, z coordinates to chunk coordinates.
     */
    public static getChunkCoords(x: number, z: number): { cx: number; cz: number } {
        return {
            cx: Math.floor(x / CHUNK_SIZE),
            cz: Math.floor(z / CHUNK_SIZE)
        };
    }

    /**
     * Generates a unique key for a given chunk.
     */
    public static getChunkKey(cx: number, cz: number, regionId: string = 'astra_lab'): string {
        return `${regionId}_chunk_${cx}_${cz}`;
    }

    /**
     * Retrieves an existing chunk from storage/cache, or lazily generates a new ChunkNode.
     */
    public static getOrGenerateChunk(
        cx: number,
        cz: number,
        regionId: string = 'astra_lab',
        seed: number = 42
    ): ChunkNode {
        const key = this.getChunkKey(cx, cz, regionId);

        // 1. Check memory cache
        if (this.memoryCache.has(key)) {
            return this.memoryCache.get(key)!;
        }

        // 2. Check localStorage
        try {
            const raw = localStorage.getItem(`${this.STORAGE_PREFIX}${key}`);
            if (raw) {
                const chunk: ChunkNode = JSON.parse(raw);
                this.memoryCache.set(key, chunk);
                return chunk;
            }
        } catch (e) {
            console.warn(`[ChunkPersistenceManager] Failed to read chunk from localStorage:`, e);
        }

        // 3. Lazily generate new ChunkNode
        const newChunk: ChunkNode = {
            id: key,
            regionId,
            chunkX: cx,
            chunkZ: cz,
            seed: seed + cx * 73856093 ^ cz * 19349663,
            isGenerated: true,
            modifiedProps: [],
            terrainDataHash: `hash_${cx}_${cz}_${seed}`
        };

        this.saveChunk(newChunk);
        return newChunk;
    }

    /**
     * Saves or updates a ChunkNode in memory cache and localStorage.
     */
    public static saveChunk(chunk: ChunkNode): void {
        this.memoryCache.set(chunk.id, chunk);
        try {
            localStorage.setItem(`${this.STORAGE_PREFIX}${chunk.id}`, JSON.stringify(chunk));
        } catch (e) {
            console.warn(`[ChunkPersistenceManager] Storage quota exceeded or disabled:`, e);
        }
    }

    /**
     * Adds or updates a prop within a specific chunk.
     */
    public static addPropToChunk(
        cx: number,
        cz: number,
        prop: NounNode,
        regionId: string = 'astra_lab',
        seed: number = 42
    ): ChunkNode {
        const chunk = this.getOrGenerateChunk(cx, cz, regionId, seed);
        const existingIndex = chunk.modifiedProps?.findIndex(p => p.id === prop.id) ?? -1;

        if (existingIndex >= 0 && chunk.modifiedProps) {
            chunk.modifiedProps[existingIndex] = prop;
        } else {
            chunk.modifiedProps = [...(chunk.modifiedProps || []), prop];
        }

        this.saveChunk(chunk);
        return chunk;
    }

    /**
     * Fetches active surrounding chunks (e.g. 3x3 grid around player).
     */
    public static getSurroundingChunks(
        playerX: number,
        playerZ: number,
        radiusChunks: number = 1,
        regionId: string = 'astra_lab',
        seed: number = 42
    ): ChunkNode[] {
        const { cx, cz } = this.getChunkCoords(playerX, playerZ);
        const chunks: ChunkNode[] = [];

        for (let dx = -radiusChunks; dx <= radiusChunks; dx++) {
            for (let dz = -radiusChunks; dz <= radiusChunks; dz++) {
                chunks.push(this.getOrGenerateChunk(cx + dx, cz + dz, regionId, seed));
            }
        }

        return chunks;
    }
}
