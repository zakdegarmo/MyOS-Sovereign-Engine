# Milestone 1 Review Analysis: Spatial Memory Anchoring Subsystem

**Reviewer**: `reviewer_symbio_m1_2` (Teamwork Reviewer & Adversarial Critic)  
**Project**: Symbiorithmic Deep Dive (`teamwork_projects/symbiorithmic_deep_dive`)  
**Target Milestone**: M1 — Spatial Memory Anchoring Subsystem  
**Date**: 2026-08-07  
**Verdict**: **REQUEST_CHANGES**  

---

## 1. Executive Summary

Milestone 1 aims to deliver a 3-stage spatial vector store query engine (SQL bounding box pre-filter -> 3D Euclidean distance filter -> Cosine similarity reranking), SQLite DDL schema with WAL mode, spatial math utilities, vector packing/unpacking, and unit tests.

During rigorous static inspection, build verification, and adversarial stress-testing, **critical defects and integrity violations** were identified that block approval:
1. **Fatal TypeScript Compilation Failures**: `src/spatial/SpatialVectorStoreManager.ts` imports non-existent exported symbols (`euclideanDistanceSquared`, `packFloat32Blob`, `unpackFloat32Blob`, `generateFallbackEmbedding`) from `SpatialMath.ts` and non-existent interface `SpatialVectorStoreManagerInterface` from `types.ts`. TypeScript (`tsc`) fails to build the project.
2. **Broken Test Runner & Missing Build Artifact**: `tests/test-m1-spatial.mjs` attempts to import `../dist/tests/spatial.test.js`, which does not exist in `dist/`. Executing `node tests/test-m1-spatial.mjs` fails with `ERR_MODULE_NOT_FOUND`.
3. **Contract & Logic Violation in Stage 2 Distance Filter**: `PROJECT.md` § Milestones M1 specifies that Stage 2 distance filtering must satisfy $D \le \max(R, r_{inf})$. The implementation in both `src/` and `dist/` calculates `maxAllowedDist = params.radius + node.radius_influence` ($R + r_{inf}$). This incorrect distance math causes node candidates outside the specified influence radius to be included in query results, failing test assertions.
4. **Stage 3 Cosine Reranking Vector Query Bug**: `SpatialVectorStoreManager.ts` ignores `params.queryEmbedding` when deciding whether to execute Stage 3 vector reranking, checking only `params.queryText`. Passing a direct query embedding without text causes the manager to fallback to distance sorting instead of cosine similarity reranking, violating `SpatialQueryParams` contract in `types.ts`.
5. **Test Harness Database Pollution**: `SpatialVectorStoreManager` constructor ignores the `dbPath` argument (e.g. `':memory:'`), while `initDatabase()` defaults to `'data/myos_vector_store.db'`. Unit tests execute against the disk database instead of an in-memory SQLite database.

Due to uncompilable source code, broken test execution, and contract violations in core algorithms, the verdict is **REQUEST_CHANGES**.

---

## 2. Findings & Findings Matrix

| Finding ID | Severity | Category | Description | Location |
|------------|----------|----------|-------------|----------|
| **F-01** | **CRITICAL** | INTEGRITY VIOLATION | TS Source Code Compilation Failure due to broken/mismatched imports | `src/spatial/SpatialVectorStoreManager.ts:6-14, 95` |
| **F-02** | **CRITICAL** | INTEGRITY VIOLATION | Missing dist test file causing test runner execution failure | `tests/test-m1-spatial.mjs:1` |
| **F-03** | **MAJOR** | CONTRACT / LOGIC | Stage 2 distance filter uses $R + r_{inf}$ instead of $\max(R, r_{inf})$ | `src/spatial/SpatialVectorStoreManager.ts:204`, `dist/spatial/SpatialVectorStoreManager.js:166` |
| **F-04** | **MAJOR** | CONTRACT / LOGIC | Stage 3 vector reranking ignores `queryEmbedding` parameter | `src/spatial/SpatialVectorStoreManager.ts:212`, `dist/spatial/SpatialVectorStoreManager.js:172` |
| **F-05** | **MINOR** | TEST HARNESS | `SpatialVectorStoreManager` ignores constructor `dbPath`, polluting disk DB | `src/spatial/SpatialVectorStoreManager.ts:99-106`, `tests/spatial.test.ts:53-54` |
| **F-06** | **MINOR** | EDGE CASE | Bounding box calculation fails for negative radius input in SQL query | `src/spatial/SpatialVectorStoreManager.ts:168` |

---

## 3. Detailed Finding Analysis

