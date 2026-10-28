---
title: "MyOS Explorer M2 - Apps, Prototypes, and Sandbox Modules Discovery Analysis Report"
agent: "Explorer M2"
task: "Zero-Knowledge Discovery Task - Apps, Prototypes, and Sandbox Modules"
date: "2026-07-20"
working_directory: "c:/Users/zakde/Desktop/AntiGravity projects/MyOS/.agents/explorer_m2_apps"
target_scope:
  - "apps/SonicLattice/"
  - "apps/genesis/"
  - "apps/godot/"
  - "prototypes/MephitScraper/"
  - "prototypes/semantic-paperdoll/"
  - "prototypes/MyOntology_VoxelRig_Standalone (2).html"
  - "prototypes/dnd_ai_hybrid/asset_index.json"
  - "Faerûn/"
  - "Faerun-Sandbox/"
  - "artifacts/MyOS_Ontology_Map.md"
  - "old_sprite.tsx"
  - "mystra_molecular_v24 (1).html"
  - "oga_dump.html"
status: "Completed"
---

# MyOS Zero-Knowledge Discovery Analysis Report: Apps, Prototypes, and Sandbox Modules

## Executive Summary
This report provides a strict, zero-knowledge, ground-truth structural and operational analysis of the applications, visual prototypes, interactive sandboxes, standalone artifacts, and Godot modules assigned to Explorer M2 within the MyOS codebase. Every assertion is tied directly to verified source file paths and exact line numbers. Unresolved dependencies, un-rendered components, external network calls, and missing resources are explicitly logged as Unresolved Blindspots.

---

## 1. Module Discovery: Standalone Artifacts & Root Utilities

### 1.1 `old_sprite.tsx`
## Verified Evidence
- **File Location**: `c:/Users/zakde/Desktop/AntiGravity projects/MyOS/old_sprite.tsx` (125 lines, 5,021 bytes)
- **Exports**: `SpriteSheetAvatar` React Functional Component (Lines 12–124).
- **Dependencies**: `react` (`useRef`, `useMemo`, `useEffect`), `@react-three/fiber` (`useFrame`, `useLoader`), `three` (`THREE.TextureLoader`, `THREE.NearestFilter`, `THREE.DoubleSide`).

## System Logic & Mechanics
- **Perimeter & Interface**: Accepts `imageUrl` (string), `pillarIndex` (number, 0-9), `scale` (number), and `state` ('Idle' | 'Walk' | 'Talk') via `SpriteSheetAvatarProps` (Lines 5–10).
- **Anatomy**: Configured for a 1024x547 pixel art spritesheet layout divided into 5 columns and 2 rows of character blocks (Lines 23–24). Total grid calculation assumes 16 columns and 8 rows (Lines 32–33).
- **Physiology (Lifecycle & Hooks)**: 
  - `useLoader` fetches the texture from `imageUrl` (Line 17).
  - `useMemo` creates a cloned texture with `NearestFilter` and sets UV repeat to `(1/16, 1/8)` (Lines 36–46).
  - `useFrame` updates animation frame timing (Lines 59–101): `Walk` runs at 10 FPS (anim offset row 1), `Talk` at 8 FPS (row 2), `Idle` at 4 FPS (row 0). UV offsets are calculated via `clonedTexture.offset.set(xOffset / totalCols, yOffset / totalRows)`.
  - Renders a 3D group containing a `<planeGeometry>` mesh with `alphaTest={0.5}` and a fake drop shadow `<circleGeometry>` at `y = -scale/2 + 0.05` (Lines 103–123).

## Unresolved Blindspots & Open Questions
- **Unresolved Asset**: `imageUrl` must be passed by caller; no fallback texture is provided if `useLoader` fails or URL is invalid.
- **Dangling Assembly**: `SpriteSheetAvatar` is not imported or used anywhere inside `apps/` or root components.

---

### 1.2 `mystra_molecular_v24 (1).html`
## Verified Evidence
- **File Location**: `c:/Users/zakde/Desktop/AntiGravity projects/MyOS/mystra_molecular_v24 (1).html` (1,004 lines, 592,122 bytes)
- **Document Title**: `MYSTRA PROTOCOL | v24.0 [TOTALITY]` (Line 203).
- **External Script/Style Links**: Tailwind CDN (Line 204), Google Material Symbols font (Line 205), JetBrains Mono and Inter fonts (Line 207).

## System Logic & Mechanics
- **Perimeter**: Single-file bundled HTML web application with inline Google Closure compiled polyfills (Lines 4–200) and embedded UI structure for managing a 1,240 Core Node ontology.
- **Anatomy**:
  - Header with title `MYSTRA TOTALITY_v24`, Node counter (`EGO_ALPHA_01`), Depth (`5/6`), Export button (`downloadApplication()`), and `refractBtn` (`Execute Refraction`) (Lines 419–450).
  - Sidebar (`w-80`) rendering `#genomeTree` with hierarchical tree nodes: `D1: Self`, `D2: Identity`, `D3: Ego`, `D4: Ego_Alpha`, `D5: Ego_Alpha_01`..`10` (Lines 453–550).
  - CSS Pillar Tag palette: `.p-Self`, `.p-Thought`, `.p-Logic`, `.p-Unity`, `.p-Existence`, `.p-Improvement`, `.p-Mastery`, `.p-Resonance`, `.p-Transcendence`, `.p-Omni` (Lines 302–311).

