# Symbiorithmic Deep Dive — Explorer Survey 3 Analysis Report

## Executive Summary
This report presents the architectural survey, codebase investigation, visual atmospheric preset mappings, spatial memory tag reactivity specifications (Requirement R4), build system assessment, and testing infrastructure design for the **Symbiorithmic Deep Dive** project in MyOS.

---

## 1. Codebase Investigation Findings

### 1.1 `ParallaxatronEngine.tsx` & Visual Engine Architecture
- **Source Location**: `c:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\src\components\World\ParallaxatronEngine.tsx`
- **Companion Component**: `c:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\src\components\World\ParallaxCyclotron.tsx`
- **Active Rendering World**: `c:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\src\components\World\AstraLabWorld.tsx` (Line 449)

#### Key Data Structures & Types (`ParallaxatronEngine.tsx`):
- `ParallaxGeometryType`: `'cylinder' | 'sphere' | 'plane' | 'cone'`
- `ParallaxLayerSpec`:
  - `id`: string identifier (e.g., `overland_sky`, `storm_thunderheads`)
  - `geometryType`: `'cylinder' | 'sphere' | 'plane' | 'cone'`
  - `textureUrl`: URL string pointing to public texture asset
  - `radius` & `height`: Layer dimensions
  - `position` & `rotation`: 3D offsets `[X, Y, Z]`
  - `isStationary`: Boolean to toggle rotational movement
  - `speedY` & `speedX`: Angular rotation velocities in radians/sec
  - `scrollUvX` & `scrollUvY`: UV texture scroll velocities
  - `opacity`, `alphaTest`, `color`, `repeatX`, `repeatY`
  - `isLocalFx`: Toggles between world-anchored position vs player-centered skybox

#### Existing Presets in `PARALLAXATRON_PRESETS`:
1. `faerun_overland`: 3 concentric cylinders (`overland_sky`, `overland_clouds`, `overland_creatures`).
2. `yawning_portal`: Single tavern rafter cylinder (`tavern_rafters`).
3. `fireball_vortex`: 2 nested localized spell spheres (`fire_inner_core`, `fire_outer_plasma`).

### 1.2 Active World Wiring (`AstraLabWorld.tsx`)
Currently, `AstraLabWorld.tsx` mounts `ParallaxatronEngine` at line 449 with a hardcoded prop:
```tsx
<ParallaxatronEngine presetId="faerun_overland" anchorPosition={[px, 0, pz]} />
```
It lacks dynamic reactivity to player 3D coordinates `[px, py, pz]` and active spatial memory tags.

---

## 2. Requirement R4 Specification — Spatial Memory Tag to Parallaxatron Preset Mapping

Requirement R4 specifies:
> Integrate the ParallaxatronEngine with spatial memory nodes so that entering regions with specific historical lore (e.g. ancient battlefields or haunted ruins) automatically triggers corresponding atmospheric Parallaxatron presets (stormy skies, bioluminescent spores, dark shadow rings).

### 2.1 Visual Preset Mapping Table

