# Project: Autonomous Multi-Agent 3D Animation Studio Production System & Virtual Soundstage

## Architecture
The MyOS 3D Animation Studio is a full-stack, local-first film production and screening environment composed of four decoupled subsystems:
1. **Creative Brain (Local Agent Crew)**: Three specialized agent personas (Director, DP, Screenwriter) powered by local Ollama (`gemma4:latest` on GPU) or Agent Bridge (`localhost:8081`). Translates natural language creative prompts into deterministic multi-shot production manifests adhering to `production_manifest.schema.json`.
2. **Filming Engine (Headless Blender 5.2)**: A Python `bpy` engine executing headlessly via `C:\Program Files\Blender Foundation\Blender 5.2\blender.exe`. Loads base humanoid meshes (`flesh_female_comic.blend`, `lunaria_flesh_mannequin.blend`), binds wardrobe/weapons from `chibi_universal_wardrobe_master.blend` to bone sockets (`Hand.R_Socket`), applies cel chiaroscuro shaders + inverted hull outlines, choreographs dynamic camera moves, and renders frame sequences to `temp_studio_frames/`.
3. **Reel Assembly (PyAV Compiler)**: System Python (`C:\Python313\python.exe`) compiler utilizing PyAV 18.0.0 to stitch rendered frames into pristine H.264 `yuv420p` MP4 video at 24 fps, delivered directly to `apps/web/public/screenings/`.
4. **Virtual Soundstage & Screening Theater (Web 3D Studio)**: Interactive Three.js / React Three Fiber soundstage inside `apps/web`. Features a polished studio floor with grid decals, industrial overhead lighting trusses, agent crew avatars (`director`, `dp`, `gaffer`), a 16:9 projection screen with ambilight bounce (`TheaterScreen.tsx`), and a studio modal HUD (`SoundstageStudioModal.tsx`) with prompt input, pipeline status, shotlist inspector, and reel player.

```
[User Creative Prompt]
          │
          ▼
[M1: Local Agent Pipeline (Director, DP, Screenwriter)] ──► production_manifest.json
          │
          ▼
[M2: Headless Blender 5.2 Filming Engine] ──► temp_studio_frames/frame_####.png
          │
          ▼
[M3: PyAV Video Reel Compiler] ──► apps/web/public/screenings/<title>.mp4
          │
          ▼
[M4: Web 3D Virtual Soundstage & Theater] ──► Interactive 3D Screen & Studio HUD
          │
          ▼
[M5: E2E Verification & Benchmark Teaser ("Crimson Zenith")]
```

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Multi-Agent Persona Engine | Director, DP, Screenwriter prompt pipeline querying Ollama/Agent Bridge | M1 | Survey / R1 |
| 2 | Production Manifest Schema & Fallbacks | Canonical JSON schema with 4-tier robust parsing and deterministic generator | M1 | Survey / R1 |
| 3 | Headless Blender Filming Engine | Deterministic `bpy` engine for set, lighting, character posing, and rendering | M2 | Survey / R2 |
| 4 | Asset Appending & Socket Rigging | Appends weapons/wardrobe and binds non-modally to bone sockets (`Hand.R_Socket`) | M2 | Survey / R2 |
| 5 | Cel & Chiaroscuro Shader Network | 3-stop constant cel shader with inverted hull ink outlines in Blender 5.2 | M2 | Survey / R2 |
| 6 | Dynamic Cinematography Engine | Multi-shot camera cuts, dollies, cranes, and explicit lens keyframing | M2 | Survey / R2 |
| 7 | PyAV Video Reel Compiler | Stitches frame sequences into browser-playable H.264 `yuv420p` MP4 at 24 fps | M3 | Survey / R3 |
| 8 | 3D Virtual Soundstage Environment | Three.js R3F soundstage world with studio floor, walls, trusses, and lighting | M4 | Survey / R4 |
| 9 | 3D Virtual Theater Screen | 16:9 projection screen using `useVideoTexture`, ambilight glow, and projector cone | M4 | Survey / R4 |
| 10 | Film Crew Avatars | `director`, `dp`, `gaffer` in `agentRegistry.tsx` staged at production stations | M4 | Survey / R4 |
| 11 | Studio Production UI Modal | Studio HUD with prompt input, pipeline status stepper, shotlist inspector, reel player | M4 | Survey / R4 |
| 12 | End-to-End Benchmark Teaser | Full test of "Crimson Zenith: Duel of the Sundered Sisterhood" & verification | M5 | Survey / AC |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Local Agent Pipeline & Manifest Engine | `scripts/tools/studio_agent_pipeline.py`, schema validation, Ollama/Agent Bridge endpoints | None | PLANNED |
| M2 | Deterministic Blender Filming Engine | `scripts/tools/film_studio_reel.py`, socket parenting, cel shaders, camera animation | M1 | PLANNED |
| M3 | PyAV Video Reel Compiler & Pipeline | `scripts/tools/stitch_studio_reel.py`, H.264 encoding, UTF-8 safety, public screenings routing | M2 | PLANNED |
| M4 | 3D Soundstage, Theater Screen & Studio UI | `SoundstageWorld.tsx`, `TheaterScreen.tsx`, `CrewAvatars.tsx`, `SoundstageStudioModal.tsx`, agent registry | None | PLANNED |
| M5 | E2E Integration, Benchmark & Forensic Audit | Full pipeline run for "Crimson Zenith", automated test suites, forensic integrity audit | M1, M2, M3, M4 | PLANNED |

