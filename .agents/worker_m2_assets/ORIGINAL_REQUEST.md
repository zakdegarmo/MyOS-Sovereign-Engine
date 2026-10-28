## 2026-07-28T01:45:27Z

You are worker_m2_assets, assigned to Milestone 2: Asset Generation Tool (`pixel_forge.py`) and 1996 Retro Pixel Asset Generation for B-Movie Beatdown.

Working directory: `c:\Users\zakde\Desktop\AntiGravity projects\MyOS\.agents\worker_m2_assets`
Project package directory: `c:\Users\zakde\Desktop\AntiGravity projects\MyOS\packages\b-movie-beatdown`

## Tasks:
1. Create directory `c:\Users\zakde\Desktop\AntiGravity projects\MyOS\.agents\worker_m2_assets` if it doesn't exist.
2. Read the `/forgeTool` skill at `C:\Users\zakde\.gemini\config\skills\forge_tool\SKILL.md`. Use `python C:\Users\zakde\.gemini\config\skills\forge_tool\scripts\local_forge.py "Write pixel_forge.py asset generation script for 1996 pixel art"` or directly write `packages/b-movie-beatdown/tools/pixel_forge.py`.
3. Ensure `packages/b-movie-beatdown/tools/pixel_forge.py` supports CLI flags:
   `python packages/b-movie-beatdown/tools/pixel_forge.py --prompt "<description>" --type <character|prop|background|powerup> --output <path>`
   The script should generate 1996 retro pixel art PNG images (using Python Pillow/PIL or local Ollama/gemma4 integration). Make sure it handles image creation reliably and generates clean transparent background PNGs for characters/enemies/props/powerups and solid PNGs for background layers.
4. Execute `pixel_forge.py` to generate the full retro pixel art asset suite in `packages/b-movie-beatdown/assets/` and `packages/b-movie-beatdown/public/`:
   - Hero Sprite Sheet (`assets/hero_sprites.png`): clean transparency, 32x32 or 64x64 grid with idle, walk, attack, hurt, jump animations.
   - 5 Enemy Sprite Sheets:
     1. Zombie (`assets/zombie_sprites.png`)
     2. Werewolf (`assets/werewolf_sprites.png`)
     3. Mutant (`assets/mutant_sprites.png`)
     4. Vampire (`assets/vampire_sprites.png`)
     5. Killer Doll (`assets/doll_sprites.png`)
   - 4 Destructible Props: Crate (`assets/prop_crate.png`), Barrel (`assets/prop_barrel.png`), Tombstone (`assets/prop_grave.png`), Plasma Canister (`assets/prop_canister.png`).
   - 4 Power-ups: First Aid Kit (`assets/powerup_health.png`), Shotgun (`assets/powerup_shotgun.png`), Holy Water (`assets/powerup_holywater.png`), Speed Boots (`assets/powerup_boots.png`).
   - 3 Parallax Background Layers: Far Sky/Moon (`assets/bg_far.png`), Mid City/Graveyard skyline (`assets/bg_mid.png`), Near Fences/Foreground (`assets/bg_near.png`).
5. Create or update `packages/b-movie-beatdown/assets/AssetManifest.ts` to export TypeScript constants and image loaders pointing to all newly generated assets.
6. Verify build (`npx vite build` or `npm run build` in `packages/b-movie-beatdown`) and verify that E2E test runner (`node tests/e2e-runner.mjs`) executes cleanly.

MANDATORY INTEGRITY WARNING: DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work.

Write your handoff report to `c:\Users\zakde\Desktop\AntiGravity projects\MyOS\.agents\worker_m2_assets\handoff.md` and update `progress.md`.
