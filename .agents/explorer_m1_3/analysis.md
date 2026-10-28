# Architectural Analysis: Spatial Memory Anchoring Subsystem & WebGL Canvas Integration

**Milestone**: Milestone 1 — Spatial Memory Anchoring Subsystem  
**Agent**: Explorer M1_3 (`explorer_m1_3`)  
**Working Directory**: `c:\Users\zakde\Desktop\AntiGravity projects\MyOS\.agents\explorer_m1_3`  
**Date**: 2026-08-05  

---

## Executive Summary

This report provides the complete architectural design and integration specification for the **Spatial Memory Anchoring Subsystem** (`SpatialVectorStoreManager.ts`) and its real-time binding to the 3D WebGL Canvas (`AstraLabWorld.tsx`) and persistent world state (`usePersistentWorldStore.ts`). 

The core breakthrough of this subsystem is establishing a **1-to-1 Spatial Ontology Mapping** between 3D canvas coordinates $[X, Y, Z]$ in the WebGL world (such as Faerûn / AstraLab sandbox) and semantic vector lore nodes stored inside the SQLite database (`data/myos_vector_store.db`). 

Key architectural components designed in this specification:
1. **`SpatialVectorStoreManager` Class**: Handles SQLite WAL database initialization, schema verification, 3-stage query execution, node insertion/embedding generation, and markdown prompt context formatting.
2. **3-Stage Spatial Query Algorithm**: Combines (1) 3D Bounding Box SQL pre-filter, (2) 3D Euclidean distance filtering ($d \le \max(R_{query}, r_{inf})$), and (3) Cosine similarity vector reranking (using `mxbai-embed-large` 1024-dim float vectors).
3. **Deterministic Offline Vector Fallback**: Ensures robust execution without external API dependencies.
4. **WebGL Real-Time Spatial Binding**: Leverages a hysteresis-based spatial hook (`useSpatialMemory`) integrated with `AstraLabWorld.tsx` and `usePersistentWorldStore.ts`, keeping agent context synchronized with 3D player movement without frame rate degradation.

---

## 1. Subsystem Architecture & File Layout

The Spatial Memory Anchoring Subsystem resides in `teamwork_projects/symbiorithmic_deep_dive/src/spatial/` as specified in `PROJECT.md`:

```
teamwork_projects/symbiorithmic_deep_dive/
├── PROJECT.md
├── package.json
├── tsconfig.json
├── src/
│   ├── spatial/
│   │   ├── SpatialVectorStoreManager.ts   # Core database & vector query engine
│   │   ├── SpatialMath.ts                 # 3D Bounding Box, Euclidean & Cosine distance math
│   │   ├── SpatialPromptFormatter.ts      # Markdown prompt framing for AI Swarm
│   │   └── types.ts                       # TypeScript interfaces & data schemas
```

---

## 2. Core Interface Contracts & Data Types (`types.ts`)

```typescript
/**
 * Represents a single spatial memory node stored in SQLite.
 */
export interface SpatialMemoryNode {
    id: string;                      // Unique UUID
    x: number;                       // 3D X coordinate
    y: number;                       // 3D Y coordinate
    z: number;                       // 3D Z coordinate
    radius_influence: number;        // Spatial influence radius in meters/world units
    region_id: string;               // Region identifier (e.g. 'waterdeep', 'underdark', 'baldurs_gate')
    type: 'lore' | 'quest' | 'log' | 'event'; // Type classification
    timestamp: string;               // ISO 8601 timestamp string
    title: string;                   // Short descriptive title
    text: string;                    // Detailed memory text / lore content
    tags: string[];                  // Semantic tags (e.g. ['ancient_battlefield', 'boss_defeat'])
    embedding: Float32Array | number[]; // 1024-dim packed float vector (mxbai-embed-large)
}

/**
 * Parameters for executing 3-stage spatial memory queries.
 */
export interface SpatialQueryParams {
    position: [number, number, number]; // Player/camera target position [X, Y, Z]
    radius: number;                      // Query radius in meters
    limit?: number;                      // Maximum number of results to return (default: 10)
    queryText?: string;                  // Optional semantic text query for vector similarity reranking
    minSimilarity?: number;              // Minimum cosine similarity threshold (0.0 to 1.0)
    typeFilter?: string[];               // Optional filter by memory node types
    regionId?: string;                   // Optional strict region ID match
}

/**
 * Spatial query result containing proximity metrics.
 */
export interface SpatialQueryResult extends SpatialMemoryNode {
    distance: number;                   // Calculated 3D Euclidean distance to position
    similarity?: number;                // Calculated cosine similarity score (if queryText provided)
    relevanceScore: number;             // Composite ranking score (0.0 to 1.0)
}
```

