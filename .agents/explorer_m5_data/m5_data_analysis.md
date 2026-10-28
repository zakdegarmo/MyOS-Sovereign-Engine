---
title: "Explorer M5: MyOS Zero-Knowledge Discovery Analysis - Data & State Mechanics (Phases 4 & 5)"
agent: "explorer_m5_data"
date: "2026-07-20"
milestone: "Zero-Knowledge Discovery Task - Phase 4 & Phase 5"
scope: ["data/", "sectors.json", "fractal_genome.json", "fractal_genome_map.md", "fractal_genome_standard.md", "council_config.json", "council_config.json.crswap", "genome_map.json", "myos_chronological_journal.md", "myos_journal_node.jsonld", "myos_local_node.jsonld", "saved_states/", "scratch/", "results/", "tmp/"]
protocol: "Zero-Knowledge Bias Protocol (Strict Grounding, Zero Assumptions, Explicit Blindspot Logging)"
---

# MyOS Discovery Report: Data & State Mechanics (Phases 4 & 5)

## Executive Summary

This report delivers a zero-knowledge, evidence-grounded structural analysis of the data models, genome standards, state persistent stores, configuration files, JSON-LD graphs, and automation tooling of the MyOS system.

Every finding is cited with exact file paths, byte sizes, line numbers, and JSON/XML schema properties. No architecture or operational goals have been assumed beyond what is explicitly present in raw source files.

---

## 1. Genome Specifications & Ontological Schemas

### 1.1 `fractal_genome.json`

## Verified Evidence
- **Path**: `c:/Users/zakde/Desktop/AntiGravity projects/MyOS/fractal_genome.json`
- **File Size**: 27,519 bytes
- **JSON Structure**: Single root object containing exactly 10 top-level keys corresponding to the 10 System Pillars.
- **Top-Level Keys**: `Self`, `Thought`, `Logic`, `Unity`, `Existence`, `Improvement`, `Mastery`, `Resonance`, `Transcendence`, `Omni`.
- **Sub-Key Matrix**: Each Pillar object contains 10 relationship verbs. Each verb maps to an array of 10 terminal gene strings, forming a 10 x 10 x 10 matrix (1,000 terminal genes total).

**Pillar & Verb Sampling**:
- `Self`: Verbs `Identity`, `SubjectOf`, `Applies`, `Seeks`, `Affirms`, `Undergoes`, `Pursues`, `Experiences`, `AspiresTo`, `IsRealizedBy`.
- `Thought`: Verbs `Informs`, `Recursion`, `Utilizes`, `Synthesizes`, `Represents`, `Drives`, `Develops`, `Articulates`, `Enables`, `Transcends`.
- `Logic`: Verbs `Structures`, `Governs`, `Foundation`, `Ensures`, `Describes`, `Validates`, `Underpins`, `Contradicts`, `Grounds`, `IsFoundationOf`.
- `Unity`: Verbs `Integrates`, `Harmonizes`, `Requires`, `Essence`, `Binds`, `Fosters`, `CulminatesIn`, `Amplifies`, `Achieves`, `UltimateExpressionOf`.
- `Existence`: Verbs `ManifestsIn`, `IsPonderedBy`, `Obeys`, `Comprises`, `Is`, `EvolvesThrough`, `IsDomainOf`, `VibratesIn`, `IsSurpassedBy`, `GivesRiseTo`.
- `Improvement`: Verbs `Refines`, `Optimizes`, `Systematizes`, `Strengthens`, `Enhances`, `Process`, `LeadsTo`, `FineTunes`, `IsPathTo`, `IsCycleOf`.
- `Mastery`: Verbs `Actualizes`, `RequiresDeep`, `AppliesPerfected`, `Embodies`, `Commands`, `IsGoalOf`, `Pinnacle`, `Generates`, `Approaches`, `IsTotalityOf`.
- `Resonance`: Verbs `IsFeltBy`, `IsEvokedBy`, `Eludes`, `Creates`, `EchoesThrough`, `AlignsWith`, `RadiatesFrom`, `Sympathy`, `Facilitates`, `IsGroundOf`.
- `Transcendence`: Verbs `Elevates`, `GoesBeyond`, `IsNotBoundBy`, `IsStateOf`, `RisesAbove`, `IsAimOf`, `IsPinnacleOf`, `Induces`, `Action`, `IsNatureOf`.
- `Omni`: Verbs `MergesWith`, `Contemplates`, `IsSubsetOf`, `IsAspectOf`, `EmergesFrom`, `OccursWithin`, `SeeksToUnderstand`, `HarmonizesWith`, `AspiresTo`, `Is`.

