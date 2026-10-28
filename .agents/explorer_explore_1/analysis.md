# Codebase Exploration & Tech Stack Recommendations

## Executive Summary
This report documents an exploration of the existing codebase repository, analyzing its structure, identifying available libraries and technologies, investigating LLM integration mechanisms, and providing architectural recommendations for building either a 3D Virtual Tabletop (VTT) or a retro tactical JRPG slice.

---

## 1. Directory and File Structure Analysis

The repository contains several key directories and files relevant to our objectives:

| Directory/File | Structural Analysis & Purpose |
| :--- | :--- |
| `Faerûn` | A standalone React app (configured with Vite, TypeScript, and Tailwind) implementing a 3D hexagonal world map using React Three Fiber (R3F) and Drei. It features an axial hex coordinates grid, a dynamic "treadmill" map group loader, cylinder math utility, and character sprite rendering. |
| `Faerun-Sandbox` | A playground app featuring a "Zoetrope Cylinder" component and a rich collection of LPC (Liberated Pixel Cup) 2D spritesheets (character walk cycles, objects, tiles) stored in `public/assets/lpc`. |
| `apps/` | Workspace apps folder containing: <br>• **`web`**: The main web dashboard application, which acts as the desktop portal. It features advanced 3D components like dynamic terraced hexagon maps (`FaerunWorld.tsx`), volumetric voxel rendering (`VoxelSprite.tsx`), and a local agent proxy server.<br>• **`genesis`**: A React workspace client.<br>• **`godot`**: Godot 4.7 executables and the **`lpc_crawler`** sub-project.<br>• **`SonicLattice`**: Audio lattice workspace. |
| `packages/` | Core workspace packages shared across apps, including `swarm-core`. |
| `prototypes/` | Contains key experimentation files: <br>• **`MyOntology_VoxelRig_Standalone (2).html`**: A standalone WebGL/Tone.js app binding box-geometry voxels to an animated skeleton (`RobotExpressive.glb` bones).<br>• **`MephitScraper`**: Web scraper prototype.<br>• **`semantic-paperdoll`**: Assembly prototype. |
| `results/` | Holds JSON/markdown reports like `audit_report.json` evaluating project features. |
| `scripts/` | Python and JS helper utilities for cleaning spritesheets, extracting LPC assets, generating placeholding meshes, and building ontologies (e.g. `clean_spritesheet.py`, `generate_placeholders.py`, `lpc_scraper.py`). |
| `integrations/` | Holds external PDFs (e.g., Endless Dungeon, Ursaren race), D&D spell cards, dungeon generator HTML templates, maps, music, and local templates. |
| `mystra_molecular_v24 (1).html` | A standalone HTML file containing Bard/Gemini web app boilerplate and a WebGL molecular lattice visualization. |
| `LibsManifest.md` | A structured manifest file cataloging JavaScript packages and configurations across all directories. |
| `package.json` | The workspace package file defining npm workspaces (`packages/*`, `apps/*`) and root dependencies including `three` and `@react-three/fiber`. |

---

## 2. Tech Stack Identification

The repository is built on a **dual-stack architecture**:

1. **Primary Web Stack (React + TypeScript + Vite + R3F + Tailwind CSS)**:
   - **Framework/Language**: React 19/Vite with TypeScript.
   - **3D Graphics**: Three.js integrated via React Three Fiber (R3F) (`@react-three/fiber`) and `@react-three/drei`.
   - **2D Graphics**: Pixi.js (`pixi.js` and `@pixi/react`) is included in `apps/web/package.json` for 2D canvas tasks.
   - **Audio/Synth**: Tone.js (`tone`) is utilized to build FM synthesizers and spatial sound.
   - **Styling**: Tailwind CSS and Framer Motion for responsive UI layouts and transitions.

2. **Secondary Engine Stack (Godot Engine 4)**:
   - **Engine**: Godot 4.3/4.7 Stable (Forward+ renderer).
   - **Scripting Language**: GDScript.
   - **App Target**: Natively compiled Windows executables or WebAssembly browser exports.

