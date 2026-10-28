# Requirement R1 Investigation Analysis: Spatial Memory Anchoring Subsystem & SQLite Vector Store Mapping

## Executive Summary
This investigation analyzed the repository architecture, spatial coordinate systems, existing SQLite vector databases (`data/myos_vector_store.db`), vector indexing scripts (`scripts/migrate_vector_store.py`, `scripts/detective.py`, `scripts/test_sqlite_vector_store.py`), and 3D WebGL canvas components (`apps/web/src/components/World/AstraLabWorld.tsx`, `FaerunTraversal.tsx`, `usePersistentWorldStore.ts`). 

The objective of Requirement R1 (Symbiorithmic Deep Dive project) is to establish a **1-to-1 Spatial Ontology Mapping** between 3D WebGL coordinates $[X, Y, Z]$ and the local SQLite vector database (`myos_vector_store.db`), enabling bidirectional retrieval of local lore, historical agent logs, and active quest states within a configurable spatial radius.

---

## 1. Codebase & Infrastructure Inventory

### 1.1 Existing Vector Store Assets
- **`data/myos_vector_store.db`**: Primary SQLite database file (~2.88 GB migrated source data).
- **`data/myos_vector_store.json`**: Source JSON vector repository containing transcript block MD5 hashes, high-dimensional float embeddings, and text chunks.
- **`data/myos_code_index.db`**: Secondary SQLite database for Tree-Sitter parsed code function embeddings (`scripts/docstringer.py`).

### 1.2 Key Python Vector Modules & Scripts
- **`scripts/migrate_vector_store.py`**:
  - DDL:
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
  - Vector Blob Serialization: Converts 1024-dimensional float lists into binary BLOBs using `struct.pack(f'{len(embedding)}f', *embedding)`.
- **`scripts/detective.py`**: Autonomous film-noir crawler inserting `type = 'detective_note'` rows into `vectors`.
- **`scripts/test_sqlite_vector_store.py`**: Database deserialization test script unpacking `embedding` BLOBs using `struct.unpack(f'{num_floats}f', blob)`.

### 1.3 3D WebGL Canvas Coordinate Systems & Anchors
- **`apps/web/src/components/World/AstraLabWorld.tsx`**:
  - Configures explicit 3D spatial points of interest (POIs) and city skylines:
    - **Waterdeep**: `[-150, 18, 80]`
    - **Baldur's Gate**: `[-110, 18, 480]`
    - **Neverwinter**: `[-180, 18, -140]`
    - **Candlekeep**: `[-130, 16, 650]`
    - **Silverymoon**: `[-50, 16, -280]`
    - **Luskan**: `[-210, 16, -320]`
    - **Myth Drannor**: `[320, 16, -50]`
- **`Faerûn/src/logic/SnapperService.ts`**:
  - Maps location coordinates (e.g. Yawning Portal: `{ q: 15, r: 8 }` in hex/dungeon space).
- **`apps/web/src/store/usePersistentWorldStore.ts`**:
  - Tracks player real-time coordinates `playerPos: [x, y, z]` (default `[0, 0.1, 0]`) and agent positions `agentPositions`.

---

## 2. Spatial Ontology Mapping & Radius Query Architecture

### 2.1 Proposed DDL for Spatial Memory (`spatial_memory_nodes`)
To enable efficient spatial indexing and radius filtering without breaking existing flat vector schema, we define the `spatial_memory_nodes` table in `data/myos_vector_store.db`:

```sql
CREATE TABLE IF NOT EXISTS spatial_memory_nodes (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    type TEXT NOT NULL,                  -- 'lore', 'historical_log', 'quest_state', 'world_mutation'
    timestamp TEXT NOT NULL,
    x REAL NOT NULL DEFAULT 0.0,
    y REAL NOT NULL DEFAULT 0.0,
    z REAL NOT NULL DEFAULT 0.0,
    radius_influence REAL NOT NULL DEFAULT 50.0,
    region_id TEXT NOT NULL,            -- e.g. 'waterdeep', 'yawning_portal', 'undermountain'
    text TEXT NOT NULL,
    tags TEXT,                          -- JSON array e.g. '["ancient_battlefield", "stormy_skies"]'
    embedding BLOB,                     -- IEEE 754 32-bit float packed BLOB (1024 floats)
    metadata TEXT                       -- JSON object for extra key-values
);

CREATE INDEX IF NOT EXISTS idx_spatial_coords ON spatial_memory_nodes(x, y, z);
CREATE INDEX IF NOT EXISTS idx_spatial_region ON spatial_memory_nodes(region_id);
CREATE INDEX IF NOT EXISTS idx_spatial_type ON spatial_memory_nodes(type);
```

### 2.2 Spatial Radius Query Algorithm & Bounding Box Optimization
When player/avatar moves to 3D WebGL position $P = (X_p, Y_p, Z_p)$ with configurable search radius $R$:

1. **Bounding Box Pre-Filter (SQLite Index Scan)**:
   Calculate bounding box bounds:
   $$X_{min} = X_p - R, \quad X_{max} = X_p + R$$
   $$Y_{min} = Y_p - R, \quad Y_{max} = Y_p + R$$
   $$Z_{min} = Z_p - R, \quad Z_{max} = Z_p + R$$

   Executing SQL:
   ```sql
   SELECT id, title, type, timestamp, x, y, z, radius_influence, region_id, text, tags, embedding, metadata
   FROM spatial_memory_nodes
   WHERE x BETWEEN ? AND ?
     AND y BETWEEN ? AND ?
     AND z BETWEEN ? AND ?;
   ```

2. **Euclidean Distance & Influence Radius Filtering**:
   For each retrieved candidate node $M = (X_m, Y_m, Z_m)$:
   $$D = \sqrt{(X_m - X_p)^2 + (Y_m - Y_p)^2 + (Z_m - Z_p)^2}$$
   Retain node if:
   $$D \le \max(R, \text{radius\_influence})$$

3. **Hybrid Spatial-Semantic Reranking**:
   If an active query $Q$ is supplied:
   - Compute query embedding $E_Q$ via Ollama API (`mxbai-embed-large:latest` on `http://localhost:11434/api/embeddings`).
   - Unpack candidate embedding BLOB $E_M$ using Python `struct.unpack(f'{N}f', blob)` or JS `Float32Array`.
   - Calculate Cosine Similarity: $\text{Sim}_{sem} = \frac{E_Q \cdot E_M}{\|E_Q\| \|E_M\|}$.
   - Composite Score:
     $$\text{Score} = \alpha \cdot \text{Sim}_{sem} + (1 - \alpha) \cdot \left(1 - \frac{D}{R}\right)$$

---

## 3. Bidirectional Memory Pipeline Mechanics

```
 [3D WebGL Canvas] (Player at [X, Y, Z])
         │
         ├─── (Query within Radius R) ───► [SpatialVectorStoreManager]
         │                                       │
         │                                       ▼
         │                               [SQLite Vector Store]
         │                               (spatial_memory_nodes)
         │                                       │
         │                                       ▼
         │                            [Agent Context Priming]
         │                            (DM, Rules Lawyer, Party)
         │
         └─── (Action / Event Mutation) ──► [Ollama Embedding API]
                                                 │
                                                 ▼
                                     [SQLite Insertion (BLOB)]
```

### 3.1 Read Path (Canvas $\rightarrow$ SQLite $\rightarrow$ Agent Context)
1. Player position update in `usePersistentWorldStore` triggers spatial hook.
2. Spatial query executes against `data/myos_vector_store.db` within radius $R$.
3. Matching nodes formatted into structured Markdown context block:
   ```markdown
   ## Active 3D Region Spatial Memory: Waterdeep [-150, 18, 80] (Radius: 50.0m)
   - [Lore Node #WTR-01] City of Splendors Northern Gates - Historical garrison location.
   - [Quest State #Q-42] Lord Bragol's missing parchment verse.
   - [Atmospheric Tag] stormy_skies, ancient_battlefield
   ```
4. Context injected into prompt templates for active agent swarms (DM, Party Members).

### 3.2 Write Path (Action / Mutation $\rightarrow$ SQLite)
1. Player/Agent completes action (e.g., defeating a boss at Waterdeep `[-150, 0, 80]`).
2. Event payload generated: `{ title, type, x, y, z, text, tags, metadata }`.
3. Vector embedding generated via Ollama embedding API (`mxbai-embed-large:latest` 1024-dim floats).
4. Binary float BLOB packed via `struct.pack('1024f', *embedding)`.
5. Inserted into SQLite `spatial_memory_nodes` table.

---

## 4. Enumeration of Requirements, Constraints & Dependencies for R1

| Component | Description / Requirement | Status / Gap |
|---|---|---|
| **SQLite Schema** | `spatial_memory_nodes` table with `x, y, z, radius_influence, region_id, tags, embedding` | Missing in current DB; needs DDL migration script |
| **Python Manager** | `SpatialVectorStoreManager.py` module in `teamwork_projects/symbiorithmic_deep_dive` | Needs implementation |
| **Spatial Radius Math** | 3D Euclidean distance calculation & bounding box filtering | Fully mathematically specified |
| **Float Blob Binary I/O** | Pack/unpack 32-bit floats via `struct` / `Float32Array` | Verified in existing `detective.py` & `test_sqlite_vector_store.py` |
| **Database Concurrency** | Enable WAL mode (`PRAGMA journal_mode=WAL;`) for non-blocking concurrent reads/writes | Required constraint |
| **Dependencies** | Python `sqlite3`, `struct`, `urllib`/`httpx`, Ollama API (`mxbai-embed-large:latest`) | Available |

---

## 5. Build & Test Command Status

| Command Target | Executable / Script | Status | Notes |
|---|---|---|---|
| Vector Store Integrity | `scripts/test_sqlite_vector_store.py` | Verified (Static Code Analysis) | Connects to `data/myos_vector_store.db`, unpacks binary float BLOBs |
| Vector Migration | `scripts/migrate_vector_store.py` | Verified (Static Code Analysis) | Handles `ijson` streaming & float packing |
| Detective DB Insert | `scripts/detective.py` | Verified (Static Code Analysis) | Handles Ollama embed API & SQLite binary insertion |