## System Logic & Mechanics
`fractal_genome.json` serves as the primary JSON data model for the 3-layer fractal genome taxonomy. It provides the static lookup table of terminal concepts used by the UI factor hierarchy (`src/[Pillar]/Factors/[Verb]/[Gene].tsx`) and the ontology scaffolding tools.

## Unresolved Blindspots & Open Questions
- **Schema Validation**: No inline `$schema` or external JSON Schema file is linked within `fractal_genome.json`.

---

### 1.2 `fractal_genome_map.md` & `fractal_genome_standard.md`

## Verified Evidence
- **Paths**:
  - `c:/Users/zakde/Desktop/AntiGravity projects/MyOS/fractal_genome_map.md` (14,578 bytes, 141 lines)
  - `c:/Users/zakde/Desktop/AntiGravity projects/MyOS/fractal_genome_standard.md` (1,631 bytes, 38 lines)

**Document Specifications**:
- `fractal_genome_map.md` (Lines 1–15): Formally defines the 10x10x10 architecture:
  - **Layer 1 (The 10 Pillars)**: Base concepts `Self`, `Thought`, `Logic`, `Unity`, `Existence`, `Improvement`, `Mastery`, `Resonance`, `Transcendence`, `Omni`.
  - **Layer 2 (The 100 Relationships / Matrix)**: Stored as Markdown documents in `public/library/[Pillar]/[Verb].md`, acting as context for the MicroMCP Server Array.
  - **Layer 3 (The 1000 Genes / Terminal Components)**: 10 specific executable concepts per relationship, mapped to React components in `src/[Pillar]/Factors/[Verb]/[Gene].tsx`.
- `fractal_genome_standard.md` (Lines 1–14): Extends the hierarchy to 5 self-similar levels ($10^5 = 100,000$ total nodes):
  - Level 0 (`P`): 10 Pillars
  - Level 1 (`P.V`): 100 Relationship Verbs
  - Level 2 (`P.V.G`): 1,000 Functional Component Genes
  - Level 3 (`P.V.G.Pr`): 10,000 Recursive Refraction Proteins
  - Level 4 (`P.V.G.Pr.M`): 100,000 Structural Monad Molecules

## System Logic & Mechanics
These documentation files define the canonical addressing standard across the MyOS codebase. Addressing follows a dot-separated numeric or symbolic hierarchy, enabling deep indexing of ontology nodes across memory systems, UI components, and MCP tool servers.

## Unresolved Blindspots & Open Questions
- **Level 3 & 4 Implementation**: While Levels 0–2 are fully manifested in `fractal_genome.json` (1,000 genes) and `data/myontology-genome.xml` (1,110 nodes), Levels 3 and 4 (10,000 proteins and 100,000 molecules) are specified in `fractal_genome_standard.md` but do not exist as static JSON/XML files in the repository.

---

### 1.3 `genome_map.json`

## Verified Evidence
- **Path**: `c:/Users/zakde/Desktop/AntiGravity projects/MyOS/genome_map.json`
- **File Size**: 0 bytes
- **Line Count**: 0 lines

## System Logic & Mechanics
`genome_map.json` exists in the project root as an empty file (0 bytes).

## Unresolved Blindspots & Open Questions
- **Unpopulated Schema Artifact**: It is unknown whether `genome_map.json` is a placeholder reserved for an auto-generated genome index, a residual artifact from an uncompleted build step, or a deprecated target file.

---

### 1.4 `data/myontology-genome.xml`

## Verified Evidence
- **Path**: `c:/Users/zakde/Desktop/AntiGravity projects/MyOS/data/myontology-genome.xml`
- **File Size**: 67,418 bytes
- **Line Count**: 1,222 lines
- **Format**: XML document with root element `<MyOntology project="MyOS" version="1.0" totalNodes="1110">`.

