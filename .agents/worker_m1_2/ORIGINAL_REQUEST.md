## 2026-07-27T00:36:05Z

You are Worker 1 Replacement for Milestone 1 of the B-Movie Beatdown overhaul.
Your working directory is `c:\Users\zakde\Desktop\AntiGravity projects\MyOS\.agents\worker_m1_2`.
Your parent conversation ID is `ad3ceac7-c468-4407-9a25-e56d4e458853`.

TASK:
Finalize and verify Milestone 1: Package Refactor (`packages/b-movie-beatdown`), WASD+Mouse Controls Overhaul, and 6 Rewards Generation Bugfixes.

1. Inspect the codebase in `packages/b-movie-beatdown`:
   - Verify `packages/b-movie-beatdown/package.json` (`name: "@myos/b-movie-beatdown"`, test script `"test": "echo \"No tests specified for b-movie-beatdown\" && exit 0"`).
   - Verify `packages/b-movie-beatdown/index.html` title: `B-Movie Beatdown`.
   - Verify `packages/b-movie-beatdown/films.ts` (`id: "b-movie-beatdown"`, `title: "B-Movie Beatdown"`, level `filmId` fields).
   - Verify downstream links in `apps/web/package.json` (`"@myos/b-movie-beatdown": "*"`), `apps/web/tsconfig.app.json`, `apps/web/vite.config.ts`, `apps/web/src/engine/IntegrationRegistry.ts`.
   - Safely clean up / remove legacy `packages/neon-nightmare` directory once verified.

2. Verify and finalize WASD + Mouse Controls in `packages/b-movie-beatdown`:
   - `types.ts`: `groundY?: number` on `Entity`.
   - `components/InputManager.tsx`: `useInput(canvasRef)` with WASD keys (`KeyW`, `KeyA`, `KeyS`, `KeyD`), Space jump, Mouse button 0 (Attack) with `attackPressed` edge-trigger, Mouse button 2 (Special) with `specialPressed` edge-trigger, `mousemove` coordinates, and `contextmenu` `preventDefault()`.
   - `components/Game.tsx`: Pass `canvasRef` to `useInput(canvasRef)`, process WASD + Arrow keys movement, Space jump, Left Mouse / X Attack, Right Mouse / Z Special Action, and reset edge-trigger flags at end of tick.

3. Verify and finalize all 6 Rewards Generation Bugfixes:
   - Bug 3.1: Set `groundY` on dropped coins/items (`groundY = Math.min(y + 30, 540)`), test `if (ent.y > ent.groundY)` in `update()` so rewards drop to ground floor instead of freezing mid-air.
   - Bug 3.2: Use functional state setter for cash: `setStats(prev => ({ ...prev, money: Number((prev.money + rewardVal).toFixed(2)) }))`.
   - Bug 3.3: Use `statsRef` in `Game.tsx` to read `stats.luck` dynamically without stale closure issues.
   - Bug 3.4: In `services/drawService.ts`, add `return;` immediately after rendering `COIN` or `ITEM` to prevent fall-through that draws floating HP bars over coins/items.
   - Bug 3.5: Add explicit `COIN` and `ITEM` cases in `createVisuals()`.
   - Bug 3.6: Factor `stats.luck` into drop probabilities, double-coin drops, and item quality.

4. Build and Test Verification:
   - Run `npm install` at root to regenerate workspace symlinks.
   - Run `npm run build` or `npm run build --workspace=packages/b-movie-beatdown`.
   - Run E2E tests: `node packages/b-movie-beatdown/tests/e2e-runner.mjs` or `npm run test:e2e`.
   - Record exact build and test command outputs in your handoff report.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Deliver your summary in `c:\Users\zakde\Desktop\AntiGravity projects\MyOS\.agents\worker_m1_2\changes.md` and write a handoff report at `c:\Users\zakde\Desktop\AntiGravity projects\MyOS\.agents\worker_m1_2\handoff.md`. Send a message to parent conversation ID `ad3ceac7-c468-4407-9a25-e56d4e458853` when complete.
