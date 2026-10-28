---
title: "M1 Root Configuration & Infrastructure Analysis Report"
agent: "Explorer M1"
date: "2026-07-21"
scope: "Root Configuration & Infrastructure Files (Phase 1: Perimeter & Phase 5: Tooling)"
status: "Completed"
---

# Executive Summary

This report documents the findings from the zero-knowledge exploration of the root directory configuration, infrastructure manifests, operational guidelines, task ledgers, and automation scripts of the **MyOS** codebase. 

The investigation strictly adheres to the **Zero Knowledge Bias Protocol**: every statement is grounded in verbatim source code and configuration declarations with exact file paths and line numbers. Missing files, unverified endpoints, external drive dependencies, and referenced variables are recorded as explicit **Unresolved Blindspots**.

---

# 1. Root Workspace Configuration & Build Inputs (Phase 1: Perimeter)

## `package.json`

### Verified Evidence
- **File Path**: `c:/Users/zakde/Desktop/AntiGravity projects/MyOS/package.json`
- **Package Identity**: Name is `"antigravity-swarm"` (line 2), version `"0.0.1"` (line 3), marked as `"private": true` (line 4).
- **Workspace Architecture**: Configured as an npm workspace monorepo targeting `"packages/*"` and `"apps/*"` (lines 5-8).
- **Declared NPM Scripts** (lines 9-15):
  - `"dev"`: `"npm run dev --workspace=apps/web"` (line 10)
  - `"build"`: `"npm run build --workspaces"` (line 11)
  - `"test"`: `"npm run test --workspaces"` (line 12)
  - `"grub-lpc"`: `"node scripts/lpc_grubber.mjs"` (line 13)
  - `"extract-lpc"`: `"node scripts/lpc_extractor.mjs"` (line 14)
- **Dependencies & Tooling**:
  - `devDependencies`: `concurrently` (^9.0.0), `ts-node` (^10.9.2), `typescript` (^5.0.0) (lines 16-20).
  - `dependencies`: `@react-three/drei` (^10.7.7), `@react-three/fiber` (^9.5.0), `@swc/core` (^1.15.11), `@types/d3` (^7.4.3), `@types/three` (^0.183.0), `d3` (^7.9.0), `fs-extra` (^11.3.3), `glob` (^13.0.6), `path` (^0.12.7), `simple-git` (^3.32.2), `three` ("0.183.2"), `three-stdlib` (^2.36.1) (lines 21-34).

### System Logic & Mechanics
- The project root acts as an overarching orchestrator (`antigravity-swarm`) for workspace applications (`apps/web`, `apps/genesis`) and packages (`packages/library`, `packages/swarm-core`, `packages/glyphrider`, `packages/neon-nightmare`, `packages/archive`).
- The primary development target for `npm run dev` is delegated directly to `apps/web`.

### Unresolved Blindspots & Open Questions
- `package.json` names the root `"antigravity-swarm"`, whereas surrounding documentation references `"MyOS"`.
- Workspace directories `apps/SonicLattice` and `apps/godot` exist on disk but are not explicitly referenced as separate packages in root `package.json`.

---

## `tsconfig.json`

### Verified Evidence
- **File Path**: `c:/Users/zakde/Desktop/AntiGravity projects/MyOS/tsconfig.json`
- **Compiler Options** (lines 2-19):
  - `"target"`: `"ES2022"` (line 3)
  - `"module"`: `"NodeNext"` (line 4)
  - `"moduleResolution"`: `"NodeNext"` (line 5)
  - `"lib"`: `["ES2022", "DOM"]` (lines 6-9)
  - Flags: `"declaration": true`, `"declarationMap": true`, `"sourceMap": true`, `"strict": true`, `"esModuleInterop": true`, `"skipLibCheck": true`, `"forceConsistentCasingInFileNames": true`, `"composite": true`, `"rootDir": "."` (lines 10-18).
- **Exclusions**: `["node_modules", "dist"]` (lines 20-23).