**XML Structure**:
- 10 `<Pillar>` elements containing attributes `id`, `symbol` (Unicode alchemical rune), `address` (integer `0` to `9`).
- Nested `<Relationship>` elements with attributes `id`, `symbol`, `address` (e.g. `0.0`, `0.1`).
- Nested `<Gene>` elements with attributes `id`, `symbol`, `address` (e.g. `0.0.0` through `0.0.9`).

**Sample Snippet (Lines 1–16)**:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<MyOntology project="MyOS" version="1.0" totalNodes="1110">
  <Pillar id="Omni" symbol="🜋" address="0">
    <Relationship id="MergesWith" symbol="🜋" address="0.0">
      <Gene id="Profile" symbol="🜋" address="0.0.0" />
      <Gene id="Context" symbol="⚹" address="0.0.1" />
      <Gene id="Logic" symbol="☿" address="0.0.2" />
      <Gene id="Bond" symbol="🜔" address="0.0.3" />
      <Gene id="Avatar" symbol="🝧" address="0.0.4" />
      <Gene id="Update" symbol="🜄" address="0.0.5" />
      <Gene id="Agency" symbol="🜏" address="0.0.6" />
      <Gene id="Vibe" symbol="☉" address="0.0.7" />
      <Gene id="Spirit" symbol="♀" address="0.0.8" />
      <Gene id="TheOne" symbol="🜍" address="0.0.9" />
    </Relationship>
```

## System Logic & Mechanics
This XML file is the primary machine-readable XML ontology specification. The node count $1,110$ represents $10 \text{ Pillars} + 100 \text{ Relationships} + 1,000 \text{ Genes}$. It is actively parsed by `scratch/scaffold_ontology.js` and `scratch/audit_ontology.js`.

## Unresolved Blindspots & Open Questions
- **Rune-to-Address Assignment**: Each gene is assigned a Unicode rune symbol (e.g. `🜋`, `⚹`, `☿`, `🜔`, `🝧`, `🜄`, `🜏`, `☉`, `♀`, `🜍`) corresponding to the last digit of its dot-separated address.

---

## 2. Chronological Memory & JSON-LD Knowledge Graphs

### 2.1 `myos_chronological_journal.md`

## Verified Evidence
- **Path**: `c:/Users/zakde/Desktop/AntiGravity projects/MyOS/myos_chronological_journal.md`
- **File Size**: 111,169 bytes
- **Line Count**: 1,709 lines
- **Structure**: Markdown journal containing 60 chronologically ordered session entries beginning June 28, 2026.

**Entry Schema (Lines 1–15)**:
```markdown
# 📖 Chronological Journal: Myos

## Entry 1: June 28, 2026 - 22:48:57

```xml
<metadata>
  <source>C:/Users/zakde/.gemini/antigravity/brain/5ab9125a-c659-4959-8516-8bd137497af2/.system_generated/logs/transcript.jsonl</source>
  <timestamp>2026-06-28T22:48:57.098309</timestamp>
  <topic>MyOS</topic>
</metadata>
```

**Summary:** The conversation details the architectural requirements...
**Creative Intentions:** ...
**Design Decisions:** ...
**Selected Quotes:** ...
```

## System Logic & Mechanics
Produced by the `/journalWeaver` skill or script (`ingest_conversations.ts`), this markdown journal compiles interaction history from local Antigravity transcript logs into structured semantic summaries.

## Unresolved Blindspots & Open Questions
- **Source Log Accessibility**: References absolute path locations on the local system (`C:/Users/zakde/.gemini/antigravity/brain/...`). If session logs are deleted or moved, source links cannot be re-verified.

---

### 2.2 `myos_journal_node.jsonld` & `myos_local_node.jsonld`

## Verified Evidence
- **Paths**:
  - `c:/Users/zakde/Desktop/AntiGravity projects/MyOS/myos_journal_node.jsonld` (112,220 bytes)
  - `c:/Users/zakde/Desktop/AntiGravity projects/MyOS/myos_local_node.jsonld` (2,683 bytes)

**Schema & Graph Properties**:
- `myos_journal_node.jsonld`:
  - `@context`: `"https://schema.org"`
  - `@type`: `"CreativeWorkSeries"`
  - `name`: `"MyOS Development Journal & Creative Intentions"`
  - `keywords`: `["MyOS", "Antigravity", "Semantic Memory", "Journal Weaver"]`
  - `journalEntries`: Array of exactly 60 JSON-LD objects matching the entries in `myos_chronological_journal.md`.
  - Object keys per entry: `path`, `timestamp`, `summary`, `intentions` (array), `decisions` (array), `quotes` (array).

- `myos_local_node.jsonld`:
  - `@context`: `"https://schema.org"`
  - `@type`: `"Dataset"`
  - `name`: `"MyOS Local Semantic Memory Node"`
  - `keywords`: `["MyOS", "Memory Weaver"]`
  - `extractedKnowledge`: Array of 9 `Fact` objects (`@type`: `"Fact"`, `statement`, `source`).

## System Logic & Mechanics
These JSON-LD files provide standardized W3C Linked Data graphs for machine traversal and semantic search. They structure session memory into Schema.org compliant entities (`CreativeWorkSeries`, `Dataset`, `Fact`).

## Unresolved Blindspots & Open Questions
- **Linked Data Context Resolution**: Schema.org URI (`https://schema.org`) is declared in `@context`, but offline evaluation requires embedded local context definitions.

