# Context Memory — B-Movie Beatdown Overhaul

## Key Paths & Requirements
- **Original User Request**: `.agents/ORIGINAL_REQUEST.md`
- **Global Project Plan**: `PROJECT.md`
- **Source Package**: `packages/neon-nightmare` (to be renamed `packages/b-movie-beatdown`)
- **Forge Tool Skill**: `C:\Users\zakde\.gemini\config\skills\forge_tool\SKILL.md`
- **Cartoonify Workflow**: `C:\Users\zakde\Desktop\AntiGravity projects\MyOS\.agents\workflows\cartoonify.md`

## Subagent Working Directories Layout
All subagent working directories live under `.agents/`:
- `.agents/explorer_m1_1`
- `.agents/explorer_m1_2`
- `.agents/explorer_m1_3`
- `.agents/worker_m1_1`
- `.agents/reviewer_m1_1`
- `.agents/reviewer_m1_2`
- `.agents/challenger_m1_1`
- `.agents/auditor_m1_1`
- `.agents/sub_orch_e2e`

## High-Level Target State
- Working 2.5D retro beat-'em-up under `packages/b-movie-beatdown`.
- Fluid WASD + Mouse controls without input lag.
- Fixed rewards generation bug.
- Working Python script `pixel_forge.py` for generating 1996 retro pixel art assets locally.
- Original high-quality pixel assets for player, enemies, destructible props, power-ups, parallax backgrounds.
- Multi-layer parallax background scrolling (>=2 layers).
- Paced enemy spawning logic without clustering, with diverse B-movie horror enemy types.
- Clean player animations and background transparency.
- Cinema marquee splash screens, level demo cutscenes.
- Pass 100% E2E test suite and clean Forensic Audit.