### System Logic & Mechanics
- Uses TypeScript `NodeNext` module resolution and ES2022 target with composite building enabled for project references/workspaces.

### Unresolved Blindspots & Open Questions
- No `references` array is defined in root `tsconfig.json` even though `"composite": true` is enabled.

---

## Workspace Lock Files (`package-lock.json` & `bun.lockb`)

### Verified Evidence
- **File Paths**: `c:/Users/zakde/Desktop/AntiGravity projects/MyOS/package-lock.json` & `c:/Users/zakde/Desktop/AntiGravity projects/MyOS/bun.lockb`
- `package-lock.json` (lines 1-100): Lockfile version 3. Defines root workspace dependencies and workspace package configurations for `apps/genesis` and `apps/web`.
  - `apps/web` includes dependencies: `@antigravity/swarm-core`, `@google/genai`, `@monaco-editor/react`, `@myos/glyphrider`, `@myos/neon-nightmare`, `@orama/orama`, `@pixi/react`, `@react-three/drei`, `@react-three/fiber`, `@react-three/rapier`, `@xterm/xterm`, `excalibur`, `framer-motion`, `idb`, `lucide-react`, `mammoth`, `pdf-parse`, `pdfjs-dist`, `pixi.js`, `react`, `react-dom`, `react-force-graph-2d`, `react-force-graph-3d`, `react-markdown`, `skia-canvas`, `tesseract.js`, `three`, `tone`, `zustand`.
- `bun.lockb` exists on disk (size 332,472 bytes), indicating Bun package manager has also been used in this workspace.

### System Logic & Mechanics
- Multi-engine package management support (NPM lockfile v3 + Bun lockfile). `apps/web` aggregates 3D graphics (ThreeJS, R3F, Rapier physics, Force Graphs), 2D graphics (PixiJS, Excalibur, Skia), OCR/PDF parsing (Tesseract, PDF.js, Mammoth), terminal emulation (Xterm), and AI models (Google GenAI, Orama search).

### Unresolved Blindspots & Open Questions
- Coexistence of `bun.lockb` and `package-lock.json` suggests potential package resolution divergence if developers alternate between `bun` and `npm`.

---

## Environment & Gatekeeper Config (`.env.local` & `.gitignore`)

### Verified Evidence
- **File Path**: `c:/Users/zakde/Desktop/AntiGravity projects/MyOS/.env.local`
  - Line 1: `GEMINI_API_KEY=AIzaSyC0HFuLAY547dpO9Evap9xnlrq47pnNjPM`
  - Line 2: `VITE_GEMINI_API_KEY=AIzaSyC0HFuLAY547dpO9Evap9xnlrq47pnNjPM`
  - Line 3: `EMAIL_USER=zakdegarmo@gmail.com`
  - Line 4: `EMAIL_PASS=@dragonfucker68`
- **File Path**: `c:/Users/zakde/Desktop/AntiGravity projects/MyOS/.gitignore`
  - Ignores: `node_modules`, `.env.local`, `.venv/`, `__pycache__/`, `data/`, `recordings/`, `saved_states/`, `myos_vector_store.json`, `*.mp4`, `artifacts/`, `*.log` (lines 1-15).

### System Logic & Mechanics
- `.env.local` provides credentials for cloud LLM services (Google Gemini API) and email functionality for local scripts. `.gitignore` ensures credentials, vector indexes, media recordings, and virtual environments remain uncommitted.

### Unresolved Blindspots & Open Questions
- Security Risk: Live API key and plain-text email password are committed in raw file `.env.local` in the local workspace directory.

---

## Protocol & Agent Operational Rules (`.clinerules`)

