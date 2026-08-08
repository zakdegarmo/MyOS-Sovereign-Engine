# MyOS Off-Grid Task List (TODO)

This document tracks pending architectural hardening, bug fixes, and feature implementations. MystraGem, consult this list when looking for autonomous development tasks.

## Domain 1: The Core Backend & Bridges
- **Vision Bridge Upgrade:** The `/api/vision/capture` endpoint currently relies on a slow, hacky PowerShell script. This needs to be transitioned to use the robust OBS WebSocket (port 4455) for high-framerate, instantaneous screen context.
- **Swarm Server Persistence:** `swarm-server.js` currently stores `chatHistory` in volatile memory. If the server restarts, swarm context is lost. This needs to be persisted to a local JSON file or SQLite DB.

## Domain 2: The Knowledge & Memory Engine
- **Active Dungeon Master Context Protocol:** `LoreService` needs an "active memory loop" that pre-fetches D&D rules based on the current scene (e.g., if the user is in a "combat" state, automatically load AC and Initiative rules into the prompt).
- **Lore Database Syncing:** Ensure that the `agent-bridge.js` Orama instance can hot-reload if a file is manually dropped into `apps/web/lore-db/` without requiring a server reboot.

## Domain 3: The Orchestrator UI & HUD
- **HUD Layout Persistence:** Bind the X/Y coordinates of draggable windows (like the `OrchestratorPanel` and `IDEPanel`) to a Zustand store connected to `localStorage` so custom layouts are preserved.
- **MystraGem Avatar Integration:** Visually represent MystraGem within the HUD, potentially tying her emotional state/sentiment to dynamic UI colors or a 2D animated portrait.

## Domain 4: The 3D Environment & Avatar Sandbox
- **Cartoonify Pipeline Finalization:** Complete the bridge between the `/cartoonify` workflow and `VoxelSprite.tsx`. We need an automated way for MystraGem to generate a 2D asset, save it via `agent-bridge.js`, and have `AvatarScene.tsx` dynamically hot-reload the new NPC into the world.
- **Automated 2D Game Asset Pipeline (Forge 2D Assets):** Create an autonomous Antigravity Skill (`forge_2d_assets`) to generate 2D game assets, tilesets, and environments from text prompts.

## Domain 7: Special Effects & Parallaxatron Engine Roadmap
- **Parallaxatron Preset Catalog:** Expand `PARALLAXATRON_PRESETS` in `ParallaxatronEngine.tsx` to include environment presets for `yawning_portal`, `waterdeep_city_streets`, `undermountain_cavern`, `icewind_blizzard`, and `candlekeep_library`.
- **Sphere-Sliding Spell FX (Fireballs & Arcane Orbs):** Implement localized concentric sphere meshes that slide UV-animated procedural noise & flame textures across 3D space.