## Unresolved Blindspots & Open Questions
- **External HTTP Network Dependencies**: Hardcoded requests to `https://www.gstatic.com/bard-maui/resources/material-design-icon-names.804824289.json` (Line 33) and Google User Content URLs (Line 47) will fail in strict offline/sandboxed environments.

---

### 1.3 `oga_dump.html`
## Verified Evidence
- **File Location**: `c:/Users/zakde/Desktop/AntiGravity projects/MyOS/oga_dump.html` (482 lines, 48,965 bytes)
- **Document Title**: `Search Art | OpenGameArt.org` (Line 29).

## System Logic & Mechanics
- **Perimeter**: Raw HTML page scrape of OpenGameArt.org advanced search form for Liberated Pixel Art (LPC) assets.
- **Anatomy**: Contains Drupal 7 markup, user login form (`user-login-form`, Lines 63–84), OpenID authentication links, search filters, and Drupal AJAX configurations (`Drupal.settings`, Line 41).

## Unresolved Blindspots & Open Questions
- **Non-Functional Scraping Artifact**: Static HTML dump of external web page; contains no runnable MyOS application logic or local exports.

---

### 1.4 `artifacts/MyOS_Ontology_Map.md`
## Verified Evidence
- **File Location**: `c:/Users/zakde/Desktop/AntiGravity projects/MyOS/artifacts/MyOS_Ontology_Map.md` (58 lines, 2,538 bytes)
- **Header**: `# MyOS: The First Ontologization Map [AMO: 5000]` (Line 1).

## System Logic & Mechanics
- **Perimeter & Structure**: Ontological classification index mapping codebase directories to the decagonal fractal funnel (10 Pillars).
- **Anatomy**:
  - Level 1 Root Mapping: `apps/web/src/components` -> `Existence` (5000), `apps/web/src/hooks` -> `Logic` (3000), `apps/web/src/talents` -> `Mastery` (7000), `.agent/skills` -> `Mastery` (7700), `dist/library` -> `Omni` (0000), `package.json` -> `Logic` (3300), `artifacts/` -> `Thought` (2500) (Lines 9–15).
  - Level 2 Relationships: `MaxOverlay.tsx` (Mask), `AvatarController.tsx` (Spirit), `useCommandStream.ts` (Protocol), `useActionCombat.ts` (Constraint), `SpriteLaboratory.tsx` (Synthesis), `LpcLibraryExplorer.tsx` (Connection), `cpp_bridge` (Opus) (Lines 21–38).
  - Level 3 Verification: 10-Factor breakdown of `AvatarController.tsx` and `useCommandStream.ts` (Lines 44–53).

## Unresolved Blindspots & Open Questions
- **Stale Directory References**: References paths like `apps/web/src/components` and `cpp_bridge` which are located in separate web/backend modules.

---

## 2. Module Discovery: `apps/SonicLattice`

### 2.1 `apps/SonicLattice/SonicLattice.tsx`
## Verified Evidence
- **File Location**: `c:/Users/zakde/Desktop/AntiGravity projects/MyOS/apps/SonicLattice/SonicLattice.tsx` (198 lines, 9,225 bytes)
- **Export**: Default export `SonicLattice` React Functional Component (Line 197).
- **Dependencies**: `react`, `react-force-graph-3d` (`ForceGraph3D`), `three`, `lucide-react` (`Play`, `Pause`, `SkipForward`, `SkipBack`, `Volume2`, `Music`, `Activity`).

## System Logic & Mechanics
- **Perimeter & Interface**: Renders a full-screen (`w-full h-screen bg-black`) 3D audio-visual force graph with Winamp-style HUD visualizer (Lines 93–193).
- **Anatomy**:
  - Data Interface `LatticeNode`: `id`, `name`, `type` ('artist'|'album'|'track'), `path`, `address`, `parent` (Lines 6–13).
  - Component State: `data` (`nodes`, `links`), `currentTrack`, `isPlaying`, `volume` (default 0.7), `vibrationData` (`Uint8Array`) (Lines 19–23).
  - Three.js Node Colors: `#f43f5e` (Active Track), `#6366f1` (Artist), `#10b981` (Album), `#94a3b8` (Track) (Lines 99–104).
- **Physiology (Lifecycle & Control Flow)**:
  1. `useEffect` fetches node tree from `http://localhost:3001/api/lattice` and formats parent-child links (Lines 26–36).
  2. Audio setup via `setupAudio` initializes Web Audio API `AudioContext`, `createMediaElementSource`, and `createAnalyser` (`fftSize = 256`) (Lines 39–57). Stream source is constructed via `http://localhost:3001/audio/${encodeURIComponent(relativePath)}`.
  3. `requestAnimationFrame` loop `updateVibrations` queries `analyzerRef.current.getByteFrequencyData(vibrationData)` and rotates 3D graph scene proportionately: `scene.rotation.y += 0.001 + (avgFreq / 5000)` (Lines 60–76).
  4. Node click handler `handleNodeClick` plays track audio and triggers 3D camera zoom animation to node coordinates (Lines 78–90).