### Verified Evidence
- **File Path**: `c:/Users/zakde/Desktop/AntiGravity projects/MyOS/.clinerules`
- **Title**: `NEXUS CONTEXT PROTOCOL (v2.0 - CRUCIBLE ENFORCED)` (line 1).
- **Core Directives**:
  1. `RECALL`: Call `query_memory` before starting tasks (lines 5-7).
  2. `RECORD`: Minting Protocol using 10-Symbol Recursive Addressing: `🜋=0` (Omni), `⚹=1` (Self), `☿=2` (Thought), `🜔=3` (Logic), `🝩=4` (Conjunction/Unity), `🜄=5` (Existence), `🜏=6` (Improvement), `☉=7` (Mastery), `♀=8` (Resonance), `🜍=9` (Transcendence) (lines 9-13). Emits JSON-LD transaction block (`OntologicalTransaction`) into `ontoWallet` (lines 14-29).
  3. `THE CRUCIBLE MANDATE`: 27-point Evaluation Prism across Friction (CPU/RAM/GPU, Namespace/Dependency/SideEffect, UX/Attention/Manual), Elegance (Naming/Traceability/Cohesion, Density, Symmetry/Complexity/Depth), and Potency (Portability, Anti-Fragility, Teleology/Intent). Minimum Omni Score threshold: 0.7 (lines 31-36).
  4. `OLLAMA EFFICIENCY`: Local RAG using precision context (lines 38-40).
  5. `THE ARCHIVIST DATA RESCUE WORKFLOW`: Strategy for heavy folders in `C:\Users`, `Downloads`, `N:\`. Cross-reference `apps/web/src`, archive losslessly to `N:\MyOS_Archives` or integrate under `apps/web/public/integrations/[Pillar]`. Ban on Docker due to disk space constraints (lines 43-52).
  6. `RUN ON BOOT SEQUENCE`: Execute `/timekeeper`, `/familiarize`, `/status_report` (lines 54-59).
  7. `OMNISCIENCE (THE SEMANTIC INDEX)`: Orama vector index served by `agent-bridge.js` at `POST /api/search` (lines 60-65).

### System Logic & Mechanics
- Governs autonomous agent behavior, data preservation workflows, economic minting of ontological currency, quality control (The Crucible), and boot sequence initialization.

### Unresolved Blindspots & Open Questions
- `/timekeeper`, `/familiarize`, and `/status_report` commands are specified as boot commands, but their corresponding execution scripts are located in `.agents/workflows/` or slash commands, not in the standard JS package scripts.

---

# 2. Master System Specifications & Ledgers (Phase 1: Perimeter)

## `PROJECT.md`

### Verified Evidence
- **File Path**: `c:/Users/zakde/Desktop/AntiGravity projects/MyOS/PROJECT.md`
- **Title**: Spatial OS Filesystem Bridge and HyperObject Launcher (line 1).
- **Architecture Stack** (lines 3-7):
  - Node.js backend bridge: `apps/web/agent-bridge.js` (REST endpoints on port 8081).
  - React/Three.js frontend: `apps/web/src/components/MaxOverlay/AvatarScene.tsx` (3D desktop shortcut meshes).
  - Client-side WASM retro OS: JS-DOS/console in virtual display mesh.
  - WebRTC signalling and input relay for whitelisted Peer IDs.
- **Milestones** (lines 9-17):
  - Milestone 1: Backend Bridge (`agent-bridge.js`, `verify_bridge.js`) -> `IN_PROGRESS (delegated to sub_orch_m1)`
  - Milestone 2: Spatial Renderer (`AvatarScene.tsx`, 3D file mapping, double-click launch) -> `PLANNED`
  - Milestone 3: Virtual Monitor (JS-DOS WASM environment, hybrid local/CDN) -> `PLANNED`
  - Milestone 4: WebRTC Input & Security (Input relay, public-key ID whitelist) -> `PLANNED`
  - Milestone 5: E2E & Hardening -> `PLANNED`
- **Interface Contracts** (lines 18-26):
  - `GET /api/desktop/files` -> returns `[{name, path, isShortcut, target}]`
  - `POST /api/win/launch` -> body `{target: string}` -> launches standard/whitelisted commands natively or prompts for external scripts.
  - WebRTC Input Protocol: `{type: "mousemove"|"mousedown"|"mouseup"|"keydown"|"keyup", data: any, publicKey: string}`

### System Logic & Mechanics
- Outlines the spatial desktop replacement system where physical host OS shortcuts are converted to 3D interactive objects in a web interface connected to port 8081.

### Unresolved Blindspots & Open Questions
- `PROJECT.md` notes Milestone 1 as `IN_PROGRESS (delegated to sub_orch_m1)`, but current parent conversation ID in active briefing is `eecd66dd-5f34-4959-b7c6-dabc50c39b7c`.

---

## `README.md` & `LAUNCH_INSTRUCTIONS.md`

### Verified Evidence
- **File Paths**: `c:/Users/zakde/Desktop/AntiGravity projects/MyOS/README.md` & `LAUNCH_INSTRUCTIONS.md`
- **Port Mapping**:
  - `apps/web/agent-bridge.js`: Port **8081** (Host OS filesystem bridge & search) (`README.md` line 24, `LAUNCH_INSTRUCTIONS.md` line 36).
  - `apps/web/swarm-server.js` / Vite Dashboard: Port **3000** (Swarm telemetry, dashboard, chat bus) (`README.md` line 25, `LAUNCH_INSTRUCTIONS.md` line 35).
  - `apps/web/tcp-node.js`: Port **8080** (Primordial Dawn TCP heartbeat node) (`README.md` line 26).
- **Prerequisites**: Node.js v18+, `npm install`, Ollama with `gemma4:latest` model (`LAUNCH_INSTRUCTIONS.md` lines 9-22).
- **Primary Execution Command**: `npm run dev` (`LAUNCH_INSTRUCTIONS.md` line 31).
- **10-Pillar System Structure**: Located in `apps/web/src/` (Existence, Improvement, Logic, Mastery, Omni, Resonance, Self, Thought, Transcendence, Unity) with internal `Factors/` folders (`README.md` lines 45-58).

### System Logic & Mechanics
- Describes the off-grid desktop suite combining a 3D WebGL interface (port 3000), host bridge server (port 8081), local LLM engine (Ollama on port 11434 with `gemma4`), and a D&D Virtual Tabletop (VTT) cartridge accessible via the Omni tab (`🜋`).

### Unresolved Blindspots & Open Questions
- `LAUNCH_INSTRUCTIONS.md` states `npm run dev` starts all necessary services, but `package.json` defines `"dev": "npm run dev --workspace=apps/web"`. It does not explicitly launch `agent-bridge.js` or `swarm-server.js` unless `apps/web`'s local `package.json` uses `concurrently`.

---

## `MASTER_TASK_LEDGER.md`, `TODO.md`, `implementation_plan.md`, `task.md`, & `council_config.json`

### Verified Evidence
- **File Path**: `c:/Users/zakde/Desktop/AntiGravity projects/MyOS/MASTER_TASK_LEDGER.md`
  - Active priorities: `SYS-01` (Delete "The Forge" garbage/rename to "The Core" - In-Progress), `UI-01` (Fix `NexusContainer` recursion - In-Progress), `UI-02` (Audit Nested Docks - Pending), `GAME-01` (ZAMN 3D Mode 8 engine - Pending), `AL-01` (Connect `AnalysisLab.tsx` to Gemini - Pending), `MEM-01` (Implement `MemCube.add()` to `memory_core.json` - Pending) (lines 8-16).
  - Technical Debt: Vector Service distance calculation placeholders, The Forge Persistence log-only stub, TCP Node ghost node, Library Sync (lines 20-25).
- **File Path**: `c:/Users/zakde/Desktop/AntiGravity projects/MyOS/TODO.md`
  - Domain 1: OBS WebSocket integration (port 4455) for `/api/vision/capture`; `swarm-server.js` chat persistence (lines 5-8).
  - Domain 4: `forge_2d_assets` skill with Pillow chroma-key background removal (lines 18-20).
- **File Path**: `c:/Users/zakde/Desktop/AntiGravity projects/MyOS/implementation_plan.md`
  - 3-Layer Visual Ecosystem: Layer A (Back: 3D Knowledge Graph with 1-6 Glyph labels), Layer B (Middle: Panels/Terminals), Layer C (Front: 3D Holodeck & Cartesian grid with 10 Pillar Avatars) (lines 5-24).
  - 10-Layer Fractal Composition Stack: Layer 0 Nexus (1), Layer 1 Pillars (10), Layer 2 Relationships (100), Layer 3 Genes (1,000), Layer 4 Proteins (10,000), Layer 5 Molecules (100,000), Layer 6 Atoms (1,000,000), Layer 7 Electrons (10,000,000), Layer 8 Quarks (100,000,000), Layer 9 Strings/Echoes (1,000,000,000) (lines 29-39).
- **File Path**: `c:/Users/zakde/Desktop/AntiGravity projects/MyOS/council_config.json`
  - Defines 3D visual properties, color codes, pillar indices (1-10), emojis (`⚹`, `☿`, `🜔`, `🝧`, `🜄`, `🜏`, `☉`, `♀`, `🜍`, `🜋`), sprite URL (`/textures/council_sprites.png`), and floor/camera/light/wall 3D transforms for the 10 council agents (lines 1-288).

### System Logic & Mechanics
- Tracks macro architectural evolution, 3D rendering stack requirements, active technical debt, and 3D scene coordinate layout for the 10 Council Aspect Avatars.

### Unresolved Blindspots & Open Questions
- `MASTER_TASK_LEDGER.md` marks `SYS-01` ("Cleanup: Delete 'The Forge' garbage") as In-Progress, but `council_config.json.crswap` still exists in the root directory.

---

# 3. Infrastructure & Automation Framework (Phase 5: Tooling)

The `scripts/` directory contains 19 root script files and 5 subdirectories (`ingestion/`, `node/`, `python/`, `tests/`, `tools/`).

```text
scripts/
├── clean_spritesheet.py
├── dev_omega.mjs
├── evaluate_cartridge.mjs
├── fix_missing_factors.mjs
├── generate_council_facials.py
├── generate_ontology_xml.py
├── generate_placeholders.py
├── lpc_extractor.mjs
├── lpc_grubber.mjs
├── lpc_grubber.ts
├── lpc_sanitizer.py
├── lpc_scraper.py
├── lpc_semantic_manifest.mjs
├── nervous_system_bridge.js
├── patch_orchestrator.js
├── process_door.py
├── purge_macosx.mjs
├── scaffold_backend.ts
├── slice_assets.py
├── ingestion/ (23 files)
├── node/ (10 files)
├── python/ (9 files)
├── tests/ (6 files)
└── tools/ (2 files)
```

## Environment Launcher (`scripts/dev_omega.mjs`)

### Verified Evidence
- **File Path**: `c:/Users/zakde/Desktop/AntiGravity projects/MyOS/scripts/dev_omega.mjs`
- **External Dependency Check** (lines 13-31): Checks for sibling directories in parent folder (`..`):
  - `NEXUS_MCP_PATH`: `../nexus-context-server` (line 14).
  - `STORAGE_SERVER_PATH`: `../the-mystra-nexus` (line 15).
  - Exits with `FATAL` error if either directory is missing (lines 24-26).
- **Service Orchestration** (lines 38-62): Uses `concurrently` to spawn 4 processes:
  1. `ollama serve` (LLM-ENGINE)
  2. `node server.js` in `../the-mystra-nexus` (STORAGE-DB)
  3. `npx tsx index.ts` in `../nexus-context-server` (NEXUS-MCP)
  4. `npm run dev --workspace=apps/web` in `ROOT_DIR` (FRONTEND-APP)

### System Logic & Mechanics
- Master startup runner for the entire ecosystem. Binds local Ollama LLM, Mystra Storage Server, Nexus MCP Server, and MyOS Web App concurrently.

### Unresolved Blindspots & Open Questions
- Running `scripts/dev_omega.mjs` will fail hard if sibling repositories `nexus-context-server` or `the-mystra-nexus` are not present at `c:/Users/zakde/Desktop/AntiGravity projects/`.

---

## Cartridge Auditor & Evaluator (`scripts/evaluate_cartridge.mjs`)

### Verified Evidence
- **File Path**: `c:/Users/zakde/Desktop/AntiGravity projects/MyOS/scripts/evaluate_cartridge.mjs`
- **Configuration** (lines 9-28):
  - Loads `.env.local` from `../apps/web/.env.local` via `dotenv` (lines 9-13).
  - Reads `GEMINI_API_KEY` or `VITE_GEMINI_API_KEY` (line 20).
  - Targets model: `gemini-2.0-flash` via URL `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent` (lines 27-28).
- **Fallback Substrate** (lines 34-54): If Google Cloud API fails, sends HTTP POST to local server at `http://localhost:3000/chat` using local `mistral` model.
- **Auditing Mechanism** (lines 84-214): Reads `package.json`, `README.md`, `index.html`, `main.js`, or `App.tsx` from folders in `apps/web/src/integrations` or `apps/web/public/integrations/integrations`. Prompts model to assign a 10-depth genomic sequence across the 10 Pillars and outputs JSON report to `results/audit_report.json` (lines 209-213).