---

## 3. Persistent Vector Stores & Structural Indexing

### 3.1 `data/myos_vector_store.json`

## Verified Evidence
- **Path**: `c:/Users/zakde/Desktop/AntiGravity projects/MyOS/data/myos_vector_store.json`
- **File Size**: 2,886,047,217 bytes (2.88 GB)
- **JSON Structure**: Single massive JSON object keyed by 32-character MD5 string hashes.

**Entry Schema (Sample extracted from first 500 bytes)**:
```json
{
  "24daeaf1398660f4bd64942a98c6f565": {
    "type": "intention",
    "timestamp": "2026-06-28T22:48:57.098309",
    "text": "Summary: The conversation details the architectural requirements...",
    "embedding": [...]
  }
}
```

## System Logic & Mechanics
`myos_vector_store.json` is the main offline vector database for semantic memory retrieval across MyOS. It stores pre-computed high-dimensional embedding vectors and associated transcript chunk texts.

## Unresolved Blindspots & Open Questions
- **Embedding Vector Dimension & Model**: The embedding model name (e.g., Ollama `mistral` / `nomic-embed-text` / Gemini embeddings) is not recorded in the store header.

---

### 3.2 `data/lpc_paths.json`, `data/parent_candidates.json`, `data/MyOS.tree.md`, `data/tree.txt`

## Verified Evidence
- **Paths & Sizes**:
  - `c:/Users/zakde/Desktop/AntiGravity projects/MyOS/data/lpc_paths.json` (1,440,282 bytes)
  - `c:/Users/zakde/Desktop/AntiGravity projects/MyOS/data/parent_candidates.json` (229,661 bytes)
  - `c:/Users/zakde/Desktop/AntiGravity projects/MyOS/data/MyOS.tree.md` (7,748,922 bytes, 82,047 lines)
  - `c:/Users/zakde/Desktop/AntiGravity projects/MyOS/data/tree.txt` (7,723,670 bytes, 81,837 lines)

**Structural Breakdown**:
- `data/lpc_paths.json`: Root JSON Array containing 24,212 string file paths indexing all files inside `tmp/ingestion/` third-party repositories.
- `data/parent_candidates.json`: Root JSON Array containing 100 object entries mapping Pillar->Relationship panels (e.g. `Self->Identity`) to open-source project candidate repos in `tmp/ingestion/` (fields: `panel`, `candidates` array containing `repo`, `description`, `reasoning`).
- `data/MyOS.tree.md` & `data/tree.txt`: UTF-16LE text files representing raw output from Windows `tree /F` command over the MyOS workspace.

## System Logic & Mechanics
These files represent ingestion indices used by the semantic reconciler and ontology scaffolding algorithms to match open-source code components to the 100 Pillar-Relationship panels.

## Unresolved Blindspots & Open Questions
- **LPC Acronym**: The exact expansion of "LPC" in `lpc_paths.json` is not defined in any schema file (hypothesized as "Local Project Codebase" or "Lattice Path Collection").

---

## 4. Configurations & Workspace Tooling

### 4.1 `council_config.json` & `council_config.json.crswap`