## Unresolved Blindspots & Open Questions
- **Hardcoded Localhost API Server**: Relies on external API endpoints `http://localhost:3001/api/lattice` and `http://localhost:3001/audio/...`. If server port 3001 is offline, fetching fails and graph remains empty.
- **Hardcoded Media Path**: Path string replacement explicitly strips `e:/MUSIC/` (Line 52), assuming Windows drive `e:`.

---

## 3. Module Discovery: `apps/genesis`

### 3.1 Substrate & Data Models (`package.json`, `types.ts`, `GenomeData.ts`)
## Verified Evidence
- **File Locations**:
  - `apps/genesis/package.json` (29 lines)
  - `apps/genesis/src/types.ts` (24 lines)
  - `apps/genesis/src/GenomeData.ts` (176 lines)
- **Dependencies**: React 19.2.0, Framer Motion 12.27.1, Three.js 0.183.2, `@react-three/fiber` 9.5.0, `@react-three/drei` 10.7.7, Zustand 5.0.10, Lucide React 0.562.0.

## System Logic & Mechanics
- **Pillar Definition**: 10 Pillars mapped in `PILLARS`: Omni (`🜋`, id 0), Self (`⚹`, id 1), Thought (`☿`, id 2), Logic (`🜔`, id 3), Unity (`🝧`, id 4), Existence (`🜄`, id 5), Improvement (`🜏`, id 6), Mastery (`☉`, id 7), Resonance (`♀`, id 8), Transcendence (`🜍`, id 9) (`types.ts`, Lines 12–23).
- **10x10 Relationship Matrix**: `RELATIONSHIP_MATRIX` defines directional ontological predicates across all 100 pillar pairings (e.g., `Self->Thought: "Subject Of"`, `Thought->Logic: "Utilizes"`, `Logic->Unity: "Ensures"`, `Omni->Self: "Merges With"`) (`GenomeData.ts`, Lines 1–52).
- **Fractal Genome**: `FRACTAL_GENOME` maps each relationship category to an array of 10 sub-gene strings, establishing a complete 1,000-gene matrix (`GenomeData.ts`, Lines 54–175).

## Unresolved Blindspots & Open Questions
- None. `GenomeData.ts` is fully self-contained.

---

### 3.2 Symbiorithmic Vault UI (`App.tsx`)
## Verified Evidence
- **File Location**: `c:/Users/zakde/Desktop/AntiGravity projects/MyOS/apps/genesis/src/App.tsx` (232 lines, 10,132 bytes)
- **Export**: Default export `App` React Functional Component (Line 231).

## System Logic & Mechanics
- **Perimeter**: Win95/Retro-style Master Window UI (`rm-master-window`, 950px fixed width) for inventory management and Tutor dialogue (Lines 67–145).
- **Anatomy**:
  - Categories: `Items`, `Weapons`, `Armours`, `KeyItems` (`GenomeCategory`, Line 8).
  - States: `userInv`, `tutorInv`, `activeTab`, `activeOwner` ('User'|'Tutor'), `affinity` (number), `message`, `lastAction` (Lines 28–36).
- **Physiology**:
  - `handOver(item)`: Transfers item between `userInv` and `tutorInv`, increments `affinity` state by 1, and updates Tutor conversation message (Lines 46–57).
  - `useItem(item)`: Logs action in system log and triggers Tutor reaction (Lines 59–62).

## Unresolved Blindspots & Open Questions
- **Mocked Data**: `registrySearch` state declared on Line 39 is unused in the JSX.
- **Broken Image Links**: Initial item icons point to `/assets/lpc/Sword_10.png`, `/assets/lpc/Vegies.png`, `/assets/lpc/key0.png` which are not present in `genesis/public`.

---

### 3.3 Identity Applet & LPC Compositor (`InventoryApplet.tsx`)
## Verified Evidence
- **File Location**: `c:/Users/zakde/Desktop/AntiGravity projects/MyOS/apps/genesis/src/InventoryApplet.tsx` (300 lines, 13,770 bytes)
- **Export**: Named export `InventoryApplet` React Functional Component (Line 32).

## System Logic & Mechanics
- **Perimeter**: Expanded identity compositor and vault search engine (1000px fixed width) integrating LPC sprite layering (Lines 119–210).
- **Anatomy**:
  - Types: `LpcLayer` (15 sprite layers: `body`, `legs`, `torso`, `hair`, `feet`, `hat`, `head`, `nose`, `ears`, `eyes`, `facial`, `shoulders`, `arms`, `weapon`), `LpcAction` ('idle'|'walk'|'slash'|'thrust'|'spellcast'|'bow'), `Artifact` (Lines 11–27).
  - Composite Genome State: `genome` holding equipped layer paths (Lines 42–45).