## Interface Contracts

### M1 ↔ M2: `production_manifest.json`
- **Path**: `temp_studio_frames/production_manifest.json` (or passed via `--manifest <path>`)
- **Format**: JSON matching `production_manifest.schema.json`
- **Fields**:
  - `metadata`: `{ title: string, fps: 24, resolution: { width: 640, height: 360 }, total_frames: 96, engine: "BLENDER_EEVEE" }`
  - `environment`: `{ base_blend: "flesh_female_comic.blend", terrain: {...}, backdrop: {...} }`
  - `lighting`: Array of `{ name: string, type: "SUN", energy: number, color_rgb: [r, g, b], rotation_deg: [x, y, z] }`
  - `characters`: Array of `{ id: string, name: string, source_object: string, initial_transform: {...}, equipment: [...], actions: [...] }`
  - `shots`: Array of `{ shot_id: number, name: string, frame_start: number, frame_end: number, lens_mm: number, camera_movement: {...} }`

### M2 ↔ M3: Frame Sequence Output
- **Location**: `temp_studio_frames/frame_####.png`
- **Format**: PNG sequence, 640x360 (or configured resolution), 1-indexed (`frame_0001.png` to `frame_0096.png`)
- **Metadata Output**: `temp_studio_frames/film_meta.json` containing `{ title, fps, total_frames, output_mp4 }`

### M3 ↔ M4: Screenings Media Route
- **Location**: `apps/web/public/screenings/<title>.mp4`
- **Web URL**: `http://localhost:5173/screenings/<title>.mp4` (or `window.location.origin + "/screenings/<title>.mp4"`)
- **Codec**: Video: H.264 (AVC1), High profile, Pixel Format: YUV420P, Framerate: 24 fps

### M4 ↔ M1/M2/M3: Agent Bridge API
- `POST /api/studio/manifest`: Body `{ prompt: string, model?: string }` -> returns `{ manifest: object }`
- `POST /api/studio/produce`: Body `{ prompt?: string, manifest?: object }` -> triggers pipeline -> returns `{ success: boolean, videoUrl: string, manifest: object }`

## Code Layout
- `scripts/tools/studio_agent_pipeline.py`: Local agent pipeline (Director, DP, Screenwriter) querying Ollama.
- `scripts/tools/production_manifest.schema.json`: Authoritative JSON schema for production manifests.
- `scripts/tools/manifest_crimson_zenith.json`: Canonical reference manifest for the Crimson Zenith benchmark.
- `scripts/tools/film_studio_reel.py`: Production-grade deterministic headless Blender 5.2 filming script.
- `scripts/tools/film_crimson_zenith.py`: Verified benchmark filming script with bone socket parenting and lens keyframing fixes.
- `scripts/tools/stitch_studio_reel.py`: PyAV 18.0.0 video encoder producing H.264 MP4 reels.
- `apps/web/agent-bridge.js`: Agent Bridge server adding `/api/studio/manifest` and `/api/studio/produce` endpoints.
- `apps/web/public/screenings/`: Directory for playable video reels served by Vite at `/screenings/`.
- `apps/web/src/components/Soundstage/`:
  - `SoundstageWorld.tsx`: 3D soundstage environment with grid, lighting trusses, walls, props.
  - `TheaterScreen.tsx`: 3D 16:9 projection screen with `useVideoTexture` and ambilight glow.
  - `CrewAvatars.tsx`: 3D film crew avatars (Director, DP, Gaffer) and Executive Producer.
  - `SoundstageStudioModal.tsx`: Studio HUD modal with prompt input, pipeline status, shotlist inspector, reel player.
  - `types.ts`: TypeScript types for soundstage and manifests.
- `apps/web/src/components/MaxOverlay/environmentRegistry.ts`: Registration of `'soundstage'` environment.
- `apps/web/src/components/MaxOverlay/AvatarScene.tsx`: Soundstage dimension mounting.
- `apps/web/src/components/MaxOverlay/MaxOverlay.tsx`: Studio modal mounting.
- `apps/web/src/components/MaxOverlay/SystemHud.tsx`: Clapperboard dock icon button.
- `apps/web/src/council/agentRegistry.tsx`: Registration of `director`, `dp`, and `gaffer` council agents.
- `apps/web/tests/soundstage_theater.test.ts`: Automated unit and integration test suite.