## Verified Evidence
- **Paths**:
  - `c:/Users/zakde/Desktop/AntiGravity projects/MyOS/council_config.json` (7,659 bytes, 288 lines)
  - `c:/Users/zakde/Desktop/AntiGravity projects/MyOS/council_config.json.crswap` (7,659 bytes, 288 lines)

**Configuration Properties**:
- `timestamp`: `1772375069678` (in `.crswap`: `1772375068730`)
- `activeAgentId`: `"thought"`
- `agentsConfig`: Dictionary of 10 council agents: `self`, `thought`, `logic`, `unity`, `existence`, `improvement`, `mastery`, `resonance`, `transcendence`, `omni`.
  - Properties per agent: `color`, `animation` (`"idle"`), `materialType` (`"glossy"`), `bodyType` (`"knot"`), `message`, `emoji`, `modelType` (`"paperdoll"`), `spriteUrl` (`"/textures/council_sprites.png"`), `scale`, `yOffset`, `pillarIndex` (1..10), `genome` map (10 pillars mapped to `"baseline"`).
- `floorConfig`: `{ "showGrid": false, "showTexture": false, "x": 0, "y": -1.5, "z": 20, "width": 30, "depth": 5 }`
- `screenConfig`: `{ "scale": 0.8, "x": 7, "y": -20 }`
- `cameraConfig`: `{ "x": 0, "y": 5, "z": 35, "fov": 40 }`
- `lightConfig`: `{ "screenIntensity": 20, "ambientIntensity": 1.5 }`
- `wallConfig`: `{ "angle": 90, "width": 5, "x": 10, "y": 0, "z": 2.5 }`
- `bonePrefix`: `"mixamorig"`

## System Logic & Mechanics
`council_config.json` configures the 3D scene parameters, camera positions, lighting, floor grids, bone prefixes, and visual properties of the 10 council agent paperdoll avatars rendered in the Three.js / React 3D viewport. `.crswap` is an atomic write swap artifact generated during browser filesystem interaction.

## Unresolved Blindspots & Open Questions
- **Genome Mutation Baseline**: All 10 pillar genome values inside each agent configuration are set to `"baseline"`. Mechanisms for dynamic genome mutation or trait elevation are not specified in this config file.

---

### 4.2 `sectors.json`

## Verified Evidence
- **Path**: `c:/Users/zakde/Desktop/AntiGravity projects/MyOS/sectors.json`
- **Encoding**: UTF-16LE with Byte Order Mark (`\uFEFF`), 541,352 bytes.
- **Root Object**: `{ "sectors": [ sector0, sector1, sector2, sector3, sector4 ] }`
- **Sector Counts**:
  - Sector 0: 354 file paths
  - Sector 1: 354 file paths
  - Sector 2: 354 file paths
  - Sector 3: 354 file paths
  - Sector 4: 351 file paths
- **Total Paths**: 1,767 absolute Windows file paths under `apps/web/src/` and `utils/`.

## System Logic & Mechanics
`sectors.json` partitions the web application source code tree into 5 balanced work sectors. This enables parallel agent discovery or multi-threaded sector scanning.

## Unresolved Blindspots & Open Questions
- **Sector Partition Algorithm**: The exact script or criteria used to partition the 1,767 files into 5 sectors is not present in raw source files.

---

## 5. State Dumps & Universe Snapshots

### 5.1 `saved_states/` & `data/saved_states/`

## Verified Evidence
- **Directory Paths**:
  - `c:/Users/zakde/Desktop/AntiGravity projects/MyOS/saved_states/` (4 JSON files)
  - `c:/Users/zakde/Desktop/AntiGravity projects/MyOS/data/saved_states/` (8 JSON files)

**Snapshot File Catalog**:
- `saved_states/`:
  1. `myos_universe_2026-03-18_030049_[omni_alpha].json` (10,521 bytes, timestamp: `1773802849193`, activeAgent: `omni`)
  2. `myos_universe_2026-03-18_030113_[omni_alpha].json` (10,521 bytes, timestamp: `1773802873728`, activeAgent: `omni`)
  3. `myos_universe_2026-03-18_030118_[omni_alpha].json` (10,521 bytes, timestamp: `1773802878167`, activeAgent: `omni`)
  4. `myos_universe_2026-03-18_[omni_alpha].json` (10,518 bytes, timestamp: `1773798938411`, activeAgent: `self`)
