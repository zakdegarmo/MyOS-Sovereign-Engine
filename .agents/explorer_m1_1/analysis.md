# Spatial DDL & SQLite Schema Architecture Analysis

## 1. Executive Summary
This analysis details the architectural foundation for Milestone 1: **Spatial Memory Anchoring Subsystem** of the Symbiorithmic Deep Dive project. The primary objective is establishing a 1-to-1 spatial ontology mapping between the 3D WebGL canvas space `[X, Y, Z]` and the SQLite vector store `data/myos_vector_store.db`.

We analyze the existing SQLite vector store (`data/myos_vector_store.db`), define the formal SQL DDL for `spatial_memory_nodes`, detail the binary 32-bit float vector packing/unpacking specification for 1024-dimensional `mxbai-embed-large` embeddings in both TypeScript and Python, outline a high-performance 3-stage spatial query pipeline, and provide a comprehensive project initialization plan for `teamwork_projects/symbiorithmic_deep_dive`.

---

## 2. Analysis of Existing SQLite Vector Infrastructure

### 2.1 Existing Database Inspection
- **Database File Location**: `data/myos_vector_store.db` (generated from legacy 2.88 GB JSON `data/myos_vector_store.json`).
- **Existing Table Schema** (`vectors`):
  ```sql
  CREATE TABLE IF NOT EXISTS vectors (
      id TEXT PRIMARY KEY,
      type TEXT,
      timestamp TEXT,
      text TEXT,
      embedding BLOB
  );
  CREATE INDEX IF NOT EXISTS idx_type ON vectors(type);
  CREATE INDEX IF NOT EXISTS idx_timestamp ON vectors(timestamp);
  ```
- **Existing Scripts Examined**:
  1. `scripts/migrate_vector_store.py`: Performs batch insertion from JSON into SQLite using `ijson` and Python `struct.pack(f'{len(embedding)}f', *embedding)`.
  2. `scripts/detective.py`: Digital Detective crawler that generates film-noir case notes using local Ollama (`gemma4:latest`) and embeds text via `mxbai-embed-large:latest` (1024 dimensions), storing binary float BLOBs in SQLite. Includes an offline deterministic fallback vector generator.
  3. `scripts/test_sqlite_vector_store.py`: Verifies SQLite vector store contents by reading `embedding` BLOBs and unpacking floats using `struct.unpack(f'{num_floats}f', embedding_blob)`.
  4. `scripts/extract_vector_metadata.py`: Extracts vector metadata from JSON store.

### 2.2 Vector Storage & Binary Packing Format Observations
- **Float Format**: IEEE 754 single-precision 32-bit floating point numbers (4 bytes per float).
- **Dimension Count**: 1024 dimensions (`mxbai-embed-large`).
- **BLOB Size**: $1024 \times 4 \text{ bytes} = 4096 \text{ bytes}$ per embedding BLOB.
- **Byte Order**: Little-endian (`<f` in C/Python struct format), matching standard x86_64 and ARM64 architecture natively.
- **Performance Characteristics**: Direct binary BLOB storage avoids text serialization overhead (JSON arrays of 1024 floats take ~15-20 KB of text vs 4.096 KB binary).

---

## 3. SQLite DDL Architecture: `spatial_memory_nodes`

### 3.1 DDL Table Specification
To extend `data/myos_vector_store.db` with spatial capabilities while maintaining compatibility with the existing `vectors` table, we define the `spatial_memory_nodes` table DDL:

```sql
-- Table Definition for Spatial Memory Nodes
CREATE TABLE IF NOT EXISTS spatial_memory_nodes (
    id TEXT PRIMARY KEY,
    x REAL NOT NULL,
    y REAL NOT NULL,
    z REAL NOT NULL,
    radius_influence REAL NOT NULL DEFAULT 10.0,
    region_id TEXT NOT NULL,
    type TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    title TEXT NOT NULL,
    text TEXT NOT NULL,
    tags TEXT NOT NULL,
    embedding BLOB NOT NULL
);

-- Spatial and Categorical Indexes
CREATE INDEX IF NOT EXISTS idx_spatial_xyz ON spatial_memory_nodes(x, y, z);
CREATE INDEX IF NOT EXISTS idx_spatial_region ON spatial_memory_nodes(region_id);
CREATE INDEX IF NOT EXISTS idx_spatial_type ON spatial_memory_nodes(type);
CREATE INDEX IF NOT EXISTS idx_spatial_timestamp ON spatial_memory_nodes(timestamp);
```

