## 2026-08-06T20:17:38Z

You are worker_symbio_m1_1, a teamwork_preview_worker agent working on Milestone 1 (Spatial Memory Anchoring Subsystem) for the Symbiorithmic Deep Dive project.

Working Directory: c:\Users\zakde\Desktop\AntiGravity projects\MyOS\.agents\worker_symbio_m1_1
Target Project Directory: c:\Users\zakde\Desktop\AntiGravity projects\MyOS\teamwork_projects\symbiorithmic_deep_dive
Original Request: c:\Users\zakde\Desktop\AntiGravity projects\MyOS\.agents\ORIGINAL_REQUEST.md
Scope Document: c:\Users\zakde\Desktop\AntiGravity projects\MyOS\teamwork_projects\symbiorithmic_deep_dive\PROJECT.md

Your Objective:
Implement Milestone 1 (Spatial Memory Anchoring Subsystem) in `c:\Users\zakde\Desktop\AntiGravity projects\MyOS\teamwork_projects\symbiorithmic_deep_dive`:

1. `src/spatial/types.ts`:
   Define TypeScript interfaces:
   - `SpatialMemoryNode`: id, x, y, z, radius_influence, region_id, type, timestamp, title, text, tags (string[]), embedding (Float32Array | number[]).
   - `SpatialQueryParams`: position [number, number, number], radius number, limit? number, queryText? string, minSimilarity? number.
   - `SpatialVectorStoreManager`: interface defining `initDatabase(): Promise<void>`, `querySpatialMemories(params: SpatialQueryParams): Promise<SpatialMemoryNode[]>`, `insertSpatialMemory(node: Omit<SpatialMemoryNode, 'id' | 'timestamp'>): Promise<string>`.

2. `src/spatial/SpatialMath.ts`:
   Implement spatial mathematical utilities:
   - `euclideanDistance3D(p1: [number, number, number], p2: [number, number, number]): number`
   - `calculateBoundingBox(center: [number, number, number], radius: number): { minX: number, maxX: number, minY: number, maxY: number, minZ: number, maxZ: number }`
   - `cosineSimilarity(v1: Float32Array | number[], v2: Float32Array | number[]): number`
   - `packEmbedding(embedding: number[] | Float32Array): Buffer` and `unpackEmbedding(buffer: Buffer): Float32Array`

3. `src/spatial/SpatialVectorStoreManager.ts`:
   Implement `SpatialVectorStoreManager` class:
   - DDL creation for SQLite table `spatial_memory_nodes`:
     `CREATE TABLE IF NOT EXISTS spatial_memory_nodes (id TEXT PRIMARY KEY, x REAL, y REAL, z REAL, radius_influence REAL, region_id TEXT, type TEXT, timestamp TEXT, title TEXT, text TEXT, tags TEXT, embedding BLOB)`
   - 3-stage query engine:
     Stage 1: 3D Bounding Box SQL pre-filter (WHERE x BETWEEN minX AND maxX AND y BETWEEN minY AND maxY AND z BETWEEN minZ AND maxZ).
     Stage 2: 3D Euclidean distance filter ($D \le \max(\text{radius}, r_{\text{influence}})$).
     Stage 3: Cosine similarity vector reranking (if query embedding or text embedding provided).
   - Node insertion method: generates UUID/id, timestamp, serializes tags as JSON string, packs float vector embedding into BLOB.

4. `tests/spatial.test.ts` (or `tests/unit/spatial.test.ts`):
   Create a comprehensive unit test suite using node:test, vitest, jest, or standalone node script (`node --test` or `npx tsx`) verifying:
   - DDL initialization
   - Inserting spatial memory nodes
   - Stage 1 Bounding box pre-filter
   - Stage 2 Euclidean distance radius filtering
   - Stage 3 Cosine similarity reranking
   - Packing/unpacking float vector embeddings.