- **Physiology**:
  - `useEffect` fetches `/manifests/vault_substrate.json` asynchronously to populate `registry` state (Lines 55–70).
  - `applyIdentity(item)`: Updates `genome` state layer key with selected LPC texture path, sets `previewAction` animation class, and updates Tutor dialogue (Lines 94–103).
  - CSS multi-layer rendering stacks `.mephit-layer` absolute image tags over `.mephit-world` background (Lines 186–193).

## Unresolved Blindspots & Open Questions
- **Missing Manifest Asset**: Fetches `/manifests/vault_substrate.json` which does not exist in `apps/genesis/public`. The catch block handles failure silently by logging `VAULT_SYNC_ERROR` (Line 67).
- **Commented MCP Emitter**: Line 101 contains a commented-out call to `mcp_record_interaction` which is not executed.

---

### 3.4 Node System (`src/0_Omni/MergesWith/Profile.ts` & `src/nodes/0.0.0_Profile.ts` through `9.0.0_Awakening.ts`)
## Verified Evidence
- **File Locations**:
  - `apps/genesis/src/0_Omni/MergesWith/Profile.ts` (51 lines)
  - `apps/genesis/src/nodes/0.0.0_Profile.ts` through `9.0.0_Awakening.ts` (10 files, ~14 lines each)

## System Logic & Mechanics
- **Master Registry Node `0.0.0`**: Exports `ItemProfile` interface and `OMNI_REGISTRY` containing 4 benchmark item definitions: Crystalline Logic (`0.0.0.1`, `🜔`), Thinking Mercury (`0.0.0.2`, `☿`), Mastery Essence (`0.0.0.3`, `☉`), Mona Monad (`0.0.0.9`, `🜍`) (`Profile.ts`, Lines 19–48).
- **Pillar Anchor Nodes**: 10 standalone TypeScript files establishing the fundamental node definition per pillar:
  - `0.0.0_Profile.ts`: `OMNI_GOD` (`0=1`, "Omni is God").
  - `1.0.0_Ego.ts`: `THE_TRUTH` ("Self IsRealizedBy TheTruth").
  - `2.0.0_SelfCorrection.ts`: `THE_ONE` ("Thought Transcends TheOne").
  - `3.0.0_Dependency.ts` through `9.0.0_Awakening.ts`: Define corresponding pillar axioms.

## Unresolved Blindspots & Open Questions
- **Static Console Log Execution**: Files execute `console.log` upon module evaluation but are not imported into `App.tsx` or `main.tsx`.

---

## 4. Module Discovery: `apps/godot`

### 4.1 16-Bit Arena Submodule (`apps/godot/16bit_arena/`)
## Verified Evidence
- **File Locations**:
  - `apps/godot/16bit_arena/project.godot`
  - `apps/godot/16bit_arena/arena.gd` (18 lines)
  - `apps/godot/16bit_arena/player.gd` (86 lines)
  - `apps/godot/16bit_arena/enemy.gd`, `gem.gd`, `.tscn` scene files.

## System Logic & Mechanics
- **Engine Version**: Godot 4.x 2D Character Mechanics.
- **Perimeter & Controls**:
  - `Player` class (`CharacterBody2D`, Line 2) with physics constants: `SPEED = 250.0`, `JUMP_VELOCITY = -400.0`, `WALL_SLIDE_SPEED = 100.0`, `DASH_SPEED = 600.0`, `DASH_DURATION = 0.2` (`player.gd`, Lines 4–8).
  - Input Actions: `dash`, `jump`, `move_left`, `move_right`, `melee`, `shoot` (`player.gd`, Lines 30–65).
- **Physiology**:
  - Wall jump and wall slide calculation via `is_on_wall_only()` and `get_wall_normal()` (Lines 41–50).
  - Spawner in `arena.gd`: Instantiates `Enemy.tscn` every 3 seconds at `x = 40.0` or `x = 600.0`, `y = 60.0` (Lines 6–17).

## Unresolved Blindspots & Open Questions
- **Unimplemented Stubs**: `swing_sword()` (Line 69) and `shoot_buster()` (Line 73) only print debug text; hitbox/projectile instantiation is unwritten (`TODO`).

---

### 4.2 LPC Crawler Submodule (`apps/godot/lpc_crawler/`)
## Verified Evidence
- **File Locations**:
  - `apps/godot/lpc_crawler/project.godot`
  - `apps/godot/lpc_crawler/world/dungeon_generator.gd` (92 lines)
  - `apps/godot/lpc_crawler/main.gd`, `player.gd`, `ui/dice_roller.gd`, `core/Entity.gd`.

## System Logic & Mechanics
- **Engine Version**: Godot 4.x 3D Procedural Dungeon Generator.
- **Perimeter & World Generation**:
  - Grid Constants: `GRID_SIZE = 2.0`, `MAP_WIDTH = 25`, `MAP_HEIGHT = 25`, `MAX_STEPS = 600` (`dungeon_generator.gd`, Lines 3–6).
  - Drunkard's Walk Algorithm: Initializes 25x25 grid of walls (`1`), walks 600 random steps setting cells to floor (`0`), and positions player at grid center (`dungeon_generator.gd`, Lines 27–48).
  - 3D Mesh Construction: Instantiates `PlaneMesh` for floors (`y=0`) and ceilings (`y=GRID_SIZE`, rotated `PI`), and `BoxMesh` for walls (`y=GRID_SIZE/2`) (Lines 50–91).