- `data/saved_states/`:
  1. `myos_universe_2026-03-14_[omni_alpha].json` (9,138 bytes, activeAgent: `self`)
  2. `myos_universe_2026-03-17_[omni_alpha].json` (9,837 bytes, activeAgent: `orchestrator`)
  3. `myos_universe_2026-03-18_235729_[omni_alpha].json` (20,440 bytes, activeAgent: `orchestrator`, contains `agentGenomes`)
  4. `myos_universe_2026-03-18_[omni_alpha].json` (10,514 bytes, activeAgent: `self`)
  5. `myos_universe_2026-03-21_002756_[omni_alpha].json` (19,175 bytes, activeAgent: `orchestrator`)
  6. `myos_universe_2026-03-21_042316_[omni_alpha].json` (19,157 bytes, activeAgent: `orchestrator`)
  7. `myos_universe_2026-03-22_035515_[omni_alpha].json` (18,618 bytes, activeAgent: `user`)
  8. `myos_universe_2026-03-28_041733_[omni_alpha].json` (18,446 bytes, activeAgent: `orchestrator`)

## System Logic & Mechanics
These JSON files record serializations of the MyOS universe state. They contain full agent configurations, active agent selection (`self`, `thought`, `omni`, `orchestrator`, `user`), camera coordinates, prop overrides, dynamic 3D props, and background textures.

## Unresolved Blindspots & Open Questions
- **Dual Directory Storage**: Saved states exist in both `/saved_states` and `/data/saved_states`. It is unverified whether `/data/saved_states` represents auto-saves while `/saved_states` represents user-triggered snapshots.

---

## 6. Automation Scripts & Standalone Subsystems

### 6.1 `scratch/` Directory

## Verified Evidence
- **Path**: `c:/Users/zakde/Desktop/AntiGravity projects/MyOS/scratch/`
- **File List (9 items)**:
  1. `scaffold_ontology.js` (5,984 bytes, 124 lines): Node.js script that parses `data/myontology-genome.xml` and writes React factor component file templates under `apps/web/src/[Pillar]/Factors/[Relationship]/[Gene].tsx`.
  2. `audit_ontology.js` (4,569 bytes, 97 lines): Node.js script that verifies existing files in `apps/web/src/` against the 1,110 nodes in `data/myontology-genome.xml`, outputting missing paths.
  3. `check_bones.js` (783 bytes, 24 lines): Bone structure verification helper for Mixamo armatures.
  4. `fix_jsx_arrows.js` (1,713 bytes, 39 lines): Utility script fixing malformed arrow functions in JSX files.
  5. `fix_nexus.js` (6,396 bytes, 126 lines): Patch script updating `NexusRouter.ts` and `BridgeService.ts`.
  6. `Hunyuan3D_Dockerfile` (996 bytes, 41 lines), `Hunyuan3D_Dockerfile_Fixed` (1,150 bytes), `Hunyuan3D_Dockerfile_V2` (1,238 bytes), `Hunyuan3D_docker-compose.yml` (509 bytes): Container build configurations for local 3D mesh generation service (Tencent Hunyuan3D).

## System Logic & Mechanics
`scratch/` contains developer automation tools used to scaffold the 1,000 gene React components, audit coverage, repair code syntax, and manage Docker containers for 3D model generation.

## Unresolved Blindspots & Open Questions
- **Container Execution State**: It is unknown whether the Hunyuan3D Docker containers are currently running on the host system or were executed as one-off asset generators.

---

### 6.2 `results/audit_report.json`

## Verified Evidence
- **Path**: `c:/Users/zakde/Desktop/AntiGravity projects/MyOS/results/audit_report.json`
- **File Size**: 13,993 bytes
- **JSON Structure**: Array of 11 audit objects.

**Sample Item (Lines 1–20)**:
```json
[
  {
    "folder": "'self-affirms-existence' App",
    "sequence": ["⚹", "🜄", "☉", "⚹", "☿", "🜄", "☉", "☿", "🜄", "⚹"],
    "rationale": "The applet, named 'self-affirms-existence', focuses on the core concept of Self (⚹) and its assertion of Existence (🜄)...",
    "suggested_name": "Existential Mirror",
    "suggested_description": "An applet that utilizes AI and 3D rendering to create a reflective space for self-affirmation and existential exploration."
  }
]
```

