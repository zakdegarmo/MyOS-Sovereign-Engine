## 2026-07-26T23:59:27Z
You are Worker 1 for Milestone 1 of the B-Movie Beatdown overhaul.
Your working directory is `c:\Users\zakde\Desktop\AntiGravity projects\MyOS\.agents\worker_m1_1`.
Your parent conversation ID is `ad3ceac7-c468-4407-9a25-e56d4e458853`.

TASK:
Implement Milestone 1: Package Refactor, Controls Overhaul, and Rewards Generation Bugfix.

1. Read the Explorer investigation reports:
   - `c:\Users\zakde\Desktop\AntiGravity projects\MyOS\.agents\explorer_m1_1\analysis.md`
   - `c:\Users\zakde\Desktop\AntiGravity projects\MyOS\.agents\explorer_m1_controls\analysis.md`
   - `c:\Users\zakde\Desktop\AntiGravity projects\MyOS\.agents\explorer_m1_systems\analysis.md`

2. Implement Package Rename:
   - Rename directory `packages/neon-nightmare` to `packages/b-movie-beatdown`.
   - In `packages/b-movie-beatdown/package.json`: update `"name"` to `"@myos/b-movie-beatdown"`, add test script `"test": "echo \"No tests specified for b-movie-beatdown\" && exit 0"`.
   - Update `packages/b-movie-beatdown/index.html`: `<title>B-Movie Beatdown</title>`.
   - Update `packages/b-movie-beatdown/films.ts`: update `NEON_NIGHTMARE` constant, `id`, `title`, level `filmId` values to `b-movie-beatdown`.
   - Update `packages/b-movie-beatdown/components/Game.tsx`: display header title & `filmId` checks.
   - Update `packages/b-movie-beatdown/metadata.json`: `"name": "B-Movie Beatdown"`.
   - Update `packages/b-movie-beatdown/services/ParadoxGenetics.ts`: docstring header.
   - Update `apps/web/package.json`: `"@myos/b-movie-beatdown": "*"`.
   - Update `apps/web/tsconfig.app.json`: path aliases & include paths.
   - Update `apps/web/vite.config.ts`: `@b-movie-beatdown` alias.
   - Update `apps/web/src/engine/IntegrationRegistry.ts`: `id`, `name`, `entryPoint`.

3. Implement WASD + Mouse Controls Scheme:
   - Update `packages/b-movie-beatdown/types.ts`: add `groundY?: number` to `Entity` interface.
   - Update `packages/b-movie-beatdown/components/InputManager.tsx`: Implement zero-lag mouse + WASD input hook (`useInput(canvasRef)`). Track WASD keys (`KeyW`, `KeyA`, `KeyS`, `KeyD`), Space, Left Mouse Click (`button 0` -> `attackPressed`), Right Mouse Click (`button 2` -> `specialPressed`), `mousemove` (canvas-relative coordinates), `contextmenu` (`preventDefault()`).
   - Update `packages/b-movie-beatdown/components/Game.tsx`: Pass `canvasRef` to `useInput(canvasRef)`. Support WASD + Arrow keys movement, Space for jump, Left Mouse / KeyX for Attacks, Right Mouse / KeyZ for Special Action. Reset edge-trigger flags at end of tick.

4. Implement Rewards Generation Bugfixes:
   - Fix Bug 3.1: Set `groundY` on dropped coins/items (`groundY = Math.min(y + 30, 540)`), test `if (ent.y > ent.groundY)` in `update()` so rewards drop to ground floor instead of freezing mid-air.
   - Fix Bug 3.2: Fix direct state mutation in `Game.tsx` coin collection: use functional state setter `setStats(prev => ({ ...prev, money: Number((prev.money + rewardVal).toFixed(2)) }))`.
   - Fix Bug 3.3: Use `statsRef` in `Game.tsx` to read `stats.luck` dynamically without stale closure issues.
   - Fix Bug 3.4: In `services/drawService.ts`, add `return;` immediately after rendering `COIN` or `ITEM` to prevent fall-through that draws floating HP bars over coins/items.
   - Fix Bug 3.5: Add explicit `COIN` and `ITEM` cases in `createVisuals()`.
   - Fix Bug 3.6: Factor `stats.luck` into drop probabilities and item quality.

5. Verify Build & Tests:
   - Run `npm install` to update workspace symlinks.
   - Run `npm run build` or `npm run build --workspace=packages/b-movie-beatdown`.
   - Run `npm run test` or workspace tests.
   - Document commands and exact test/build results in your handoff report.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Deliver your implementation summary in `c:\Users\zakde\Desktop\AntiGravity projects\MyOS\.agents\worker_m1_1\changes.md` and write a handoff report at `c:\Users\zakde\Desktop\AntiGravity projects\MyOS\.agents\worker_m1_1\handoff.md`. Notify parent conversation ID `ad3ceac7-c468-4407-9a25-e56d4e458853` when finished.