### 3.2 Column Schema Definitions
| Column Name | SQLite Type | Constraints | Description |
|-------------|-------------|-------------|-------------|
| `id` | `TEXT` | `PRIMARY KEY` | Unique spatial node ID (e.g. `spat_a1b2c3d4e5f6`) |
| `x` | `REAL` | `NOT NULL` | 3D X coordinate in WebGL canvas space |
| `y` | `REAL` | `NOT NULL` | 3D Y coordinate in WebGL canvas space |
| `z` | `REAL` | `NOT NULL` | 3D Z coordinate in WebGL canvas space |
| `radius_influence` | `REAL` | `NOT NULL DEFAULT 10.0` | Effective influence radius $r_{inf}$ in canvas units |
| `region_id` | `TEXT` | `NOT NULL` | Logical geographic region (e.g. `'waterdeep_central'`, `'underdark_cavern'`) |
| `type` | `TEXT` | `NOT NULL` | Memory classification (`'lore'`, `'agent_log'`, `'quest_state'`, `'event_mutation'`) |
| `timestamp` | `TEXT` | `NOT NULL` | ISO 8601 UTC timestamp string (`YYYY-MM-DDTHH:mm:ssZ`) |
| `title` | `TEXT` | `NOT NULL` | Short summary title of the spatial node |
| `text` | `TEXT` | `NOT NULL` | Complete text body / lore snippet |
| `tags` | `TEXT` | `NOT NULL` | JSON-encoded string array (e.g. `'["ancient_battlefield","ruins"]'`) |
| `embedding` | `BLOB` | `NOT NULL` | 32-bit float BLOB (4096 bytes for 1024 dimensions) |

---

## 4. 3-Stage Spatial Radius Query Engine Architecture

To perform real-time, low-latency ($< 5\text{ms}$) queries over thousands of spatial memory nodes, the retrieval engine follows a 3-stage cascade:

```
WebGL Player Position [X, Y, Z] + Radius R
                     │
                     ▼
┌────────────────────────────────────────────────────────┐
│ STAGE 1: 3D Bounding Box SQL Pre-Filter               │
│ Executed directly in SQLite via B-tree index          │
│ WHERE x BETWEEN (X-R_max) AND (X+R_max)              │
│   AND y BETWEEN (Y-R_max) AND (Y+R_max)              │
│   AND z BETWEEN (Z-R_max) AND (Z+R_max)              │
└────────────────────────┬───────────────────────────────┘
                         │ Candidates (< 5% of total nodes)
                         ▼
┌────────────────────────────────────────────────────────┐
│ STAGE 2: 3D Euclidean Distance Radius Filter          │
│ Calculate D = sqrt((x-X)^2 + (y-Y)^2 + (z-Z)^2)       │
│ Keep if D <= max(R, radius_influence)                 │
└────────────────────────┬───────────────────────────────┘
                         │ Near-Field Nodes
                         ▼
┌────────────────────────────────────────────────────────┐
│ STAGE 3: Cosine Similarity Reranking                  │
│ Unpack 1024-dim Float32 BLOB                          │
│ Calculate CosineSim(queryVector, nodeVector)          │
│ Filter by minSimilarity threshold & apply limit        │
└────────────────────────┬───────────────────────────────┘
                         │
                         ▼
             Sorted SpatialMemoryNode[]
```