### System Logic & Mechanics
- Automated genomic classifier for imported software applets/cartridges, integrating cloud Gemini API with a local fallback substrate.

### Unresolved Blindspots & Open Questions
- Target directory in script defaults to `apps/web/src/integrations`, but also checks `apps/web/public/integrations/integrations`.

---

## Asset Scraping & LPC Management Pipeline

### Verified Evidence
- **`scripts/lpc_scraper.py`**:
  - Uses Selenium headless Chrome (`webdriver.ChromeOptions()`) and `BeautifulSoup` to scrape `https://opengameart.org` for LPC assets (lines 22-53). Downloads files to `scripts/tmp_lpc` and categorizes them into `apps/web/public/assets/lpc/[category]/` (`body`, `hair`, `torso`, `legs`, `headgear`, `weapon`, `misc`) (lines 112-134).
- **`scripts/lpc_grubber.mjs`** (Triggered via `npm run grub-lpc`):
  - Scrapes `https://opengameart.org/content/lpc-collection` using Node HTTP fetch & streams (lines 18-50). Downloads sprite archives to `apps/web/public/assets/lpc` and writes `asset_manifest.json` (lines 80-106).
- **`scripts/lpc_extractor.mjs`** (Triggered via `npm run extract-lpc`):
  - Scans `apps/web/public/assets/lpc`, extracts `.zip`, `.7z`, `.tar.gz` archives using system `tar -xf` (lines 40-56), moves processed archives to `archives_processed/` (lines 60-62), and updates `asset_manifest.json` with relative `.png` file paths (lines 27-36).
