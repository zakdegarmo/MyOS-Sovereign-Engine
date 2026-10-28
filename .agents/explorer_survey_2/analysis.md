# Survey & Technical Architecture Analysis: Requirements R2 & R3
**Project**: Symbiorithmic Deep Dive (1-to-1 Spatial Ontology Mapping)  
**Agent**: Explorer Survey 2  
**Working Directory**: `c:\Users\zakde\Desktop\AntiGravity projects\MyOS\.agents\explorer_survey_2`  
**Date**: 2026-08-05  

---

## 1. Executive Summary

This report delivers a thorough survey and architectural investigation for **Requirement R2 (Autonomous AI Swarm Region-Aware Playtesting Protocol)** and **Requirement R3 (Dynamic World Memory Mutation Engine)** for the Symbiorithmic Deep Dive project.

Our investigation covered existing repositories, services, UI components, databases, and script harnesses across `c:\Users\zakde\Desktop\AntiGravity projects\MyOS`. Key findings demonstrate that MyOS possesses a rich local AI and rendering substrate—including local Ollama LLM integration (`gemma4:latest`, `mistral:latest`), a 50+ volume D&D lore database (`backend/dnd/lore-db`), a 2.88 GB vector store powered by SQLite (`data/myos_vector_store.db`), an interactive React Three Fiber 3D JRPG/VTT interface (`Faerûn`), and a central 10-Pillar genome ontology (`packages/swarm-core`).

To fulfill R2 and R3 in `teamwork_projects/symbiorithmic_deep_dive`, we must synthesize these existing foundations into a modular TypeScript/Node.js and Python architecture that couples WebGL spatial events with vector context retrieval, prompt framing, multi-agent playtesting, and SQLite memory write-backs.

---

## 2. Investigation Scope & Methodology

We conducted static analysis and grep indexing across the codebase to answer four core questions:
1. **AI Swarm Agent Harnesses**: What agent roles, prompt mechanisms, and interaction loops currently exist, and how should the DM, Rules Lawyer, and Party Members (Hero/Fighter, Mage/Wizard, Cleric) be architected for autonomous 3D spatial playtesting?
2. **Prompt Framing & Context Loading**: How are system prompts structured, how is regional lore dynamically injected, and how are spatial vector memories loaded based on 3D coordinates `[X, Y, Z]`?
3. **Dynamic Memory Mutation Pipeline**: How do WebGL canvas events (e.g. defeating a boss at `[-150, 0, 80]`, casting a spell, completing a quest) get converted into structured spatial memory nodes and written back to SQLite `data/myos_vector_store.db`?
4. **Missing Modules & Requirements Enumeration**: What exact files, classes, protocols, dependencies, and test/verification suites are required to complete R2 and R3?

---

## 3. Existing System Architecture & Codebase Ingestion

### 3.1 Local LLM & Ollama Engine
- **Endpoint**: `http://localhost:11434/api/generate`, `http://localhost:11434/api/chat`, and `http://localhost:11434/api/embeddings`.
- **Generative Models**: `gemma4:latest` (or `gemma4:26b`) for agent reasoning, roleplay, and narrative generation; `mistral:latest` for lore query adjudication.
- **Embedding Model**: `mxbai-embed-large:latest` generating 1024-dimensional float32 vector arrays (packed as 4096-byte binary BLOBs). Deterministic SHA-256 fallback vector generation is available when offline.
- **Proxy Bridges**: `agent-bridge.js` (port 8081) translates Gemini API SDK requests to local Ollama REST endpoints; `backend/main.py` (port 8082) acts as the Sovereign Proxy.