1. **Stage 1 (SQL Bounding Box Pre-Filter)**: Uses $R_{max} = \text{query.radius} + \text{max\_influence\_radius}$ to perform range comparison in SQL using index `idx_spatial_xyz`.
2. **Stage 2 (Euclidean Radius Filter)**: Checks 3D sphere overlap $D \le \max(\text{query.radius}, r_{inf})$.
3. **Stage 3 (Cosine Reranking)**: Performs float vector dot product and norm normalization to rank relevant lore snippets for agent prompt injection.

---

## 5. Binary Float Vector Packing/Unpacking Utilities Design

### 5.1 TypeScript Implementation (`src/spatial/SpatialMath.ts`)

```typescript
/**
 * Utility functions for binary float packing/unpacking and 3D spatial calculations.
 */

export const EMBEDDING_DIMENSION = 1024;
export const FLOAT32_BYTES = 4;
export const EXPECTED_BLOB_SIZE = EMBEDDING_DIMENSION * FLOAT32_BYTES; // 4096 bytes

/**
 * Pack array of numbers or Float32Array into binary Uint8Array BLOB for SQLite insertion.
 */
export function packFloat32Vector(vector: number[] | Float32Array): Uint8Array {
  const float32 = vector instanceof Float32Array ? vector : new Float32Array(vector);
  return new Uint8Array(float32.buffer, float32.byteOffset, float32.byteLength);
}

/**
 * Unpack SQLite binary BLOB (Buffer / Uint8Array) into Float32Array.
 */
export function unpackFloat32Vector(buffer: Uint8Array | Buffer | ArrayBuffer): Float32Array {
  let uint8: Uint8Array;
  if (buffer instanceof Uint8Array) {
    uint8 = buffer;
  } else if (Buffer.isBuffer(buffer)) {
    uint8 = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  } else {
    uint8 = new Uint8Array(buffer);
  }

  // Create isolated ArrayBuffer slice to ensure 4-byte Float32Array alignment
  const alignedBuffer = uint8.buffer.slice(
    uint8.byteOffset,
    uint8.byteOffset + uint8.byteLength
  );
  return new Float32Array(alignedBuffer);
}

/**
 * Compute 3D Euclidean Distance between two points [x1, y1, z1] and [x2, y2, z2].
 */
export function euclideanDistance3D(
  p1: [number, number, number],
  p2: [number, number, number]
): number {
  const dx = p1[0] - p2[0];
  const dy = p1[1] - p2[1];
  const dz = p1[2] - p2[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Compute Cosine Similarity between two float vectors.
 */
export function cosineSimilarity(
  v1: Float32Array | number[],
  v2: Float32Array | number[]
): number {
  if (v1.length !== v2.length) {
    throw new Error(`Vector dimension mismatch: ${v1.length} vs ${v2.length}`);
  }
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < v1.length; i++) {
    const a = v1[i];
    const b = v2[i];
    dotProduct += a * b;
    normA += a * a;
    normB += b * b;
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Generates a deterministic pseudo-random float vector when Ollama embedding service is offline.
 */
export function generateDeterministicFallbackEmbedding(text: string, dimension: number = EMBEDDING_DIMENSION): Float32Array {
  const vec = new Float32Array(dimension);
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  
  for (let i = 0; i < dimension; i++) {
    const pseudoVal = (Math.sin(hash + i * 1.013) * 10000) % 1;
    vec[i] = pseudoVal * 0.1; // Small scale vector values
  }
  return vec;
}
```

### 5.2 Python Implementation (`scripts/spatial_math.py`)