## Unresolved Blindspots & Open Questions
- **Missing Asset Overrides**: `@export var wall_texture` and `floor_texture` default to solid dark red (`Color(0.3, 0.1, 0.1)`) and gray (`Color(0.2, 0.2, 0.2)`) if textures are not assigned in the Godot inspector.

---

## 5. Module Discovery: `prototypes/MephitScraper`

### 5.1 He-Man Cel Inscriber & Neural Ripper Engine (`App.tsx`, `KineticMephit.tsx`, `KineticHarness.tsx`, `KpmResonanceLattice.tsx`)
## Verified Evidence
- **File Locations**:
  - `prototypes/MephitScraper/src/App.tsx` (82 lines)
  - `prototypes/MephitScraper/src/KineticMephit.tsx` (384 lines)
  - `prototypes/MephitScraper/src/KineticHarness.tsx` (62 lines)
  - `prototypes/MephitScraper/src/KpmResonanceLattice.tsx` (66 lines)
- **Dependencies**: React, `@react-three/fiber` (`Canvas`), `@react-three/drei` (`OrbitControls`, `Environment`, `Grid`, `Html`), Three.js.

## System Logic & Mechanics
- **Perimeter**: 2.5D Cel Animation extraction engine rendering animated billboard sprites inside a 3D R3F Canvas (Lines 42–76).
- **Anatomy & Image Extraction Pipeline**:
  - GIF Decoder Integration: Uses `(window as any).GifReader` to decode `/assets/heman_walk_pro.gif` into individual `THREE.CanvasTexture` frames (`KineticMephit.tsx`, Lines 110–139).
  - Smart Crop / Island Slicer: `extractIslands(url, rows, cols)` scans raw PNG grid sheets (`/assets/heman_back_8.png`, `/assets/heman_front_8.png`), calculates bounding boxes around non-white pixels (`luma < 240`), and creates cropped sub-textures with preserved aspect ratios (Lines 55–106).
  - Custom Chroma-Key Shader: `THREE.ShaderMaterial` fragment shader calculates RGB distance to `uKeyColor` and discards transparent pixels using `smoothstep(uSimilarity, uSimilarity + uSmoothness, d)` (Lines 142–181).
  - Universal Ripper HUD: Interactive HTML overlay (`<Html position={[-2, 1.5, 0]}>`) providing real-time color pickers and sliders for `chromaKey`, `chromaSimilarity`, and `chromaSmoothness` (Lines 281–380).
- **Physiology (Physics & Billboarding)**:
  - Movement physics handles keyboard inputs, velocity acceleration (`currentSpeed = isDash ? 30.0 : 15.0`), gravity (`-30.0`), jump impulses (`velocity.y = 12.0`), and ground plane collision (`position.y = 0`) (Lines 196–257).
  - Billboarding copies camera quaternion to sprite mesh every frame: `meshRef.current.quaternion.copy(state.camera.quaternion)` (Lines 265–268).

## Unresolved Blindspots & Open Questions
- **Global Dependency Assumption**: `KineticMephit.tsx` assumes `window.GifReader` is available globally in the browser runtime (Line 131). If `omggif` or `gifreader` script is not loaded in `index.html`, GIF decoding fails.

---

## 6. Module Discovery: `prototypes/semantic-paperdoll`

### 6.1 Semantic Paperdoll Ontology Engine (`App.tsx`, `femtoCoder.ts`, `geminiVision.ts`, `pillarClasses.ts`, `semanticMatcher.ts`)
## Verified Evidence
- **File Locations**:
  - `prototypes/semantic-paperdoll/src/App.tsx` (172 lines)
  - `prototypes/semantic-paperdoll/src/utils/semanticMatcher.ts` (145 lines)
  - `prototypes/semantic-paperdoll/src/utils/geminiVision.ts` (72 lines)
  - `prototypes/semantic-paperdoll/src/utils/femtoCoder.ts` (94 lines)
  - `prototypes/semantic-paperdoll/src/utils/pillarClasses.ts` (45 lines)
  - `prototypes/semantic-paperdoll/pillar_classes.json` (152 lines)
  - `prototypes/semantic-paperdoll/src/data/femto_dictionary.json` (625 KB)
  - `prototypes/semantic-paperdoll/src/data/semantic_manifest.json` (4.2 MB)

## System Logic & Mechanics
- **Perimeter**: Natural language & vision-driven 2D LPC paperdoll avatar generator (`App.tsx`, Lines 113–169).
- **Anatomy & Rendering Pipeline**:
  - Layer Stacking Order: `LAYER_ORDER = ['body', 'eyes', 'bottoms', 'footwear', 'tops', 'facial', 'hair', 'headwear', 'gloves', 'armor', 'cape', 'shield', 'weapon']` (`App.tsx`, Lines 8–10).
  - Render Position: Background position `-640px` Y-offset corresponds to LPC Row 10 (Rest Frame facing forward) (Line 32).