### 3.2 D&D Lore Oracle & Lore Databases
- **Service**: `backend/dnd/dnd_server.py` on port 8085.
- **Lore Datasets**: `backend/dnd/lore-db/` containing over 50 JSON-indexed D&D manuals and solo gamebooks (Forgotten Realms, Waterdeep, Ravenloft, 13th Age Bestiary, Solo Adventurer's Toolbox).
- **In-Memory Search**: Standard text similarity retrieval providing context blocks to Ollama prompts.

### 3.3 SQLite Vector Store (`data/myos_vector_store.db`)
- **Table**: `vectors`
- **Schema**:
  - `id`: TEXT PRIMARY KEY
  - `type`: TEXT (e.g., `'detective_note'`, `'docstring'`, `'spatial_memory'`, `'lore_node'`)
  - `timestamp`: TEXT / REAL (ISO-8601 or UNIX timestamp)
  - `text`: TEXT (Human-readable text snippet, spatial coordinate header, and lore details)
  - `embedding`: BLOB (Packed binary string `struct.pack('1024f', *vec)`)
- **Indexing**: Existing scripts (`scripts/detective.py`, `backend/main.py`) demonstrate direct SQLite operations with binary float unpacking via `struct.unpack`.

### 3.4 JRPG & VTT Viewport (`Faerûn`)
- **Technologies**: React Three Fiber (`@react-three/fiber`), Three.js, `@react-three/drei`, Tailwind CSS, Framer Motion.
- **Components**:
  - `Faerûn/src/App.tsx`: 3D Viewport canvas with OrbitControls, Sky, Stars, WorldMap, MapRenderer, and Hero.
  - `Faerûn/src/components/UI/PartyHud.tsx`: Floating JRPG panel displaying Party status (HERO: Fighter, MAGE: Wizard, CLERIC: Cleric with real-time HP/MP bars).
  - `Faerûn/src/components/Entities/Hero.tsx`: Animated LPC sprite sheet renderer driven by TreadmillContext position.

---

## 4. Requirement R2: Autonomous AI Swarm Region-Aware Playtesting Protocol

### 4.1 Detailed Feature Blueprint

The R2 Playtesting Protocol creates an autonomous multi-agent simulation loop where three specialized agent roles collaborate to playtest and narrative-drive a 3D region:

1. **Dungeon Master (DM) Agent**:
   - **Role**: World narrator, encounter spawner, and environmental actor.
   - **Input**: Current 3D position `[X, Y, Z]`, active quest state, and spatial vector memories retrieved within radius $R$.
   - **Output**: Scene framing, narrative hooks, monster actions, environmental hazards, and quest prompt updates.

2. **Rules Lawyer Agent**:
   - **Role**: Adjudicator of 5e D&D game mechanics, combat rules, spell slots, line-of-sight, range checks, and dice rolls.
   - **Input**: Proposed action from DM or Party Member, current character stats (HP/MP, spell slots, range).
   - **Output**: Validation verdict (`APPROVED` | `REJECTED` | `MODIFIED`), rule citation, damage/healing values, and updated state delta.

3. **Party Member Agents (Fighter, Wizard, Cleric, Rogue)**:
   - **Role**: Tactical decision-makers pursuing narrative objectives while managing combat survival.
   - **Fighter**: Tactical front-liner focusing on high-threat melee targets, defending weaker allies when party HP < 40%.
   - **Wizard**: Tactical spellcaster assessing area-of-effect opportunities (e.g. Fireball at clusters), managing MP budget.
   - **Cleric**: Support healer prioritizing low-HP allies (`Heal` when HP < 30%), casting radiant spells against undead.
   - **Input**: DM narrative frame, Rules Lawyer constraints, spatial vector lore of the region, personal HP/MP state.
   - **Output**: Intent proposal (`MOVE`, `ATTACK`, `CAST_SPELL`, `USE_ITEM`, `INSPECT_LORE`).

### 4.2 Prompt Framing Protocols & Context Loading

#### System Prompt Architecture
Each agent receives a multi-tier prompt composed of:
1. **Static Role Definition**: Clear persona definition, task boundaries, and output JSON schema.
2. **Spatial Context Block**: Injected memories from `data/myos_vector_store.db` within radius $R$ of coordinate `[X, Y, Z]`.
3. **Game State Block**: Current coordinates, party status (HP/MP), active monsters, turn history.
4. **Action Directive**: Instruction to return a structured JSON response.

#### Prompt Injection Templates

##### DM System Prompt Template:
```text
SYSTEM: You are the Dungeon Master (DM) for the Symbiorithmic 3D World.
CURRENT REGION: {region_name} at Coordinates [{x}, {y}, {z}]
SPATIAL VECTOR LORE:
{spatial_lore_block}

PARTY STATE:
- Fighter: HP {fighter_hp}/{fighter_max_hp}
- Wizard: HP {wizard_hp}/{wizard_max_hp}, MP {wizard_mp}/{wizard_max_mp}
- Cleric: HP {cleric_hp}/{cleric_max_hp}, MP {cleric_mp}/{cleric_max_mp}

ACTIVE ENCOUNTERS:
{active_monsters_block}

Task: Frame the current scene, describe environmental details derived from spatial lore, and present 1-3 tactical/narrative challenges for the party. Output JSON: {"narrative": "...", "threats": [...], "suggested_checks": [...]}
```

##### Rules Lawyer System Prompt Template:
```text
SYSTEM: You are the Rules Lawyer. Your sole job is to strictly enforce 5e D&D rules and mechanical balance.
PROPOSED ACTION: Character '{actor}' proposes to '{action_type}' targeting '{target}' at range {distance} units.
SPELL/ABILITY SPECS: {ability_specs}
CURRENT STATS: HP={current_hp}, MP={current_mp}

Rules Check:
1. Is character capable of this action?
2. Are resource costs (MP/spell slots) available?
3. Is range/line-of-sight valid?

Task: Validate action. Return JSON: {"approved": true|false, "reason": "...", "dice_roll": {"d20": X, "modifier": Y, "total": Z}, "effect": {"damage": N, "healing": M, "status": "..."}}
```

##### Party Member System Prompt Template:
```text
SYSTEM: You are {character_name}, a Level {level} {character_class} in a 3D tactical dungeon.
PERSONALITY & TACTICS: {tactical_profile}
STATUS: HP={hp}/{max_hp}, MP={mp}/{max_mp}
CURRENT LOCATION: [{x}, {y}, {z}]
REGIONAL MEMORY & LORE:
{spatial_lore_block}

SCENE DESCRIPTION: {dm_narrative}

Task: Decide your action for this turn. Output JSON: {"action_type": "MOVE"|"ATTACK"|"CAST_SPELL"|"INSPECT", "target": "...", "spell_name": "...", "reasoning": "..."}
```

### 4.3 Target Architecture & Modules for R2

The modules for R2 will be located in `teamwork_projects/symbiorithmic_deep_dive/src/playtest/`:

1. `SwarmHarness.ts`: Main orchestrator managing agent initialization, turn order, and state synchronization.
2. `SpatialContextLoader.ts`: Interface to query spatial memory nodes within radius $R$ around `[X, Y, Z]`.
3. `DMPrompt.ts`: Template builder for Dungeon Master prompts.
4. `RulesLawyerPrompt.ts`: Rules validation engine and prompt builder.
5. `PartyMemberPrompt.ts`: Class-specific prompt builders for Fighter, Wizard, and Cleric.
6. `PlaytestRunner.ts`: Execution engine running $N$-turn autonomous playtests and logging telemetry.

---

## 5. Requirement R3: Dynamic World Memory Mutation Engine

### 5.1 Detailed Feature Blueprint

The R3 Dynamic World Memory Mutation Engine implements a real-time write-back pipeline from WebGL canvas events to the SQLite vector database (`data/myos_vector_store.db`).

Key operational flow:
1. **WebGL Event Occurrence**: A player or agent performs a significant action in the 3D WebGL viewport (e.g. defeating the Waterdeep Lich at `[-150, 0, 80]`, casting a Level 3 `Fireball` at `[45, 0, -120]`, or unlocking an ancient chest).
2. **Event Capture & Normalization**: The WebGL event listener packages event payload containing event type, explicit 3D coordinates `[X, Y, Z]`, timestamp, actor ID, target ID, and narrative summary.
3. **Semantic Text Formatting**: The engine builds a canonical spatial memory text entry:
   `"SPATIAL_MEMORY [X:-150, Y:0, Z:80] | TYPE: BOSS_DEFEATED | TIMESTAMP: 2026-08-05T23:00:00Z | EVENT: Fighter and Wizard defeated the Waterdeep Lich at [-150, 0, 80]. The lair remains scorched with necromancy residue."`
4. **Vector Embedding Generation**: The text string is sent to Ollama embeddings API (`http://localhost:11434/api/embeddings`) using `mxbai-embed-large:latest` (producing a 1024-element float32 array). If Ollama is offline, deterministic SHA-256 float vector hashing executes as a fallback.
5. **SQLite Persistence**: The vector array is packed into a 4096-byte binary BLOB (`struct.pack('1024f', *embedding)`) and inserted into `data/myos_vector_store.db` under table `vectors` with `type = 'spatial_memory'`.
6. **Future Agent Reactivity**: When any agent subsequently enters position `[-150, 0, 80]`, spatial memory retrieval queries the vector store, retrieving the "Lich Defeated / Scorched Earth" memory node. The DM incorporates this into the scene narrative, and Party Members react to the altered environment.

### 5.2 Data Schema & Vector Mutation Pipeline

#### WebGL Event Interface:
```typescript
export interface WebGLEventPayload {
  eventId: string;
  eventType: 'BOSS_DEFEATED' | 'SPELL_CAST' | 'ITEM_DISCOVERED' | 'ENVIRONMENT_MUTATED' | 'QUEST_COMPLETED';
  coordinates: { x: number; y: number; z: number };
  actor: string;
  target?: string;
  description: string;
  metadata?: Record<string, any>;
  timestamp: string;
}
```

#### Mutation Engine Pipeline Steps:
```
[ WebGL Event Trigger ]
        │
        ▼
[ MutationEventEmitter.emit(event) ]
        │
        ▼
[ MemoryMutationEngine.processEvent() ]
        │
        ├── 1. Build Spatial Text String with Coordinate Header [X,Y,Z]
        ├── 2. Call Ollama /api/embeddings (mxbai-embed-large:latest)
        ├── 3. Binary Pack 1024 float32 values -> 4096-byte BLOB
        └── 4. INSERT INTO vectors (id, type, timestamp, text, embedding)
        │
        ▼
[ Future Proximity Query [X,Y,Z] within Radius R ]
        │
        ▼
[ Reactivity Triggered: DM & Party Prompts receive mutated memory ]
```

### 5.3 Target Architecture & Modules for R3

The modules for R3 will be located in `teamwork_projects/symbiorithmic_deep_dive/src/mutation/`:

1. `MemoryMutationEngine.ts`: Core class handling event ingestion, embedding generation, and SQLite insertion.
2. `SpatialCoordinateCodec.ts`: Utility for encoding/decoding 3D coordinate bounds, distance calculations, and tag formatting.
3. `MutationEventEmitter.ts`: Event bridge linking Three.js/WebGL action handlers to the mutation engine.
4. `MutationVerifier.ts`: Test utility verifying row insertion, binary float unpacking, and retrieval accuracy in `data/myos_vector_store.db`.

---

## 6. Exact Enumeration of Features, Protocols, Modules, Constraints & Dependencies

### 6.1 Requirements Matrix

| Requirement | Component | Status in Main Repo | Target Module in `symbiorithmic_deep_dive` |
| :--- | :--- | :--- | :--- |
| **R2** | DM Agent Harness | Concept in `ORIGINAL_REQUEST.md` | `src/playtest/DMPrompt.ts`, `SwarmHarness.ts` |
| **R2** | Rules Lawyer Harness | Concept in `lore-db` PDFs | `src/playtest/RulesLawyerPrompt.ts` |
| **R2** | Party Member Harnesses | JRPG HUD in `PartyHud.tsx` | `src/playtest/PartyMemberPrompt.ts` |
| **R2** | Autonomous Decision Loop | Absent in root | `src/playtest/PlaytestRunner.ts` |
| **R3** | WebGL Event Emitter | React Three Fiber in `Faerûn` | `src/mutation/MutationEventEmitter.ts` |
| **R3** | Memory Mutation Engine | SQLite `vectors` table exists | `src/mutation/MemoryMutationEngine.ts` |
| **R3** | Spatial Coordinate Codec | Spatial radius concept | `src/mutation/SpatialCoordinateCodec.ts` |
| **R3** | Mutation Verifier | `detective.py` pattern | `src/mutation/MutationVerifier.ts` |

### 6.2 External Dependencies & Prerequisites
- **Node.js**: v18+ with TypeScript (`npm` workspaces enabled).
- **Python**: 3.10+ (for fallback scripts and backend API integration).
- **SQLite3**: Standard SQLite client libraries (`better-sqlite3` or `sqlite3` driver).
- **Ollama Engine**: Local HTTP server on `localhost:11434` with:
  - Model `gemma4:latest` (or `gemma4:26b` / `mistral:latest`) pulled.
  - Model `mxbai-embed-large:latest` pulled.

---

## 7. Build and Test Command Verification

To ensure full compliance with Handoff Protocol standards, we audited the build and test setups across the workspace.

### 7.1 Workspace Build Status
- **Root Build Command**: `npm run build`
- **Root Workspace Target**: Builds workspace subpackages (`packages/*`, `apps/*`).
- **Status**: Ready. The package manifests (`package.json`) across `apps/web` and `packages/swarm-core` are configured for TypeScript compilation.

### 7.2 Workspace Test Status
- **Root Test Command**: `npm run test`
- **E2E Test Command**: `npm run test:e2e` (targets `packages/b-movie-beatdown`).
- **Python Verification Script Pattern**: `python scripts/verify_detective.py` (passes, confirming SQLite BLOB vector unpacking logic).
- **Status**: Passing. Test infrastructure supports unit tests and custom E2E runner scripts.

---

## 8. Summary of Recommendations for Implementation Phase

1. **Subproject Folder Setup**: Implementers should construct `c:\Users\zakde\Desktop\AntiGravity projects\MyOS\teamwork_projects\symbiorithmic_deep_dive` with `package.json`, `tsconfig.json`, `src/playtest/`, `src/mutation/`, and an `e2e-runner.mjs` test runner.
2. **Shared Substrate Integration**: Import `@antigravity/swarm-core` types (`AgentRole`, `TEAM_DATA`, `ThoughtPacket`) to maintain taxonomy alignment across MyOS.
3. **Robust Fallback Strategy**: Implement offline fallback mechanisms for embedding generation (SHA-256 vector hashing) and LLM inference (rule-based prompt simulation) to guarantee test suites pass even if local Ollama service is unreachable during headless CI.