---

## 3. `SpatialVectorStoreManager.ts` Detailed Class Architecture

### 3.1 SQLite Schema & Database Initialization (`initDatabase`)

The database connection uses `better-sqlite3` (or node's built-in SQLite binding). WAL mode and synchronous settings are configured for high-concurrency read/write operations during WebGL gameplay.

```typescript
import Database from 'better-sqlite3';
import { SpatialMemoryNode, SpatialQueryParams, SpatialQueryResult } from './types';
import { calculateEuclideanDistance3D, calculateBoundingBox3D, cosineSimilarity } from './SpatialMath';

export class SpatialVectorStoreManager {
    private db: Database.Database;
    private dbPath: string;

    constructor(dbPath: string = 'data/myos_vector_store.db') {
        this.dbPath = dbPath;
    }

    /**
     * Initializes SQLite connection, enables WAL mode, executes DDL, and verifies tables.
     */
    public async initDatabase(): Promise<void> {
        // Open database
        this.db = new Database(this.dbPath);

        // 1. Enable WAL mode for high concurrency
        this.db.pragma('journal_mode = WAL');
        this.db.pragma('synchronous = NORMAL');
        this.db.pragma('foreign_keys = ON');

        // 2. Execute DDL for spatial_memory_nodes
        const ddl = `
            CREATE TABLE IF NOT EXISTS spatial_memory_nodes (
                id TEXT PRIMARY KEY,
                x REAL NOT NULL,
                y REAL NOT NULL,
                z REAL NOT NULL,
                radius_influence REAL NOT NULL DEFAULT 50.0,
                region_id TEXT NOT NULL,
                type TEXT NOT NULL DEFAULT 'lore',
                timestamp TEXT NOT NULL,
                title TEXT NOT NULL,
                text TEXT NOT NULL,
                tags TEXT NOT NULL,
                embedding BLOB NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_spatial_xyz ON spatial_memory_nodes(x, y, z);
            CREATE INDEX IF NOT EXISTS idx_spatial_region ON spatial_memory_nodes(region_id);
            CREATE INDEX IF NOT EXISTS idx_spatial_type ON spatial_memory_nodes(type);
        `;

        this.db.exec(ddl);

        // 3. Verify Table Integrity
        const stmt = this.db.prepare(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='spatial_memory_nodes'"
        );
        const result = stmt.get();
        if (!result) {
            throw new Error("Failed to verify spatial_memory_nodes table creation.");
        }
    }
```

---

### 3.2 3-Stage Spatial Query Execution Engine (`querySpatialMemories`)

```typescript
    /**
     * Executes 3-stage spatial query:
     * Stage 1: 3D Bounding Box SQL Pre-Filter
     * Stage 2: 3D Euclidean Distance & Region Filter
     * Stage 3: Cosine Similarity Vector Reranking
     */
    public async querySpatialMemories(params: SpatialQueryParams): Promise<SpatialQueryResult[]> {
        const [px, py, pz] = params.position;
        const radius = params.radius;
        const limit = params.limit || 10;
        const minSimilarity = params.minSimilarity || 0.0;

        // --- STAGE 1: 3D Bounding Box SQL Pre-Filter ---
        const bbox = calculateBoundingBox3D(px, py, pz, radius);
        
        let querySql = `
            SELECT id, x, y, z, radius_influence, region_id, type, timestamp, title, text, tags, embedding
            FROM spatial_memory_nodes
            WHERE x BETWEEN ? AND ?
              AND y BETWEEN ? AND ?
              AND z BETWEEN ? AND ?
        `;
        const sqlArgs: any[] = [bbox.minX, bbox.maxX, bbox.minY, bbox.maxY, bbox.minZ, bbox.maxZ];

        if (params.regionId) {
            querySql += ` AND region_id = ?`;
            sqlArgs.push(params.regionId);
        }

        const rows = this.db.prepare(querySql).all(...sqlArgs) as any[];

        // --- STAGE 2: 3D Euclidean Distance & Radius Influence Filter ---
        const candidates: SpatialQueryResult[] = [];

        for (const row of rows) {
            const dist = calculateEuclideanDistance3D(px, py, pz, row.x, row.y, row.z);
            const maxEffectiveRadius = Math.max(radius, row.radius_influence);

            if (dist <= maxEffectiveRadius) {
                // Deserialize tags JSON
                const tags: string[] = JSON.parse(row.tags || '[]');
                
                // Deserialize Float32Array embedding from BLOB
                const buffer = row.embedding as Buffer;
                const embedding = new Float32Array(
                    buffer.buffer,
                    buffer.byteOffset,
                    buffer.byteLength / Float32Array.BYTES_PER_ELEMENT
                );

                // Spatial Proximity Score: 1.0 at origin, fading linearly to 0.0 at edge
                const proximityScore = Math.max(0, 1 - (dist / maxEffectiveRadius));

                candidates.push({
                    id: row.id,
                    x: row.x,
                    y: row.y,
                    z: row.z,
                    radius_influence: row.radius_influence,
                    region_id: row.region_id,
                    type: row.type,
                    timestamp: row.timestamp,
                    title: row.title,
                    text: row.text,
                    tags,
                    embedding,
                    distance: dist,
                    relevanceScore: proximityScore
                });
            }
        }

        // --- STAGE 3: Cosine Similarity Vector Reranking ---
        if (params.queryText && params.queryText.trim().length > 0) {
            const queryVector = await this.generateEmbedding(params.queryText);
            
            for (const candidate of candidates) {
                const sim = cosineSimilarity(queryVector, candidate.embedding);
                candidate.similarity = sim;
                // Composite relevance: 60% vector similarity + 40% spatial proximity
                candidate.relevanceScore = (sim * 0.6) + (candidate.relevanceScore * 0.4);
            }

            // Filter by minSimilarity if specified
            const filtered = candidates.filter(c => (c.similarity || 0) >= minSimilarity);

            // Sort descending by composite relevanceScore
            filtered.sort((a, b) => b.relevanceScore - a.relevanceScore);
            return filtered.slice(0, limit);
        } else {
            // Pure spatial distance sorting (closest first)
            candidates.sort((a, b) => a.distance - b.distance);
            return candidates.slice(0, limit);
        }
    }
```

---

### 3.3 Node Serialization & Vector Embedding (`insertSpatialMemory`)

```typescript
    /**
     * Serializes node, generates 1024-dim embedding, and executes SQLite INSERT.
     */
    public async insertSpatialMemory(
        node: Omit<SpatialMemoryNode, 'id' | 'timestamp'> & { id?: string; timestamp?: string }
    ): Promise<string> {
        const id = node.id || crypto.randomUUID();
        const timestamp = node.timestamp || new Date().toISOString();

        // Generate embedding if not supplied
        let embeddingVector: Float32Array | number[];
        if (node.embedding && node.embedding.length === 1024) {
            embeddingVector = node.embedding;
        } else {
            embeddingVector = await this.generateEmbedding(`${node.title}: ${node.text}`);
        }

        // Convert Float32Array to Buffer BLOB
        const floatArray = new Float32Array(embeddingVector);
        const blobBuffer = Buffer.from(floatArray.buffer);

        // Serialize tags array to JSON
        const tagsJson = JSON.stringify(node.tags || []);

        const insertStmt = this.db.prepare(`
            INSERT INTO spatial_memory_nodes (
                id, x, y, z, radius_influence, region_id, type, timestamp, title, text, tags, embedding
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        insertStmt.run(
            id,
            node.x,
            node.y,
            node.z,
            node.radius_influence || 50.0,
            node.region_id,
            node.type || 'lore',
            timestamp,
            node.title,
            node.text,
            tagsJson,
            blobBuffer
        );

        return id;
    }

    /**
     * Generates a 1024-dim vector embedding.
     * Tries local Ollama API (mxbai-embed-large); falls back to deterministic vector generator if offline.
     */
    public async generateEmbedding(text: string): Promise<Float32Array> {
        try {
            const res = await fetch('http://localhost:11434/api/embeddings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'mxbai-embed-large',
                    prompt: text
                })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.embedding && data.embedding.length === 1024) {
                    return new Float32Array(data.embedding);
                }
            }
        } catch (e) {
            // Ollama offline fallback
        }

        return this.generateDeterministicFallbackEmbedding(text);
    }

    /**
     * Deterministic Float32Array fallback generator (1024 dimensions) for offline/test environments.
     */
    private generateDeterministicFallbackEmbedding(text: string): Float32Array {
        const vec = new Float32Array(1024);
        let hash = 0x811c9dc5;
        for (let i = 0; i < text.length; i++) {
            hash ^= text.charCodeAt(i);
            hash = Math.imul(hash, 0x01000193);
        }

        let normSq = 0;
        for (let i = 0; i < 1024; i++) {
            hash = Math.imul(hash ^ (i + 1), 0x01000193);
            const val = (hash & 0xffff) / 65535.0 - 0.5;
            vec[i] = val;
            normSq += val * val;
        }

        // L2 Normalize
        const norm = Math.sqrt(normSq) || 1.0;
        for (let i = 0; i < 1024; i++) {
            vec[i] /= norm;
        }

        return vec;
    }