```python
import struct
import math
import hashlib

EMBEDDING_DIMENSION = 1024

def pack_float32_vector(floats: list[float]) -> bytes:
    """Packs a list of floats into a binary IEEE 754 32-bit float byte string."""
    return struct.pack(f"{len(floats)}f", *floats)

def unpack_float32_vector(blob: bytes) -> list[float]:
    """Unpacks a binary IEEE 754 32-bit float BLOB into a list of python floats."""
    num_floats = len(blob) // 4
    return list(struct.unpack(f"{num_floats}f", blob))

def euclidean_distance_3d(p1: tuple[float, float, float], p2: tuple[float, float, float]) -> float:
    """Calculates Euclidean distance in 3D canvas space."""
    return math.sqrt((p1[0] - p2[0])**2 + (p1[1] - p2[1])**2 + (p1[2] - p2[2])**2)

def cosine_similarity(v1: list[float], v2: list[float]) -> float:
    """Calculates cosine similarity between two float vectors."""
    if len(v1) != len(v2):
        raise ValueError(f"Dimension mismatch: {len(v1)} vs {len(v2)}")
    dot_product = sum(a * b for a, b in zip(v1, v2))
    norm_a = math.sqrt(sum(a * a for a in v1))
    norm_b = math.sqrt(sum(b * b for b in v2))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot_product / (norm_a * norm_b)

def generate_fallback_embedding(text: str, dimension: int = EMBEDDING_DIMENSION) -> list[float]:
    """Generates deterministic pseudo-random float vector for offline execution."""
    seed_hash = hashlib.md5(text.encode("utf-8")).hexdigest()
    seed = int(seed_hash, 16)
    return [
        ((((seed + i * 1013) % 10007) / 10007.0) * 2.0 - 1.0) * 0.05
        for i in range(dimension)
    ]
```

---

## 6. Implementation Plan for Project Directory Initialization

To establish the `teamwork_projects/symbiorithmic_deep_dive` workspace, the following directory structure and core files will be initialized:

### 6.1 Directory Tree
```
teamwork_projects/symbiorithmic_deep_dive/
├── PROJECT.md
├── package.json
├── tsconfig.json
├── src/
│   └── spatial/
│       ├── SpatialVectorStoreManager.ts
│       ├── SpatialMath.ts
│       └── types.ts
└── scripts/
    └── init_spatial_db.py
```

### 6.2 Target `package.json` Design
```json
{
  "name": "@myos/symbiorithmic-deep-dive",
  "version": "1.0.0",
  "description": "1-to-1 Spatial Ontology Mapping Subsystem for MyOS WebGL and SQLite Vector Store",
  "type": "module",
  "main": "dist/spatial/SpatialVectorStoreManager.js",
  "types": "dist/spatial/types.d.ts",
  "scripts": {
    "build": "tsc",
    "init-db": "python scripts/init_spatial_db.py",
    "test": "node --import ts-node/register/esm tests/e2e-runner.mjs"
  },
  "dependencies": {
    "better-sqlite3": "^11.8.0"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.12",
    "@types/node": "^22.0.0",
    "ts-node": "^10.9.2",
    "typescript": "^5.7.0"
  }
}
```

### 6.3 Target `tsconfig.json` Design
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true
  },
  "include": ["src/**/*"]
}
```

### 6.4 Target `src/spatial/types.ts` Specification
```typescript
export interface SpatialMemoryNode {
  id: string;
  x: number;
  y: number;
  z: number;
  radius_influence: number;
  region_id: string;
  type: 'lore' | 'agent_log' | 'quest_state' | 'event_mutation' | string;
  timestamp: string;
  title: string;
  text: string;
  tags: string[];
  embedding: Float32Array | number[];
}

export interface SpatialQueryParams {
  position: [number, number, number];
  radius: number;
  limit?: number;
  queryText?: string;
  minSimilarity?: number;
}

export interface SpatialVectorStoreManager {
  initDatabase(): Promise<void>;
  querySpatialMemories(params: SpatialQueryParams): Promise<SpatialMemoryNode[]>;
  insertSpatialMemory(node: Omit<SpatialMemoryNode, 'id' | 'timestamp'>): Promise<string>;
}
```

---

## 7. Next Steps & Handoff Recommendation
Implementer M1 can immediately proceed with creating `package.json`, `tsconfig.json`, `src/spatial/types.ts`, `src/spatial/SpatialMath.ts`, `src/spatial/SpatialVectorStoreManager.ts`, and running `init_spatial_db.py` to create `spatial_memory_nodes` table in `data/myos_vector_store.db`.