## System Logic & Mechanics
Records the output of an automated ontology alignment audit, mapping third-party candidate applications in `tmp/ingestion/` to 10-rune sequence addresses, rationale, and suggested names.

## Unresolved Blindspots & Open Questions
- **Target Applet Integration**: No automated script was found that consumes `results/audit_report.json` to automatically rename or refactor `tmp/ingestion/` folders.

---

### 6.3 `tmp/nexus_test/` & `tmp/ingestion/`

## Verified Evidence
- **Paths**:
  - `c:/Users/zakde/Desktop/AntiGravity projects/MyOS/tmp/nexus_test/` (15 TypeScript/JSON files)
  - `c:/Users/zakde/Desktop/AntiGravity projects/MyOS/tmp/ingestion/` (17 subdirectories)

**Subsystem Details**:
- `tmp/nexus_test/`: Standalone implementation of `nexus-context-server`, an MCP server (`@modelcontextprotocol/sdk`) providing persistent genetic memory. Key source files:
  - `fractalGenome.ts` (14,456 bytes, 158 lines): Defines rune-to-number dictionary (`🜋`=0, `⚹`=1, `☿`=2, `🜔`=3, `🝧`=4, `🜄`=5, `🜏`=6, `☉`=7, `♀`=8, `🜍`=9).
  - `nexusMemory.ts` (6,971 bytes, 202 lines): Handles 8-digit rune addressing and memory persistence.
  - `index.ts` (11,671 bytes, 328 lines): Stdio MCP server exposing tools to local LLM clients.
  - `ollamaClient.ts` (4,585 bytes, 101 lines): Connects to local Ollama API at `http://localhost:11434/api`.
  - `ingest_conversations.ts` & `ingest_ontology.ts`: Migration tools writing session logs to `%AppData%/Roaming/Antigravity/context_database/memory_core.json`.
- `tmp/ingestion/`: 17 cloned open-source projects (`Flowise`, `ant-design-pro`, `appsmith`, `arwes`, `cal.com`, `directus`, `excalidraw`, `forem`, `logseq`, `n8n`, `netdata`, `plane`, `refine`, `sentry`, `storybook`, `superset`, `ui`).

## System Logic & Mechanics
`tmp/nexus_test` is the prototype implementation of the Nexus MCP Memory Server. `tmp/ingestion` contains reference repositories analyzed by `parent_candidates.json` and `audit_report.json` for architectural alignment.

## Unresolved Blindspots & Open Questions
- **Location in `tmp/`**: Despite being critical server code, `nexus_test` resides under `/tmp/`. It is unverified if `nexus_test` is planned for promotion to `packages/nexus-context-server`.

---

## 7. Master Unresolved Blindspots & Cross-System Risk Matrix

| Risk / Gap Item | Location / Target | Description & Impact | Recommendation |
| :--- | :--- | :--- | :--- |
| **Empty Genome Map File** | `genome_map.json` | File is 0 bytes. Could cause null-pointer or JSON parse errors if imported directly by runtime modules. | Populate from `fractal_genome.json` or remove empty artifact. |
| **Missing Levels 3 & 4 Data** | `fractal_genome_standard.md` | Documents 100,000 nodes ($10^5$), but only 1,110 nodes exist in `myontology-genome.xml` and `fractal_genome.json`. | Generate Level 3 & 4 schema generator or clarify scope. |
| **UTF-16LE Encodings** | `sectors.json`, `data/MyOS.tree.md`, `data/tree.txt` | Encoded in UTF-16LE with BOM (`\uFEFF`), breaking standard UTF-8 JSON readers. | Convert files to standard UTF-8. |
| **Massive 2.88 GB Store File** | `data/myos_vector_store.json` | 2.88 GB single JSON object causes high memory overhead during full JSON deserialization in Node.js. | Migrate to SQLite vector extension or chunked JSON storage. |
| **Directory Duplication of Saved States** | `/saved_states` vs `/data/saved_states` | Dual storage locations with overlapping universe state files created on 2026-03-18. | Consolidate saved state persistence into a single canonical directory. |
| **Location of Subsystem in `/tmp`** | `tmp/nexus_test/` | Functional Nexus MCP Server codebase resides in temporary directory `tmp/`. | Move to `packages/nexus-context-server`. |

---