```

---

### 3.4 Structured Markdown Prompt Context Formatting (`formatMemoriesForPrompt`)

```typescript
    /**
     * Formats spatial memories into structured markdown prompt contexts for AI Swarm agents.
     */
    public formatMemoriesForPrompt(memories: SpatialQueryResult[], currentPos?: [number, number, number]): string {
        if (!memories || memories.length === 0) {
            return `### 📍 SPATIAL VECTOR LORE & REGIONAL MEMORIES\n*No historical lore or vector memories active in immediate radius.*`;
        }

        let md = `### 📍 SPATIAL VECTOR LORE & REGIONAL MEMORIES\n`;
        if (currentPos) {
            md += `*Current 3D Coordinates: [X: ${currentPos[0].toFixed(1)}, Y: ${currentPos[1].toFixed(1)}, Z: ${currentPos[2].toFixed(1)}]*\n\n`;
        }

        memories.forEach((mem, index) => {
            const tagsFormatted = mem.tags.map(t => `#${t}`).join(' ');
            const distanceStr = mem.distance !== undefined ? `${mem.distance.toFixed(1)}m away` : 'Active';
            
            md += `#### ${index + 1}. ${mem.title} (${mem.region_id.toUpperCase()})\n`;
            md += `- **Type**: \`${mem.type.toUpperCase()}\` | **Distance**: ${distanceStr} | **Influence**: ${mem.radius_influence}m\n`;
            md += `- **Location**: [X: ${mem.x.toFixed(1)}, Y: ${mem.y.toFixed(1)}, Z: ${mem.z.toFixed(1)}]\n`;
            md += `- **Tags**: ${tagsFormatted}\n`;
            md += `- **Lore Content**:\n> "${mem.text}"\n\n`;
        });

        md += `---\n*INSTRUCTION FOR AGENTS: Use the spatial vector lore above to drive region-aware narrative responses, tactical decisions, and atmospheric reactions.*`;

        return md;
    }