- **Physiology (Semantic Matching & FemtoBytecode)**:
  1. `buildConceptualSkin(tags)` (`semanticMatcher.ts`): Tokenizes user tags, queries `femto_dictionary.json` and `semantic_manifest.json`, calculates word overlap scores, and selects optimal LPC filename per layer.
  2. `analyzeImageForTags(base64Image)` (`geminiVision.ts`): Posts base64 image data to Google Gemini 1.5 Flash API endpoint `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}` to extract structured JSON tags and UDCA FemtoBytecode cypher string (Lines 26–55).
  3. `femtoCoder.ts`: Encodes and decodes base-10 numerical cyphers representing compressed character trait indices.

## Unresolved Blindspots & Open Questions
- **Missing Environment Variable**: `geminiVision.ts` relies on `import.meta.env.VITE_GEMINI_API_KEY` (Line 4). If API key is missing, image upload analysis throws runtime error.
- **Large Embedded Manifests**: `semantic_manifest.json` is 4.2 MB; loading it synchronously in client browser increases initial memory footprint.

---

## 7. Module Discovery: Standalone HTML & Asset Catalogs

### 7.1 `prototypes/MyOntology_VoxelRig_Standalone (2).html`
## Verified Evidence
- **File Location**: `c:/Users/zakde/Desktop/AntiGravity projects/MyOS/prototypes/MyOntology_VoxelRig_Standalone (2).html` (782 lines, 132,185 bytes)

## System Logic & Mechanics
- **Perimeter**: Standalone single-file HTML application featuring an interactive 3D Voxel Rig viewer and ontology inspector.
- **Anatomy**: Contains Closure compiler scripts, Tailwind CSS classes, inline SVG icons, and three-dimensional voxel grid rendering logic for MyOS node structures.

## Unresolved Blindspots & Open Questions
- **Duplicate Scraping Artifact**: Contains identical injected Closure polyfill header as `mystra_molecular_v24 (1).html`.

---

### 7.2 `prototypes/dnd_ai_hybrid/asset_index.json`
## Verified Evidence
- **File Location**: `c:/Users/zakde/Desktop/AntiGravity projects/MyOS/prototypes/dnd_ai_hybrid/asset_index.json` (679,434 lines, 28,425,843 bytes)

## System Logic & Mechanics
- **Perimeter**: Comprehensive JSON catalog indexing all PNG, JPG, GIF, and JSON asset paths across the entire MyOS repository.
- **Anatomy**: Categorizes assets by file extension (`png`, `jpg`, `gif`, `json`) with relative file path records (e.g., `apps/godot/lpc_crawler/assets/player.png`, `apps/web/public/assets/...`).

## Unresolved Blindspots & Open Questions
- **Static File Index**: Index is a static snapshot; adding new assets to the workspace does not automatically update this file unless re-indexed by a script.

---

## 8. Module Discovery: `Faerûn` (Main Production Module)

### 8.1 Architecture & Control Flow (`package.json`, `App.tsx`, `TreadmillContext.tsx`, `CylinderMath.ts`)
## Verified Evidence
- **File Locations**:
  - `Faerûn/package.json` (39 lines)
  - `Faerûn/src/App.tsx` (61 lines)
  - `Faerûn/src/logic/TreadmillContext.tsx` (76 lines)
  - `Faerûn/src/logic/CylinderMath.ts` (40 lines)
- **Dependencies**: React 19.2.4, Three.js 0.183.2, `@react-three/fiber` 9.5.0, `@react-three/drei` 10.7.7, Framer Motion 12.38.0, Tailwind CSS 4.2.2, Lucide React 1.7.0.

## System Logic & Mechanics
- **Perimeter (3D Viewport + Recursive Dock)**:
  - Top 3D Viewport (`flex-1 relative`): Renders R3F `<Canvas>` with `camera={{ position: [5, 5, 8], fov: 45 }}`, `Sky`, `Stars`, ambient & directional lights, `WorldMap`, `MapRenderer`, `Hero`, and `OrbitControls` (`App.tsx`, Lines 15–45).
  - Bottom Control Plane (`h-[320px] w-full`): Renders `<FaerunNexusContainer path={['PARTY']} />` (Lines 52–54).
- **Physiology (Treadmill World Scrolling)**:
  - `TreadmillProvider` (`TreadmillContext.tsx`): Tracks WASD/Arrow key states in `keys.current` (Lines 28–37).
  - Physics loop calculates velocity with inertia & friction: `speed = 0.05`, `friction = 0.9` (Lines 25–26). Moves `worldPos` (`x`, `z`) continuously while keeping camera/hero centered (Treadmill principle).
- **Cylinder Mathematics (`CylinderMath.ts`)**:
  - `calculatePerfectRadius(framesAroundPerimeter = 24)`: Calculates exact 3D cylinder radius `r = (64 * 24 / 64) / (2 * PI)` to eliminate pixel distortion when wrapping 64x64 LPC sprites around curved geometry (Lines 16–20).

## Unresolved Blindspots & Open Questions
- None. `Faerûn` is a clean, modular build.

---