### Finding F-01 [CRITICAL - INTEGRITY VIOLATION]: TypeScript Source Code Cannot Be Compiled
- **What**: `src/spatial/SpatialVectorStoreManager.ts` imports types and functions that do not exist in `src/spatial/types.ts` or `src/spatial/SpatialMath.ts`.
- **Where**:
  - `src/spatial/SpatialVectorStoreManager.ts`, lines 6-14:
    ```typescript
    import {
      SpatialMemoryNode,
      SpatialQueryParams,
      SpatialVectorStoreManagerInterface, // DOES NOT EXIST IN types.ts
    } from './types.js';
    import {
      euclideanDistanceSquared,  // DOES NOT EXIST IN SpatialMath.ts
      cosineSimilarity,
      packFloat32Blob,           // DOES NOT EXIST IN SpatialMath.ts
      unpackFloat32Blob,         // DOES NOT EXIST IN SpatialMath.ts
      generateFallbackEmbedding, // DOES NOT EXIST IN SpatialMath.ts
    } from './SpatialMath.js';
    ```
- **Why**: Running `npm run build` (`tsc`) fails immediately with 7+ fatal compiler errors:
  1. `Module '"./types.js"' has no exported member 'SpatialVectorStoreManagerInterface'.`
  2. `Module '"./SpatialMath.js"' has no exported member 'euclideanDistanceSquared'.`
  3. `Module '"./SpatialMath.js"' has no exported member 'packFloat32Blob'.`
  4. `Module '"./SpatialMath.js"' has no exported member 'unpackFloat32Blob'.`
  5. `Module '"./SpatialMath.js"' has no exported member 'generateFallbackEmbedding'.`
- **Impact**: The source code in `src/` is fundamentally broken and cannot be built.

---

### Finding F-02 [CRITICAL - INTEGRITY VIOLATION]: Missing Test Execution Artifact
- **What**: `tests/test-m1-spatial.mjs` attempts to import `../dist/tests/spatial.test.js`.
- **Where**: `tests/test-m1-spatial.mjs:1`
  ```javascript
  import '../dist/tests/spatial.test.js';
  ```
- **Why**: `dist/tests/spatial.test.js` does not exist in the repository (and cannot be generated because `tsc` fails).
- **Impact**: Running `node tests/test-m1-spatial.mjs` throws `ERR_MODULE_NOT_FOUND`, making it impossible to run the specified milestone test command.

---

### Finding F-03 [MAJOR]: Stage 2 Distance Filtering Logic Contradicts `PROJECT.md` Contract
- **What**: The distance formula used in Stage 2 candidate filtering calculates $R + r_{inf}$ instead of $\max(R, r_{inf})$.
- **Where**: `src/spatial/SpatialVectorStoreManager.ts:204` & `dist/spatial/SpatialVectorStoreManager.js:166`
  ```typescript
  const maxAllowedDist = params.radius + node.radius_influence;
  if (distSq <= maxAllowedDist * maxAllowedDist) { ... }
  ```
- **Why**:
  - `PROJECT.md` line 8 specifies: `(2) 3D Euclidean distance filter ($D \le \max(R, r_{inf})$)`
  - `tests/spatial.test.ts` lines 76-89 specify that Node 3 at distance 8 from query center (where Query $R = 5$ and Node $r_{inf} = 3$) must be filtered out because $\max(5, 3) = 5 < 8$.
  - Under the current code ($5 + 3 = 8$), Node 3 is incorrectly included because $8 \le 8$ is TRUE.
- **Impact**: Violates the milestone interface contract, causes incorrect spatial memory retrieval, and fails test suite assertions.

---

### Finding F-04 [MAJOR]: Stage 3 Vector Reranking Ignores `queryEmbedding` Parameter
- **What**: `SpatialVectorStoreManager.ts` only checks `params.queryText` to activate Stage 3 cosine similarity reranking.
- **Where**: `src/spatial/SpatialVectorStoreManager.ts:212` & `dist/spatial/SpatialVectorStoreManager.js:172`
  ```typescript
  if (params.queryText && params.queryText.trim().length > 0) { ... }
  ```
- **Why**:
  - `SpatialQueryParams` in `types.ts` explicitly includes `queryEmbedding?: Float32Array | number[]`.
  - `tests/spatial.test.ts` lines 133-139 test Stage 3 reranking by passing `queryEmbedding: [0.0, 0.9, 0.0, 0.0]` without passing `queryText`.
  - Because `queryText` is undefined, `querySpatialMemories` takes the `else` branch (distance sorting) and returns Node 1 instead of Node 2.
- **Impact**: Callers providing pre-computed embeddings cannot trigger vector reranking, failing `spatial.test.ts` line 139 assertion (`assert.strictEqual(vectorResults[0].id, node2Id)`).

---