| Spatial Memory Tag / Region Lore | Parallaxatron Preset ID | Multiplane Layer Specs & Visual Characteristics |
|---|---|---|
| `ancient_battlefield`, `blood_marsh`, `war_zone` | `stormy_skies` | **Layer 1 (Storm Sky Dome)**: `geometryType: 'cylinder'`, `textureUrl: '/assets/textures/skybox/night_skybox.png'`, `radius: 1200`, `height: 800`, `color: '#374151'` (dark slate grey).<br>**Layer 2 (Turbulent Thunderhead Clouds)**: `geometryType: 'cylinder'`, `textureUrl: '/assets/textures/parallax_clouds_layer2.png'`, `radius: 950`, `height: 650`, `speedY: 0.025`, `scrollUvX: 0.015`, `opacity: 0.85`, `alphaTest: 0.05`, `color: '#1e293b'`.<br>**Layer 3 (Lightning / Arc Ring)**: `geometryType: 'cylinder'`, `textureUrl: '/assets/textures/parallax_clouds_layer2.png'`, `radius: 750`, `height: 450`, `speedY: -0.04`, `opacity: 0.6`, `color: '#38bdf8'` (electric blue). |
| `bioluminescent_grotto`, `underdark`, `spore_forest`, `myconid_cavern` | `bioluminescent_spores` | **Layer 1 (Deep Cavern Ceiling)**: `geometryType: 'cylinder'`, `textureUrl: '/assets/textures/skybox/night_skybox.png'`, `radius: 800`, `height: 500`, `isStationary: true`, `color: '#022c22'` (deep emerald black).<br>**Layer 2 (Bioluminescent Spore Cloud)**: `geometryType: 'cylinder'`, `textureUrl: '/assets/textures/parallax_clouds_layer2.png'`, `radius: 600`, `height: 400`, `speedY: 0.008`, `scrollUvY: -0.01`, `opacity: 0.8`, `alphaTest: 0.05`, `color: '#06b6d4'` (cyan luminescence).<br>**Layer 3 (Floating Spore Particles)**: `geometryType: 'cylinder'`, `textureUrl: '/assets/textures/parallax_creatures_layer3.png'`, `radius: 400`, `height: 300`, `speedY: -0.015`, `scrollUvY: 0.02`, `opacity: 0.9`, `alphaTest: 0.05`, `color: '#34d399'` (emerald green glow). |
| `haunted_ruins`, `shadowfell`, `necrotic_tomb`, `lich_sanctum` | `dark_shadow_rings` | **Layer 1 (Void Backdrop)**: `geometryType: 'cylinder'`, `textureUrl: '/assets/textures/skybox/night_skybox.png'`, `radius: 1100`, `height: 700`, `isStationary: true`, `color: '#0f172a'` (midnight navy).<br>**Layer 2 (Outer Shadow Ring)**: `geometryType: 'cylinder'`, `textureUrl: '/assets/textures/parallax_clouds_layer2.png'`, `radius: 850`, `height: 550`, `speedY: -0.018`, `opacity: 0.85`, `alphaTest: 0.05`, `color: '#312e81'` (indigo black).<br>**Layer 3 (Inner Counter-Rotating Shadow Ring)**: `geometryType: 'cylinder'`, `textureUrl: '/assets/textures/parallax_clouds_layer2.png'`, `radius: 600`, `height: 400`, `speedY: 0.03`, `speedX: 0.005`, `opacity: 0.75`, `alphaTest: 0.05`, `color: '#581c87'` (deep purple shadow). |
| `waterdeep_city`, `urban_streets` | `waterdeep_city_streets` | **Layer 1 (Sky)**: `cylinder`, `radius: 1200`, `height: 800`, `textureUrl: '/assets/textures/skybox/morning_skybox.png'`, `color: '#fef08a'`.<br>**Layer 2 (City Silhouette Ring)**: `cylinder`, `radius: 900`, `height: 500`, `textureUrl: '/assets/textures/parallax_clouds_layer2.png'`, `color: '#475569'`. |
| `undermountain`, `subterranean_dungeon` | `undermountain_cavern` | **Layer 1 (Cavern Vault)**: `cylinder`, `radius: 700`, `height: 450`, `color: '#111827'`.<br>**Layer 2 (Subterranean Mist)**: `cylinder`, `radius: 500`, `height: 300`, `speedY: 0.005`, `color: '#4b5563'`. |
| `icewind_dale`, `blizzard_mountain` | `icewind_blizzard` | **Layer 1 (Frozen Sky)**: `cylinder`, `radius: 1200`, `height: 800`, `color: '#e0f2fe'`.<br>**Layer 2 (Blizzard Snowfall)**: `cylinder`, `radius: 850`, `height: 600`, `speedY: 0.04`, `scrollUvY: 0.03`, `color: '#ffffff'`. |
| `candlekeep`, `arcane_library` | `candlekeep_library` | **Layer 1 (Arcane Sky Dome)**: `cylinder`, `radius: 1000`, `height: 700`, `color: '#312e81'`.<br>**Layer 2 (Rune Rings)**: `cylinder`, `radius: 700`, `height: 450`, `speedY: -0.01`, `color: '#a855f7'`. |
| `faerun_overland`, `sword_coast` (Default) | `faerun_overland` | Standard 3-layer overland preset (`overland_sky`, `overland_clouds`, `overland_creatures`). |

### 2.2 End-to-End Reactive Integration Architecture

```
                       ┌──────────────────────────────┐
                       │  3D WebGL Player Coordinates │
                       │         [X, Y, Z]            │
                       └──────────────┬───────────────┘
                                      │
                                      ▼
                       ┌──────────────────────────────┐
                       │ Spatial Memory Query Engine  │
                       │  (SQLite db / Spatial Index) │
                       └──────────────┬───────────────┘
                                      │  query radius R=50
                                      ▼
                       ┌──────────────────────────────┐
                       │ Spatial Tag Resolver Engine  │
                       │ (Matches lore/spatial tags)  │
                       └──────────────┬───────────────┘
                                      │  resolves presetId
                                      ▼
                       ┌──────────────────────────────┐
                       │  Spatial Parallax Bridge     │
                       │  (Lerps opacities over 1.5s) │
                       └──────────────┬───────────────┘
                                      │  activePresetId & customLayers
                                      ▼
                       ┌──────────────────────────────┐
                       │   ParallaxatronEngine Mesh   │
                       │ (Renders multiplane layers)  │
                       └──────────────────────────────┘
```

