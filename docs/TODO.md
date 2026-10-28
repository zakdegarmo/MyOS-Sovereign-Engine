# MyOS Off-Grid Task List (TODO)

This document tracks pending architectural hardening, bug fixes, and feature implementations. MystraGem, consult this list when looking for autonomous development tasks.

## Domain 1: The Core Backend & Bridges
- **Swarm Server Persistence:** [RESOLVED] Telemetry & conversation context have been migrated to the persistent SQLite database (`data/myos_vector_store.db`), replacing volatile memory storage.
- **Agent Bridge Telemetry Sync:** Ensure telemetry events from the 3D WebGL environment (`http://localhost:5173`) read and write seamlessly to the SQLite memory store via the `agent-bridge.js` API.

## Domain 2: The Knowledge & Memory Engine
- **Active Dungeon Master Context Protocol:** `LoreService` needs an "active memory loop" that pre-fetches D&D rules based on the current scene (e.g., if the user is in a "combat" state, automatically load AC and Initiative rules into the prompt).
- **Lore Database Syncing:** Ensure that the `agent-bridge.js` Orama instance can hot-reload if a file is manually dropped into `apps/web/lore-db/` without requiring a server reboot.

## Domain 3: The Orchestrator UI & HUD
- **HUD Layout Persistence:** Bind the X/Y coordinates of draggable windows (like the `OrchestratorPanel` and `IDEPanel`) to a Zustand store connected to `localStorage` so custom layouts are preserved.
- **MystraGem Avatar Integration:** Visually represent MystraGem within the HUD, potentially tying her emotional state/sentiment to dynamic UI colors or a 2D animated portrait.

## Domain 4: The 3D Environment & Avatar Sandbox
- **Cartoonify Pipeline Finalization:** Complete the bridge between the `/cartoonify` workflow and `VoxelSprite.tsx`. We need an automated way for MystraGem to generate a 2D asset, save it via `agent-bridge.js`, and have `AvatarScene.tsx` dynamically hot-reload the new NPC into the world.
- **Automated 2D Game Asset Pipeline (Forge 2D Assets):** Create an autonomous Antigravity Skill (`forge_2d_assets`) to generate 2D game assets, tilesets, and environments from text prompts. This pipeline will use Google GenAI for the raw image generation and an automated Python script (using Pillow) to handle chroma-key background removal, sprite grid slicing, and seamless texture generation. (Note: Local 3D generation via Hunyuan3D is currently too slow, making this 2D pipeline the preferred rapid-prototyping method).
- **3D Collision Meshes:** Implement rudimentary NavMesh or bounding boxes around `ModularBuilding.tsx` so spawned avatars do not clip through structures.

## Domain 5: The Semantic Genome & Workflows
- **Automated Memory Ingestion (Ouroboros):** Build a "Reflection Loop" where MystraGem automatically generates a markdown file summarizing the D&D session and files it into one of the `src/<Pillar>/` directories, effectively "growing" her own codebase.
- **Refactoring Workflows:** Review the `/rubedo` and `/nigredo` workflows to ensure they explicitly call out the `agent-bridge.js` file-writing protocols so MystraGem can execute them autonomously.

## Domain 6: External Scripts & Prototypes
- **Ingestion Pipeline Automation:** The repos in `tmp/ingestion/` (e.g., `excalidraw`, `n8n`) need to be processed by the scripts in `scripts/ingestion/`. We need a centralized bash/node script that automates this parsing so MystraGem can easily ingest them on command.
- **Semantic Paperdoll Integration:** The experimental 2D-to-3D lab in `prototypes/semantic-paperdoll/` needs to be fully integrated into the `apps/web/src/components/World` directory so it isn't isolated from the main WebGL canvas.

## Domain 7: Special Effects & Parallaxatron Engine Roadmap
- **Parallaxatron Preset Catalog:** Expand `PARALLAXATRON_PRESETS` in `ParallaxatronEngine.tsx` to include environment presets for `yawning_portal`, `waterdeep_city_streets`, `undermountain_cavern`, `icewind_blizzard`, and `candlekeep_library`.
- **Sphere-Sliding Spell FX (Fireballs & Arcane Orbs):** Implement localized concentric sphere meshes that slide UV-animated procedural noise & flame textures across 3D space to create living *Fireballs*, *Melf's Minute Meteors*, *Shield of Faith*, and *Spirit Guardians*!
- **Mandelbrot & Julia Fractal Shaders (Frost & Lightning):** Implement custom GLSL fractal shaders in `ParallaxatronEngine.tsx` for expanding frost blooms (*Cone of Cold*, *Ice Storm*) and branching electric arcs (*Lightning Bolt*, *Chain Lightning*).
- **Interactive Parallax Hazards & Cover:** Link Parallaxatron layer movement to turn-based 5e mechanics (e.g., lightning storm rings trigger DC 13 DEX saves; ground fog rings grant +2 AC Half-Cover).
- **gLTF-Transform Pipeline:** Integrate `gltf-transform` web-assembly tools for Draco compression, texture downsizing, and LOD mesh generation across 2.5D/3D hybrid assets.