### 8.2 World & Entity Rendering (`Hero.tsx`, `MapRenderer.tsx`, `WorldMap.tsx`, `SnapperService.ts`)
## Verified Evidence
- **File Locations**:
  - `Faerûn/src/components/Entities/Hero.tsx` (108 lines)
  - `Faerûn/src/components/World/MapRenderer.tsx` (80 lines)
  - `Faerûn/src/components/World/WorldMap.tsx` (38 lines)
  - `Faerûn/src/logic/SnapperService.ts` (58 lines)

## System Logic & Mechanics
- **Hero Cyclo-Cylinder (`Hero.tsx`)**:
  - Renders LPC hero sprite mapped to an inverted `<cylinderGeometry args={[radius, radius, 1.2, 32, 1, true]}>` with `side={THREE.BackSide}` and a concentric slit-mask cylinder (`opacity={0.3}`) (Lines 74–95).
  - UV Frame Stepping: Calculates row offset for direction (`down=10`, `up=8`, `left=9`, `right=11`) and steps column frame `0..7` at 12 FPS when `isMoving` is true (Lines 42–68).
- **Hexagonal Map Renderer (`MapRenderer.tsx`)**:
  - Renders 8 concentric rings (`VIEWPORT_RADIUS = 8`) of 3D hexagonal tiles around current `worldPos` (Lines 8, 43–55).
  - Axial Math: `hexToPixel(q, r)` calculates X/Z world coordinates for hexagonal grid alignment (Lines 25–29).
  - Deterministic Biomes: Deterministic sine noise function `Math.sin(q * 0.3) * Math.cos(r * 0.3)` assigns `grass`, `dirt`, or `water` textures (Lines 32–37).
- **Background World Map (`WorldMap.tsx`)**:
  - Renders 5000x5000 unit plane with `/assets/maps/world_map.jpg` texture at `scrollFactor = 0.5` for parallax depth behind the hex grid (Lines 21–34).
- **Semantic Snapper Service (`SnapperService.ts`)**:
  - Maps canonical D&D landmarks (`Yawning Portal`, `The Old Skull Inn`, `Zhentarim Outpost`, `Eye of the Cosmos`) to fixed axial coordinates `{q, r}` (Lines 20–25).
  - `resolveLocationFromFilename(filename)`: Parses incoming asset names and generates structured `MapPin` objects for tactical positioning (Lines 31–57).

## Unresolved Blindspots & Open Questions
- None.

---

### 8.3 Mitosis Dock & Nexus Navigation (`FaerunNexusContainer.tsx`, `FaerunNestedDock.tsx`)
## Verified Evidence
- **File Locations**:
  - `Faerûn/src/components/UI/FaerunNexusContainer.tsx` (173 lines)
  - `Faerûn/src/components/UI/FaerunNestedDock.tsx` (105 lines)

## System Logic & Mechanics
- **Perimeter & Architecture**: Recursive panel division system (Mitosis Engine) allowing endless side-by-side subsystem navigation (`PARTY`, `WORLD`, `LORE`, `COMBAT`, `MAGIC`, `INFO`).
- **Anatomy & Control Flow**:
  - `FaerunNestedDock` (`FaerunNestedDock.tsx`): Vertical control strip rendering icon buttons with active glow aura, hover tooltips (`motion.div`), and active indicator dots (Lines 36–102).
  - `FaerunNexusContainer` (`FaerunNexusContainer.tsx`): Header displays ontological breadcrumb path `FSG://PARTY.WORLD` (Lines 105–122). Clicking a dock button toggles `activeSubPillars` state, triggering Framer Motion slide-in animation (`x: "100%" -> 0`) of a nested `<FaerunNexusContainer path={[...path, subId]} depth={depth + 1} />` (Lines 147–168).

## Unresolved Blindspots & Open Questions
- None.

---

## 9. Module Discovery: `Faerun-Sandbox`

### 9.1 AE-12 Zoetrope Engine (`package.json`, `App.tsx`, `ZoetropeCylinder.tsx`)
## Verified Evidence
- **File Locations**:
  - `Faerun-Sandbox/package.json` (27 lines)
  - `Faerun-Sandbox/src/App.tsx` (44 lines)
  - `Faerun-Sandbox/src/components/ZoetropeCylinder.tsx` (96 lines)

## System Logic & Mechanics
- **Perimeter**: Isolated R3F testing laboratory for physical 3D Zoetrope animation cylinders (`App.tsx`, Lines 9–26).
- **Anatomy**:
  - Renders `<Stage environment="forest">` containing `<ZoetropeCylinder url="/baby_sprite.png" rows={1} cols={13} startFrame={0} frameCount={13} />` (Lines 14–21).
  - UI HUD displays real-time frame counter and FPS indicator (`AE-12 ZOETROPE // BABY SPRITE TEST // 12 FPS`) (Lines 27–38).
- **Physiology (Zoetrope Persistence of Vision)**:
  - `texture.repeat.set(1 / cols, 1 / rows)` sets texture frame UV scale (Line 24).
  - `useFrame` steps texture UV offset `texture.offset.x = col / cols`, `texture.offset.y = 1 - (row + 1) / rows` every 1/12th second (`fps = 12`) (Lines 28–44).
  - Mesh physics slowly rotates inner cylinder `meshRef.current.rotation.y += delta * 0.1` while static outer mask cylinder (`color="#000000"`, `opacity={0.9}`) creates mechanical slit-persistence visual effect (Lines 47–75).