---

## 3. Project Build System & Test Runner Infrastructure Assessment

### 3.1 Workspace & Directory Layout
- **Root Directory**: `c:\Users\zakde\Desktop\AntiGravity projects\MyOS`
- **Subproject Target Location**: `c:\Users\zakde\Desktop\AntiGravity projects\MyOS\teamwork_projects\symbiorithmic_deep_dive`
- **Package Management**: Root `package.json` configures npm workspaces (`apps/*`, `packages/*`).
- **Target Module Layout**:
  ```
  teamwork_projects/symbiorithmic_deep_dive/
  ├── PROJECT.md
  ├── package.json
  ├── tsconfig.json
  ├── src/
  │   ├── index.ts
  │   ├── spatial/
  │   │   ├── SpatialVectorQueryEngine.ts
  │   │   └── SpatialLoreAnchor.ts
  │   ├── playtest/
  │   │   ├── AutonomousPlaytestHarness.ts
  │   │   └── RegionAwareAgentDriver.ts
  │   ├── mutation/
  │   │   ├── WorldMemoryMutationPipeline.ts
  │   │   └── SpatialMemoryWriter.ts
  │   └── parallax/
  │       ├── ParallaxatronPresetCatalog.ts
  │       ├── ParallaxatronAtmosphericController.ts
  │       └── CustomFractalShaders.ts
  ├── tests/
  │   ├── spatial.test.ts
  │   ├── playtest.test.ts
  │   ├── mutation.test.ts
  │   ├── parallax.test.ts
  │   └── e2e-runner.mjs
  └── docs/
      ├── architectural_blueprint.md
      └── spatial_ontology_mapping.md
  ```

### 3.2 Build Commands & Verification Status
- **Root Monorepo Build**: `npm run build` (`npm run build --workspaces`)
- **Web App Build**: `npm --prefix apps/web run build` (`tsc -b && vite build`)
- **Symbiorithmic Sub-package Build**: `npm --prefix teamwork_projects/symbiorithmic_deep_dive run build`
- **Command Status**: Build commands rely on `tsc -b` and `vite build`. Pre-existing `apps/web` package compiles clean.

### 3.3 Test Runner Infrastructure
- **Root Monorepo Test**: `npm run test` (`npm run test --workspaces`)
- **Symbiorithmic E2E Test Suite**: `node teamwork_projects/symbiorithmic_deep_dive/tests/e2e-runner.mjs` or `npm --prefix teamwork_projects/symbiorithmic_deep_dive run test:e2e`
- **4-Tier Test Architecture**:
  1. **Tier 1 (Unit & Feature Coverage)**: 5 tests per requirement R1-R4 (20 test cases).
  2. **Tier 2 (Boundary & Corner Cases)**: 5 tests per requirement R1-R4 (20 test cases).
  3. **Tier 3 (Cross-Feature Integration)**: 8 pairwise interaction tests.
  4. **Tier 4 (Real-World E2E Scenarios)**: 5 full end-to-end spatial navigation and memory mutation scenarios.
  - Total Target Test Suite Count: **53 Opaque-Box Test Cases**.

---

## 4. Enumeration of R4 Features & Missing Integration Code

### 4.1 Missing Implementation Items
1. **Preset Catalog Expansion (`ParallaxatronEngine.tsx`)**:
   - Add `stormy_skies`, `bioluminescent_spores`, `dark_shadow_rings`, `waterdeep_city_streets`, `undermountain_cavern`, `icewind_blizzard`, `candlekeep_library` to `PARALLAXATRON_PRESETS`.
2. **Spatial Parallax React Bridge (`SpatialParallaxBridge.ts`)**:
   - Class/Hook bridging spatial query tags to `ParallaxatronEngine` state with smooth layer opacity lerping (1.5s cross-fade).
3. **GLSL Mandelbrot / Julia Fractal Shaders (`CustomFractalShaders.ts`)**:
   - GLSL shaders for elemental spell effects (*Cone of Cold* frost blooms, *Lightning Bolt* electric arcs).
4. **Dynamic Props in `AstraLabWorld.tsx`**:
   - Replace hardcoded `presetId="faerun_overland"` prop with dynamic state bound to `activeSpatialTag`.
5. **Project Infrastructure Setup in `teamwork_projects/symbiorithmic_deep_dive`**:
   - Create subproject directory, `package.json`, `tsconfig.json`, source folders, and `tests/e2e-runner.mjs`.

---

## 5. Summary & Handoff Readiness
All investigation tasks for R4 and project infrastructure are complete. The findings and architectural specifications provide an exact blueprint for implementation and forensic audit verification.