### Finding F-05 [MINOR]: `SpatialVectorStoreManager` Ignores Constructor `dbPath`
- **What**: `new SpatialVectorStoreManager(dbPath)` discards its argument, while `initDatabase()` defaults to `'data/myos_vector_store.db'`.
- **Where**: `src/spatial/SpatialVectorStoreManager.ts:99-106` & `tests/spatial.test.ts:53-54`
- **Why**:
  - In `tests/spatial.test.ts`: `const manager = new SpatialVectorStoreManager(':memory:'); await manager.initDatabase();`
  - The argument `':memory:'` is discarded by the zero-parameter constructor. `initDatabase()` receives `undefined` and defaults to `'data/myos_vector_store.db'`.
- **Impact**: Unit tests write persistent test data to `'data/myos_vector_store.db'` instead of running safely in memory.

---

### Finding F-06 [MINOR - ADVERSARIAL CRITIC]: Bounding Box SQL Pre-filter Failure on Negative Radius
- **What**: If `params.radius` is negative (e.g. `-5`), Stage 1 SQL query fails to return any results.
- **Where**: `src/spatial/SpatialVectorStoreManager.ts:168`
  ```typescript
  const rows = stmt.all(px - r, px + r, py - r, py + r, pz - r, pz + r);
  ```
- **Why**: If $r = -5$ and $px = 0$, $px - r = 5$ and $px + r = -5$. The SQL clause `(x + radius_influence) >= 5 AND (x - radius_influence) <= -5` will return 0 rows.
- **Remediation**: Normalize query radius with `const r = Math.abs(params.radius);` before building bounds.

---

## 4. Adversarial Stress-Test Results

| Scenario / Input | Expected Behavior | Actual Behavior | Pass/Fail |
|------------------|-------------------|-----------------|-----------|
| `npm run build` (`tsc`) | Clean TypeScript compilation to `dist/` | FAILED with 7+ type/import errors | **FAIL** |
| `node tests/test-m1-spatial.mjs` | Runs unit test suite | `ERR_MODULE_NOT_FOUND` (`dist/tests/spatial.test.js`) | **FAIL** |
| Stage 2 Query with $D=8, R=5, r_{inf}=3$ | Exclude node ($\max(5,3) = 5 < 8$) | Included node ($5+3 = 8 \ge 8$) | **FAIL** |
| Stage 3 Query with `queryEmbedding` only | Rerank candidates by cosine similarity | Falls back to distance sorting | **FAIL** |
| Instantiating `SpatialVectorStoreManager(':memory:')` | Use in-memory SQLite DB | Discards argument, opens disk file DB | **FAIL** |
| Query with `radius = -10` | Normalize radius to 10 | SQL bounds inverted, returns 0 nodes | **FAIL** |
| Mismatched vector lengths in `cosineSimilarity` | Return 0 similarity | Returns 0 similarity | **PASS** |

---

## 5. Required Action Plan for Approval

To achieve approval for Milestone 1, the implementer must:

1. **Align `src/spatial/types.ts`, `SpatialMath.ts`, and `SpatialVectorStoreManager.ts`**:
   - Export `SpatialVectorStoreManager` interface in `types.ts` (or alias `SpatialVectorStoreManagerInterface`).
   - Export consistent math functions in `SpatialMath.ts`:
     - `euclideanDistanceSquared(p1, p2): number`
     - `euclideanDistance3D(p1, p2): number`
     - `packFloat32Blob(embedding): Buffer` / `packEmbedding`
     - `unpackFloat32Blob(blob): Float32Array` / `unpackEmbedding`
     - `generateFallbackEmbedding(text: string, dim?: number): Float32Array`
2. **Fix Stage 2 Distance Filtering**:
   - Update `SpatialVectorStoreManager.ts` line 204 to calculate:
     `const maxAllowedDist = Math.max(params.radius, node.radius_influence);`
3. **Fix Stage 3 Cosine Reranking Vector Query**:
   - Update `SpatialVectorStoreManager.ts` line 212 to check:
     `const queryVec = params.queryEmbedding ? (params.queryEmbedding instanceof Float32Array ? params.queryEmbedding : new Float32Array(params.queryEmbedding)) : (params.queryText && params.queryText.trim().length > 0 ? await getEmbeddingForText(params.queryText) : null);`
     If `queryVec` is non-null, execute Stage 3 cosine similarity reranking.
4. **Fix `SpatialVectorStoreManager` Constructor & `initDatabase`**:
   - Store `dbPath` in constructor if provided, e.g. `constructor(dbPath?: string)` and pass it to `initDatabase`.
5. **Verify Build & Run Test Suite**:
   - Run `npm run build` (`tsc`) cleanly without errors.
   - Run `node tests/test-m1-spatial.mjs` and confirm all unit tests pass 100%.