## Unresolved Blindspots & Open Questions
- **Missing Asset File**: `url="/baby_sprite.png"` is requested by `App.tsx:16`, but `baby_sprite.png` does not exist in `Faerun-Sandbox/public`.

---

## 10. Comprehensive Synthesis & Cross-Module Comparison

| Module / Component | Category / Scope | Visual Engine | Frame Rate / Animation Logic | Key External / Internal Data Interfaces | Primary State Hooks & Event Handlers |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`old_sprite.tsx`** | Standalone Component | R3F / THREE.js Plane | 4 / 8 / 10 FPS (Idle / Talk / Walk) | `SpriteSheetAvatarProps` | `useLoader`, `useMemo`, `useFrame` |
| **`mystra_molecular_v24 (1).html`** | Standalone Web App | HTML5 / Tailwind / Canvas | CSS Refraction Transitions | 1,240 Core Node Genome Tree | Inline JS DOM event listeners |
| **`oga_dump.html`** | Static HTML Scrap | HTML5 | Static | Drupal 7 OpenGameArt.org Form | None |
| **`artifacts/MyOS_Ontology_Map.md`** | Markdown Artifact | N/A | Static | Decagonal Fractal Mapping Index | None |
| **`apps/SonicLattice`** | Full App | 3D Force Graph | 60 FPS RequestAnimationFrame | `http://localhost:3001/api/lattice` | `useState`, `useRef`, `useCallback`, Web Audio API |
| **`apps/genesis`** | Substrate / App | React HTML / CSS | CSS Scanline / Keyframe Eye | `RELATIONSHIP_MATRIX`, `FRACTAL_GENOME` | `useState`, `useMemo`, `useEffect` |
| **`apps/godot/16bit_arena`** | Godot 2D Submodule | Godot 4.x 2D | Physics Delta Process | `Enemy.tscn`, `Player.tscn` | `Input.get_axis`, `move_and_slide()` |
| **`apps/godot/lpc_crawler`** | Godot 3D Submodule | Godot 4.x 3D | Drunkard's Walk Step Generator | `Texture2D` Wall/Floor Materials | `_unhandled_input()`, `generate_map()` |
| **`prototypes/MephitScraper`** | 2.5D Cel Inscriber | R3F / Custom Shader | 12 / 24 FPS (Walk / Dash) | GIFReader / Island Slicer | Keyboard WASD Controller, `useFrame` |
| **`prototypes/semantic-paperdoll`** | NLP/Vision Prototype | HTML5 Canvas / CSS | 2D Layer Rest Frame (Row 10) | Gemini 1.5 Flash REST API | `FileReader`, `analyzeImageForTags()`, `buildConceptualSkin()` |
| **`prototypes/MyOntology_VoxelRig`** | Standalone Web App | HTML5 / Tailwind | CSS Transitions | Voxel Node Inspector | Inline JS |
| **`prototypes/dnd_ai_hybrid`** | JSON Catalog | N/A | Static | Workspace Asset Path Index (679k lines) | None |
| **`Faerûn`** | Production VTT | R3F + Framer Motion | 12 FPS LPC Hero + Treadmill | 8-Ring Hex Grid + Parallax Map | `TreadmillContext`, WASD Physics, `FaerunNestedDock` |
| **`Faerun-Sandbox`** | R3F Lab | R3F Stage | 12 FPS Zoetrope Cylinder | `baby_sprite.png` Atlas | `useFrame` UV Offset Calculation |

---

## 11. Consolidated Unresolved Blindspots & Risk Register

1. **Unresolved Network Dependencies**:
   - `SonicLattice.tsx`: Requires local backend server running on `http://localhost:3001` for `/api/lattice` and `/audio/...`.
   - `mystra_molecular_v24 (1).html` & `MyOntology_VoxelRig_Standalone (2).html`: Depend on external CDN scripts (`gstatic.com`, `googleapis.com`).
   - `semantic-paperdoll/src/utils/geminiVision.ts`: Requires valid `VITE_GEMINI_API_KEY` for Google Gemini Vision API calls.

2. **Missing Media & Manifest Assets**:
   - `apps/genesis/src/App.tsx`: Refers to `/assets/lpc/Sword_10.png`, `Vegies.png`, `key0.png` which are not present in `genesis/public`.
   - `apps/genesis/src/InventoryApplet.tsx`: Attempts to fetch `/manifests/vault_substrate.json` which does not exist in `genesis/public`.
   - `Faerun-Sandbox/src/App.tsx`: Refers to `/baby_sprite.png` which is missing from `Faerun-Sandbox/public`.

3. **Orphaned / Unlinked Source Files**:
   - `old_sprite.tsx`: High-quality R3F spritesheet component sitting unimported in repository root.
   - `apps/genesis/src/nodes/0.0.0_Profile.ts` through `9.0.0_Awakening.ts`: Standalone node files with `console.log` statements that are not referenced in the app bundle.