3. **Backend & Scripting (Node.js & Python)**:
   - Node.js scripts serve as background daemons (`agent-bridge.js`, `swarm-server.js`) and orchestration tools.
   - Python is used for data scraping, spritesheet slicing, and local RAG scripts (`my_rag.py`).

---

## 3. Key Available Libraries & Packages

Based on `LibsManifest.md` and project `package.json` files, the following libraries are available for our development:

- **3D Rendering & Math**:
  - `three` (v0.183.2) - Core WebGL library.
  - `@react-three/fiber` (v9.5.0) - React wrapper for Three.js.
  - `@react-three/drei` (v10.7.7) - Helpers, controls (OrbitControls, Stage, Sky, Stars), and environment loaders.
  - `three-stdlib` - Three.js loaders and utilities.
  - `react-force-graph-3d` & `react-force-graph-2d` - 3D/2D graph visualization.
  - `d3` / `d3-force` - Force layout math.
- **2D Retro Graphics**:
  - `pixi.js` (v8.16.0) & `@pixi/react` (v8.0.5) - WebGL-accelerated 2D rendering.
- **Audio Synthesis**:
  - `tone` (v15.1.22) - Interactive synthesizer engine.
- **UI & State Management**:
  - `zustand` (v5.0.10) - Centralized state management.
  - `framer-motion` - Animations.
  - `lucide-react` - UI Icons.
- **AI & MCP**:
  - `@google/genai` (v1.38.0) - Gemini AI SDK.
  - `@modelcontextprotocol/sdk` - Model Context Protocol for agent toolsets.
  - `@orama/orama` - In-memory full-text search database.
- **Other Utilities**:
  - Monaco Editor (`@monaco-editor/react`), `skia-canvas`, Monaco-style text terminals (`@xterm/xterm`).

---

## 4. LLM Integration & System Communication

The codebase has two distinct pathways to communicate with LLMs:

### A. The Agent Bridge Proxy (`agent-bridge.js`)
- Runs as a Node.js daemon (configured to run concurrently on port 8081).
- **Dual Routing Capability**:
  - If a cloud key is present in `.env.local` (`GEMINI_API_KEY`), it can route calls to Google Gemini.
  - By default, it acts as a proxy that intercepts requests sent via the `@google/genai` SDK and translates them into Ollama's local API format.
- **Translation Mechanisms**:
  - `geminiToOllama(geminiBody, localModel)`: Converts Gemini-style systems instructions, conversation history contents, and inline image/multimodal payloads into standard chat messages for Ollama.
  - `ollamaToGemini(ollamaText)`: Wraps Ollama responses back into Gemini-compliant candidate envelopes (`candidates[0].content.parts[0].text`).
  - Proxies requests to `http://localhost:11434/api/chat` or `generate` using local Ollama model configurations (specifically `"gemma4:latest"` as defined in `bridge_config.json`).

### B. Python RAG Engine (`my_rag.py`)
- Standard document-ingestion and question-answering pipeline.
- Scans `KNOWLEDGE_DIRS` for documentation, markdown, and python files.
- Generates document embeddings using local Ollama's embeddings API endpoint (`/embeddings`) with the `mxbai-embed-large:latest` model.
- Uses `scikit-learn` to calculate cosine similarities between user query embeddings and document embeddings.
- Formulates a system prompt and streams text generation from local Ollama using the `gemma4:latest` model.

---

## 5. Architectural Stack & Visual Style Recommendations

To develop the 3D VTT or retro tactical JRPG slice, we evaluate the following choices based on current repository assets:

### Recommendations on Tech Stack Choice

We strongly recommend adopting the **React + TypeScript + React Three Fiber (R3F) Web Stack**.
* **Reasoning**:
  1. **Direct Integration**: The main application (`apps/web`) is already running a React dashboard setup. A web-based 3D VTT can be embedded directly as a modular viewport pane within this dashboard.
  2. **Rich Component Scaffold**: We already have custom React components like `FaerunWorld.tsx` and `VoxelSprite.tsx` implemented in R3F, drastically reducing development startup cost.
  3. **Seamless AI Integration**: The existing `agent-bridge.js` proxy intercepts Web-frontend Gemini SDK requests and routes them to local Ollama seamlessly, allowing direct client-side AI commands.
  4. **Tone.js Audio**: Tone.js is already configured in the web dashboard dependencies, allowing us to generate 8-bit chiptunes or retro SFX procedurally to fit a retro aesthetic.