```

---

## 4. Spatial Proximity & Vector Math Engine (`SpatialMath.ts`)

To ensure clean separation of concerns and high performance during query execution, spatial bounding box calculations, 3D Euclidean distances, and cosine vector similarities are isolated in `SpatialMath.ts`:

```typescript
export interface BoundingBox3D {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    minZ: number;
    maxZ: number;
}

/**
 * Calculates 3D Bounding Box around center point (X, Y, Z) with given radius.
 */
export function calculateBoundingBox3D(x: number, y: number, z: number, radius: number): BoundingBox3D {
    return {
        minX: x - radius,
        maxX: x + radius,
        minY: y - radius,
        maxY: y + radius,
        minZ: z - radius,
        maxZ: z + radius
    };
}

/**
 * Computes 3D Euclidean Distance: sqrt((x2-x1)^2 + (y2-y1)^2 + (z2-z1)^2)
 */
export function calculateEuclideanDistance3D(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dz = z2 - z1;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Computes Cosine Similarity between two vectors: (A . B) / (||A|| * ||B||)
 */
export function cosineSimilarity(a: Float32Array | number[], b: Float32Array | number[]): number {
    if (a.length !== b.length) {
        throw new Error(`Vector length mismatch: ${a.length} vs ${b.length}`);
    }

    let dot = 0.0;
    let normA = 0.0;
    let normB = 0.0;

    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }

    if (normA === 0 || normB === 0) return 0.0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
```

---

## 5. Real-Time WebGL Canvas Context Binding Design (`AstraLabWorld.tsx` & `usePersistentWorldStore.ts`)

### 5.1 Store Extensions in `usePersistentWorldStore.ts`

To make spatial memories globally accessible to UI components, HUD overlays, and AI swarm agents, we extend `PersistentWorldState`:

```typescript
// Extended interface additions to usePersistentWorldStore.ts
export interface PersistentWorldState {
    playerPos: [number, number, number];
    playerRot: number;
    cameraZoom: number;
    agentPositions: Record<string, [number, number, number]>;
    _hasHydrated: boolean;

    // --- Spatial Vector Memory Extensions ---
    activeSpatialMemories: SpatialMemoryNode[];
    activeRegionId: string;
    activeLoreTags: string[];
    formattedSpatialPrompt: string;
    
    setPlayerPos: (pos: [number, number, number]) => void;
    setActiveSpatialMemories: (memories: SpatialMemoryNode[], formattedPrompt: string) => void;
    setActiveRegion: (regionId: string) => void;
}
```

### 5.2 Real-Time Spatial Hysteresis Hook (`useSpatialMemory`)

Executing 3D database queries on every animation frame (60 FPS) would degrade performance. We implement a **Spatial Hysteresis Engine** inside a React hook `useSpatialMemory`:

```typescript
import { useEffect, useRef } from 'react';
import { usePersistentWorldStore } from './usePersistentWorldStore';
import { SpatialVectorStoreManager } from '@symbiorithmic/spatial/SpatialVectorStoreManager';

const SPATIAL_HYSTERESIS_DISTANCE = 5.0; // Re-query only when player moves >= 5.0m
const SPATIAL_POLL_INTERVAL_MS = 2000;   // Or every 2 seconds

export function useSpatialMemoryBinding(manager: SpatialVectorStoreManager) {
    const playerPos = usePersistentWorldStore(state => state.playerPos);
    const setActiveSpatialMemories = usePersistentWorldStore(state => state.setActiveSpatialMemories);
    
    const lastQueriedPos = useRef<[number, number, number]>([Infinity, Infinity, Infinity]);
    const lastQueryTime = useRef<number>(0);

    useEffect(() => {
        const [px, py, pz] = playerPos;
        const [lx, ly, lz] = lastQueriedPos.current;
        const now = Date.now();

        // Calculate distance moved since last query
        const distMoved = Math.sqrt(
            Math.pow(px - lx, 2) + Math.pow(py - ly, 2) + Math.pow(pz - lz, 2)
        );

        // Check if movement threshold or time polling interval met
        if (distMoved >= SPATIAL_HYSTERESIS_DISTANCE || (now - lastQueryTime.current) >= SPATIAL_POLL_INTERVAL_MS) {
            lastQueriedPos.current = [px, py, pz];
            lastQueryTime.current = now;

            // Execute spatial query asynchronously
            manager.querySpatialMemories({
                position: [px, py, pz],
                radius: 100.0,
                limit: 5
            }).then(memories => {
                const formattedPrompt = manager.formatMemoriesForPrompt(memories, [px, py, pz]);
                setActiveSpatialMemories(memories, formattedPrompt);
            }).catch(err => {
                console.error("Spatial memory query error:", err);
            });
        }
    }, [playerPos, manager]);
}
```

### 5.3 WebGL Mount Integration in `AstraLabWorld.tsx`

In `AstraLabWorld.tsx`:
1. Mount the `useSpatialMemoryBinding(spatialManager)` hook inside the component.
2. Render spatial memory nodes as 3D visual beacon indicators (glowing orbs + HTML badges) directly in the 3D scene alongside static POI beacons.
3. Automatically update `ParallaxatronEngine` presets when entering regions marked by active spatial lore tags (`#ancient_battlefield` -> preset `stormy_skies`).

---

## 6. Implementation Checklist & Verification Protocol

### Verification Protocol for Implementer Agents:
1. **Unit Test Execution**:
   - Test DDL creation, WAL mode pragma, and table verification.
   - Test 3D bounding box pre-filter and Euclidean distance calculation.
   - Test cosine similarity vector ranking with 1024-dim vectors.
   - Test deterministic fallback embedding generator when offline.
   - Test markdown prompt formatting output structure.
2. **Build Validation**:
   - `npm run build` inside `teamwork_projects/symbiorithmic_deep_dive`.