- **`scripts/lpc_sanitizer.py` & `scripts/lpc_semantic_manifest.mjs`**:
  - `lpc_sanitizer.py` cleans transparency/color grids using PIL.
  - `lpc_semantic_manifest.mjs` builds semantic lookup tables for LPC body parts.

### System Logic & Mechanics
- Automated pipeline for downloading, extracting, sanitizing, and cataloging open-source Universal LPC 2D sprite assets into public static assets for paperdoll avatar rendering.

### Unresolved Blindspots & Open Questions
- `lpc_scraper.py` requires local Chrome and ChromeDriver binaries. `lpc_extractor.mjs` relies on Windows system `tar` binary.

---

## Security & Bridge Verification Scripts (`scripts/node/`)

### Verified Evidence
- **`scripts/node/verify_bridge.js`**:
  - Executes unit verification against `http://localhost:8081`:
    1. `GET /api/desktop/files`: Asserts 200 status, array response, and keys `['name', 'path', 'isShortcut', 'target']` (lines 51-72).
    2. `POST /api/win/launch`: Sends `{ target: 'notepad' }`, asserts 200 status and `success: true` (lines 74-85).
- **`scripts/node/verify_security_fixes.js`**:
  - Tests `isSafePath` logic: Path must be inside project root, `N:\`, `E:\`, `C:\Users\zakde\.gemini`, `C:\Users\zakde\Downloads`, or `C:\Users\zakde\Desktop` (lines 13-28, 43-71).
  - Tests `checkWhitelist` logic: Forbids special characters `[&|;$\n\r\`<>\/]` and requires bare executable names matching whitelist `Set(['notepad', 'calc', 'explorer', 'cmd', 'powershell', 'taskmgr', 'mspaint', 'write'])` (lines 30-41, 73-97).
- **`scripts/node/bundle_backend.js`**:
  - Sweeps `apps/web/backend` for `server.ts` files and bundles content into root `backend_dump.json` (lines 4-28).

### System Logic & Mechanics
- Verification test suite ensuring bridge REST API endpoints adhere to filesystem boundary rules and process launching security restrictions.

### Unresolved Blindspots & Open Questions
- `verify_bridge.js` requires `agent-bridge.js` to be actively running on port 8081 before execution.

---

## State & Memory Infrastructure Scripts (`scripts/tools/`, `scripts/python/`, `scripts/`)

### Verified Evidence
- **`scripts/nervous_system_bridge.js`**:
  - HTTP server on port **3001** (line 5).
  - Endpoint `POST /state` receives JSON payloads and writes them with an ISO timestamp to `../../state.json` (`c:\Users\zakde\Desktop\AntiGravity projects\state.json`) (lines 20-41).
- **`scripts/tools/query_nexus.py`**:
  - Uses `google.generativeai` with `models/gemini-embedding-001` (lines 36-46).
  - Loads `.env.local` for `GEMINI_API_KEY` (lines 10-13).
  - Performs vector cosine similarity against `apps/web/public/data/archive_vectors.json` and `apps/web/public/data/genome_vectors.json` (lines 54-86).
- **`scripts/python/my_rag.py`**:
  - Implements local RAG using Ollama (`http://localhost:11434/api`) (line 8).
  - Embedding model: `mxbai-embed-large:latest` (line 9).
  - LLM model: `gemma4:latest` (line 10).
  - Scans directories for `.txt`, `.py`, `.md`, `.json`, `.js`, `.ts`, `.tsx` files, chunks at 1500 chars with 200 overlap, generates embeddings, and streams query responses (lines 55-150).
- **`scripts/ingestion/bulk_ingest.py`**:
  - Ingests files from root directory `G:/My Drive/MystraRoot` (line 8).
  - Processes files under 1MB, categorizes using `Categorizer.get_dewey()`, outputs 500-item JSON chunks (`archive_part_X.json`) and `archive_manifest.json` into `apps/web/public/data/` (lines 14-145).

### System Logic & Mechanics
- Establishes a multi-tier memory system: realtime state persistence via HTTP port 3001, cloud vector retrieval via Gemini embeddings, local RAG context scanning via Ollama, and massive archive ingestion from external Google Drive storage (`G:/My Drive/MystraRoot`).

### Unresolved Blindspots & Open Questions
- `bulk_ingest.py` references external hard drive path `G:/My Drive/MystraRoot`. If drive G: is unmounted, bulk ingestion fails.
- `my_rag.py` requires Ollama model `mxbai-embed-large:latest`, which must be pulled prior to running.

---

# 4. Comprehensive Synthesis of Discovery (Phase 1 & Phase 5)

| Category | Primary Component / File | Operational Mechanism & Logic | Key Dependencies & Services |
| :--- | :--- | :--- | :--- |
| **Workspace Perimeter** | `package.json` | Monorepo root (`antigravity-swarm`) delegating app dev to `apps/web`. | NPM Workspaces (`apps/*`, `packages/*`), `concurrently` |
| **Compiler Config** | `tsconfig.json` | TS ES2022 / NodeNext module resolution with composite declarations. | TypeScript 5.0+ |
| **Security & Env** | `.env.local`, `.gitignore` | API keys (`GEMINI_API_KEY`) and email credentials; git exclusion rules. | Google Gemini API |
| **Agent Protocols** | `.clinerules` | 10-symbol recursive addressing, Crucible 27-facet mandate, JSON-LD minting. | Orama search (`POST /api/search`), `/timekeeper` |
| **System Spec** | `PROJECT.md` | Spatial desktop bridge on port 8081 (`agent-bridge.js`) and WebGL canvas. | `AvatarScene.tsx`, JS-DOS WASM, WebRTC |
| **Service Ports** | `README.md`, `LAUNCH_INSTRUCTIONS.md` | Port 3000 (Vite/Swarm), Port 8081 (Bridge), Port 8080 (TCP Node), Port 3001 (Nervous Bridge). | Node.js v18+, Ollama `gemma4:latest` |
| **Task Management** | `MASTER_TASK_LEDGER.md`, `TODO.md` | Permanent task registry (`AMO: 0000`) and 6-domain technical debt backlog. | Git history, Zustand persistence |
| **Orchestrator Tooling** | `scripts/dev_omega.mjs` | Multi-repo runner for Ollama, Mystra Storage, Nexus MCP, and Web App. | Sibling repos (`nexus-context-server`, `the-mystra-nexus`) |
| **Ontological Auditor** | `scripts/evaluate_cartridge.mjs` | 10-pillar genomic classifier using `gemini-2.0-flash` with local Mistral fallback. | `apps/web/.env.local`, `localhost:3000/chat` |
| **Asset Pipeline** | `scripts/lpc_scraper.py`, `lpc_grubber.mjs` | Automated OpenGameArt LPC sprite crawler, extractor, and manifest generator. | Selenium, system `tar`, `apps/web/public/assets/lpc` |
| **Bridge Testing** | `scripts/node/verify_bridge.js`, `verify_security_fixes.js` | Verification suite for `GET /api/desktop/files`, `POST /api/win/launch`, and path safety. | Port 8081 REST API |
| **Memory & RAG** | `scripts/tools/query_nexus.py`, `scripts/python/my_rag.py` | Dual vector search (Gemini `gemini-embedding-001` vs Ollama `mxbai-embed-large`). | `archive_vectors.json`, `genome_vectors.json` |
| **Archive Ingestion** | `scripts/ingestion/bulk_ingest.py` | Dewey Decimal categorization of text files into chunked JSON archives. | Drive `G:/My Drive/MystraRoot`, `Categorizer.py` |

---

# 5. Consolidated Unresolved Blindspots & Open Questions

1. **Root Name Inconsistency**: `package.json` defines project name as `"antigravity-swarm"`, whereas `PROJECT.md`, `README.md`, and `.clinerules` call the system `"MyOS"`.
2. **Hard-Coded External Repo Dependencies**: `scripts/dev_omega.mjs` hard-checks for relative sibling paths `../nexus-context-server` and `../the-mystra-nexus`. If these are absent, startup aborts.
3. **Hard-Coded External Drive Paths**: `scripts/ingestion/bulk_ingest.py` reads from `G:/My Drive/MystraRoot`. If G: drive is not connected, bulk ingestion crashes.
4. **Active Credentials in Source Tree**: `.env.local` contains explicit API keys (`GEMINI_API_KEY`) and raw email credentials (`EMAIL_PASS`).
5. **Required Models Pre-installation**: `scripts/python/my_rag.py` requires `mxbai-embed-large:latest` and `gemma4:latest` in Ollama; `scripts/evaluate_cartridge.mjs` requires `gemini-2.0-flash` or local `mistral`.
6. **Command Script Location Gap**: Boot commands `/timekeeper`, `/familiarize`, `/status_report` in `.clinerules` are referenced as slash-commands rather than npm package scripts.
7. **Residual Swap Files**: `council_config.json.crswap` remains in the root folder despite `MASTER_TASK_LEDGER.md` priority `SYS-01` claiming cleanup in progress.
8. **Discrepancy in `package.json` vs Running Services**: `LAUNCH_INSTRUCTIONS.md` implies `npm run dev` starts all servers, but `package.json` `dev` script only executes `npm run dev --workspace=apps/web`.

---
*Report compiled autonomously by Explorer M1 strictly adhering to Zero Knowledge Discovery Protocol.*
