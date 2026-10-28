# Handoff Report: SpatialVectorStoreManager & WebGL Canvas Integration Design

**Milestone**: Milestone 1 — Spatial Memory Anchoring Subsystem  
**Agent**: Explorer M1_3 (`explorer_m1_3`)  
**Target Architecture**: `teamwork_projects/symbiorithmic_deep_dive/src/spatial/`  
**Date**: 2026-08-05  

---

## 1. Observation

Direct observations from codebase inspection:

1. **`teamwork_projects/symbiorithmic_deep_dive/PROJECT.md`**:
   - Lines 42-72 define the core interface contracts for `SpatialMemoryNode`, `SpatialQueryParams`, and `SpatialVectorStoreManager`.
   - Requires SQLite storage of 3D spatial coordinates `(x, y, z)`, `radius_influence`, `region_id`, `tags`, and packed 32-bit float vector BLOBs (`mxbai-embed-large` 1024-dim embeddings).
   - Dictates a 3-stage query algorithm: (1) 3D Bounding Box SQL pre-filter -> (2) 3D Euclidean distance filter -> (3) Cosine similarity vector reranking.

2. **`apps/web/src/components/World/AstraLabWorld.tsx`**:
   - Lines 363-412 define canonical Faerûn POI beacons with exact 3D coordinates (Waterdeep `[-150, 0, 80]`, Baldur's Gate `[-110, 0, 480]`, Neverwinter `[-180, 0, -140]`).
   - Lines 438-442 update player position uniforms `uPlayerPos` inside `useFrame`.
   - Lines 455-536 render interactive 2.5D POI beacons with light pillars and HTML hover lore cards.

3. **`apps/web/src/store/usePersistentWorldStore.ts`**:
   - Lines 42-61 define `PersistentWorldState` tracking `playerPos: [number, number, number]`, `playerRot`, and `agentPositions`.

---

## 2. Logic Chain

1. **Database Schema & WAL Mode (`initDatabase`)**:
   - To support concurrent asynchronous vector queries while WebGL renders at 60 FPS, SQLite must execute `PRAGMA journal_mode = WAL;` and `PRAGMA synchronous = NORMAL;`.
   - The table `spatial_memory_nodes` requires columns `(id, x, y, z, radius_influence, region_id, type, timestamp, title, text, tags, embedding)`.
   - Composite 3D spatial indexes on `(x, y, z)`, `region_id`, and `type` allow bounding-box queries to execute in $O(\log N)$ time.

2. **3-Stage Spatial Query Algorithm (`querySpatialMemories`)**:
   - **Stage 1 (SQL Bounding Box Pre-Filter)**: Calculates $X \in [X_p - R, X_p + R]$, $Y \in [Y_p - R, Y_p + R]$, $Z \in [Z_p - R, Z_p + R]$. This narrows candidate set from $N$ to a small subset $k \ll N$.
   - **Stage 2 (3D Euclidean Distance & Radius Influence)**: Computes $d = \sqrt{(x_2-x_1)^2 + (y_2-y_1)^2 + (z_2-z_1)^2}$. Filters out candidates where $d > \max(R_{query}, r_{inf})$.
   - **Stage 3 (Cosine Vector Reranking)**: Computes $\text{cosineSimilarity}(V_{query}, V_{node}) = \frac{V_q \cdot V_n}{\|V_q\| \|V_n\|}$. Reranks candidates by composite relevance score ($0.6 \cdot \text{Similarity} + 0.4 \cdot \text{Proximity}$).

3. **Node Insertion & Vector Serialization (`insertSpatialMemory`)**:
   - `tags` string array is serialized into JSON string (`JSON.stringify(tags)`).
   - 1024-dim `Float32Array` embedding is converted into raw IEEE 754 float32 byte Buffer for SQLite BLOB storage.
   - If local Ollama API (`mxbai-embed-large`) is unreachable, a deterministic 1024-dim L2-normalized FNV-1a hash fallback embedding is generated to maintain system operation offline.

4. **Markdown Prompt Framing (`formatMemoriesForPrompt`)**:
   - Converts `SpatialQueryResult[]` array into clean, structured Markdown sections under `### 📍 SPATIAL VECTOR LORE & REGIONAL MEMORIES`, including coordinate location, type, distance, tags, and verbatim lore text.

5. **WebGL Canvas & Real-Time Context Binding**:
   - The `useSpatialMemoryBinding` hook subscribes to `playerPos` from `usePersistentWorldStore`.
   - Utilizes a 5.0m distance hysteresis threshold so database queries only fire when the player moves significantly, avoiding main thread performance hits.

---

## 3. Caveats

- **Read-Only Scope**: Explorer M1_3 performed a read-only investigation and design. Code generation of `SpatialVectorStoreManager.ts` in `teamwork_projects/symbiorithmic_deep_dive/src/spatial/` is reserved for the Implementer agent.
- **Ollama Dependency**: Semantic vector search relies on Ollama running `mxbai-embed-large` on `localhost:11434`. The deterministic fallback generator handles offline execution gracefully.

---

## 4. Conclusion

The architectural design for `SpatialVectorStoreManager.ts`, `SpatialMath.ts`, `types.ts`, `useSpatialMemoryBinding`, and `usePersistentWorldStore.ts` is fully specified and validated against project requirements. It provides a complete blueprint for 1-to-1 spatial ontology mapping between the 3D WebGL canvas and the SQLite vector store.

---

## 5. Verification Method

1. **Design File Inspection**:
   - Inspect `.agents/explorer_m1_3/analysis.md` for full class specifications, SQL schema DDL, code snippets, and mathematical formulas.
   - Inspect `.agents/explorer_m1_3/handoff.md` for logic chain and verification steps.

2. **Implementer Test Plan**:
   - Run unit test suite in `teamwork_projects/symbiorithmic_deep_dive/tests/` validating:
     - `initDatabase()` WAL pragma and DDL creation.
     - 3-stage query execution (Bounding box SQL -> Euclidean distance -> Cosine reranking).
     - Node insertion with vector BLOB serialization.
     - Deterministic fallback embedding generation.
     - Markdown prompt formatting output.
