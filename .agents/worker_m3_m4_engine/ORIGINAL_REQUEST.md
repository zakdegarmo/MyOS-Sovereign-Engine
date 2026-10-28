## 2026-07-27T21:46:39Z

You are worker_m3_m4_engine, assigned to Milestone 3 (Enemy & Character Overhaul) and Milestone 4 (Visuals, Parallax, Cinema Marquee Splash & Level Demos) for B-Movie Beatdown.

Working directory: `c:\Users\zakde\Desktop\AntiGravity projects\MyOS\.agents\worker_m3_m4_engine`
Project package directory: `c:\Users\zakde\Desktop\AntiGravity projects\MyOS\packages\b-movie-beatdown`

## Tasks:
1. Create directory `c:\Users\zakde\Desktop\AntiGravity projects\MyOS\.agents\worker_m3_m4_engine` if it doesn't exist.

2. **Milestone 3: Enemy & Character Overhaul**:
   - **Spawner & Pacing Overhaul**: In `services/DirectorAI.ts`, `components/Game.tsx`, and `components/ZombiesRemake/ZombiesEngine.ts`, update enemy spawning logic to enforce spatial anti-clustering (minimum spawn distance between enemies, staggered wave entry, max active screen cap) to prevent overwhelming enemy clusters.
   - **5 Distinct Enemy Types**: Implement/update enemy stats, movement patterns, attack ranges, and sprite rendering for 5 distinct horror types:
     1. Zombie (Medium HP, slow speed, standard melee)
     2. Werewolf (High speed, heavy leap attack)
     3. Mutant (High HP tank, heavy slam attack)
     4. Vampire (Ranged projectile/teleport attack)
     5. Killer Doll (Low HP, small hitbox, fast swarm movement)
     Update `films.ts` and `types.ts` to support all 5 enemy types and their configurations across all level definitions.
   - **Player Sprite Rendering**: In `services/drawService.ts` / `ZombiesRenderer.ts`, ensure player character rendering uses clean transparent sprite sheets with correct frame slicing (idle, walk, attack, hurt, jump) without black background artifacts or misalignment.

3. **Milestone 4: Visuals, Multi-Layer Parallax, Marquee Splash & Level Demos**:
   - **Multi-Layer Parallax Backgrounds**: In `services/drawService.ts` / `ZombiesRenderer.ts` / `Game.tsx`, implement multi-layer scrolling parallax backgrounds with at least 2 distinct layers (e.g. Far Sky/Moon layer moving at 0.2x camera speed, Mid City/Graveyard layer moving at 0.5x, Near Ground layer moving at 1.0x).
   - **Sprite Props & Power-Ups**: Replace primitive shape draw calls in `drawService.ts` / `ZombiesRenderer.ts` with custom pixel art sprite drawings for destructible props (crates, barrels, tombstones, canisters) and power-ups (first aid, shotgun, holy water, speed boots).
   - **Cinema Marquee Splash Screen (`CinemaMarquee.tsx`)**: Create `components/CinemaMarquee.tsx` — a 1996 retro glowing cinema theater marquee splash overlay featuring glowing neon lights, film title, level name, "NOW SHOWING", and transition animations.
   - **Attract Mode & Animated Level Demos**: Update `components/Game.tsx` and `App.tsx` so that before starting a level or entering attract demo mode, the Cinema Marquee splash screen plays, followed by an automated AI-driven level demo cutscene showcasing gameplay.

4. **Verification**:
   - Run `node tests/e2e-runner.mjs` in `packages/b-movie-beatdown` to verify all 93 E2E test cases pass.
   - Run build check `npx vite build` in `packages/b-movie-beatdown` to ensure zero TypeScript compilation errors or build failures.