* **Godot 4 Alternative**: If the client requires a highly performant desktop launcher or standalone client with pixel-perfect viewport clipping, Godot 4 (which exists in `apps/godot/lpc_crawler`) is an excellent choice. It compiles to optimized Windows binaries and can communicate with the dashboard via the desktop bridge launcher.

---

### Recommendations on Visual Style

We have three distinct visual directions supported by existing assets:

#### Direction A: "Heroscape" Terraced Hex VTT (Recommended for VTT)
- **Concept**: A 3D virtual tabletop composed of modular, hexagonal columns of varying heights (similar to Heroscape physical board games).
- **Core Assets**: `FaerunWorld.tsx` and `AstraFaerunWorld.tsx`.
- **Visuals**:
  - Uses instanced hexagonal cylinders (`CylinderGeometry` with 6 sides, bottom radius slightly flared for a claymation look).
  - Uses quantized noise coordinates so that terrain snapped to hex coordinates has flat, step-terrace elevation increments (0.5m).
  - Biome-themed colored faces (Sand, Grass, Rock, Snow, Water) utilizing clay textures (e.g., `claymation_grass_texture.png`).
  - OrbitControls for strategic overhead navigation, with smooth camera vertical gravity that snaps to the height of the hex the character is currently traversing.

#### Direction B: 3D Volumetric Voxel Sprites (Recommended for JRPG Tactical Slice)
- **Concept**: An isometric retro JRPG slice where characters and monsters are rendered as volumetric 3D voxel models created in real-time from 2D sprites.
- **Core Assets**: `VoxelSprite.tsx`.
- **Visuals**:
  - Reads 2D spritesheet layers (like LPC base bodies, armors, helmets) and projects each colored pixel as a 3D box voxel inside an instanced mesh (`THREE.InstancedMesh`).
  - Activates **Latent Space Volume Filling** (volumetric rendering) to bridge gaps between 2D layers, rendering solid 3D pixel models.
  - Implements destructible voxel physics where impacts loosen voxels, causing them to fall with gravity, bounce, and scatter on the ground (ideal for combat feedback, spell effects, or death animations).

#### Direction C: Zoetrope Cylinder Projection (Retro Arcade Style)
- **Concept**: Renders a character spritesheet wrapped around a revolving, transparent 3D cylinder.
- **Core Assets**: `ZoetropeCylinder.tsx` (from `Faerun-Sandbox` and `Faerûn/src/components/Entities/Hero.tsx`).
- **Visuals**:
  - Character sprites are rendered on the interior face (`THREE.BackSide`) of a 3D cylinder.
  - A slightly larger concentric "Slit-Mask" cylinder is rendered around it with a dark, semi-transparent material, creating a physical 3D zoetrope device.
  - By rotating the inner cylinder and shifting the spritesheet UV offset synchronously, it creates a retro billboarding effect that maintains correct walking animations from all camera perspectives.

### Recommendation Summary Table

| Goal | Tech Stack | Recommended Visual Style | Core Files to Leverage |
| :--- | :--- | :--- | :--- |
| **3D VTT** | React + R3F | **Terraced Clay Hex** map layout with 3D VTT grid snap, combined with 2D character bills or zoetrope tokens. | `apps/web/src/components/World/FaerunWorld.tsx`, `Faerûn/src/logic/TreadmillContext.tsx` |
| **Retro JRPG Slice** | React + R3F | **Volumetric Voxel Sprites** with dynamic physics for spell effects and destructible JRPG figures, set on a grid map. | `apps/web/src/components/World/VoxelSprite.tsx`, `prototypes/MyOntology_VoxelRig_Standalone (2).html` |
