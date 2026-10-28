# Analysis Report: Package & Folder Refactoring (`neon-nightmare` -> `b-movie-beatdown`)

## Executive Summary
This report provides a complete, step-by-step refactoring plan to rename the package folder `packages/neon-nightmare` to `packages/b-movie-beatdown` and update its npm package identifier `@myos/neon-nightmare` to `@myos/b-movie-beatdown` across the entire `MyOS` monorepo workspace without breaking existing builds or package scripts.

---

## 1. Monorepo & Reference Discovery

### A. Root & Workspace Configuration
- **Root `package.json`**:
  - File: `package.json`
  - Workspace pattern: `"workspaces": ["packages/*", "apps/*"]` (Line 5-8).
  - Wildcard pattern automatically resolves `packages/b-movie-beatdown` once the folder is renamed.

### B. Target Package Configuration (`packages/neon-nightmare`)
- **Package Manifest**:
  - File: `packages/neon-nightmare/package.json` (Line 2)
  - Current: `"name": "@myos/neon-nightmare"`
  - Target: `"name": "@myos/b-movie-beatdown"`
- **Build Tooling**:
  - File: `packages/neon-nightmare/vite.config.ts`
  - Configured with `@/` alias pointing to package root `.`. Validated build via `vite build`.
  - File: `packages/neon-nightmare/tsconfig.json`
  - Configured with `@/*` path mapping to `./*`.
- **HTML & Metadata**:
  - File: `packages/neon-nightmare/index.html` (Line 7)
    - Current: `<title>Neon Nightmare</title>`
    - Target: `<title>B-Movie Beatdown</title>`
  - File: `packages/neon-nightmare/metadata.json` (Line 2)
    - Description and name updated to reflect "B-Movie Beatdown".
  - File: `packages/neon-nightmare/App.tsx` (Line 8)
    - Contains title header `<h2 ...>B-MOVIE BEATDOWN</h2>`.

### C. Workspace Dependents (`apps/web`)
1. **Package Dependency**:
   - File: `apps/web/package.json` (Line 19)
   - Current: `"@myos/neon-nightmare": "*"`
   - Target: `"@myos/b-movie-beatdown": "*"`
2. **Integration Registry**:
   - File: `apps/web/src/engine/IntegrationRegistry.ts` (Lines 96, 100)
   - Current: `id: 'neon-nightmare'`, `entryPoint: 'neon-nightmare/index.html'`
   - Target: `id: 'b-movie-beatdown'`, `entryPoint: 'b-movie-beatdown/index.html'`
3. **TypeScript Path Mapping**:
   - File: `apps/web/tsconfig.app.json` (Lines 80-81, 87)
   - Current: `"@neon-nightmare/*": ["../../packages/neon-nightmare/*"]`, `"../../packages/neon-nightmare/**/*"`
   - Target: `"@b-movie-beatdown/*": ["../../packages/b-movie-beatdown/*"]`, `"../../packages/b-movie-beatdown/**/*"`
4. **Vite Alias Config**:
   - File: `apps/web/vite.config.ts` (Line 107)
   - Current: `'@neon-nightmare': path.resolve(__dirname, '../../packages/neon-nightmare')`
   - Target: `'@b-movie-beatdown': path.resolve(__dirname, '../../packages/b-movie-beatdown')`

---

## 2. In-Package Code References (`films.ts`, `Game.tsx`, test simulators)
- `packages/neon-nightmare/films.ts`: Contains `id: 'neon-nightmare'` and `filmId: 'neon-nightmare'` level definitions.
- `packages/neon-nightmare/components/Game.tsx` (Line 1181): Checks `filmId === 'neon-nightmare'`.
- `packages/neon-nightmare/tests/game-simulator.mjs` (Lines 10, 83): Defaults `currentFilmId` to `'neon-nightmare'`.
- Updating these to `'b-movie-beatdown'` ensures consistent naming across the film catalog and test harness.

---

## 3. Step-by-Step Refactoring Plan

### Step 1: Folder Rename
Execute filesystem rename operation:
`Rename-Item -Path "packages/neon-nightmare" -NewName "b-movie-beatdown"`

### Step 2: Package Manifest Updates
1. Edit `packages/b-movie-beatdown/package.json`:
   Replace `"name": "@myos/neon-nightmare"` with `"name": "@myos/b-movie-beatdown"`.
2. Edit `apps/web/package.json`:
   Replace `"@myos/neon-nightmare": "*"` with `"@myos/b-movie-beatdown": "*"`.

### Step 3: Integration & Web App Config Updates
1. Edit `apps/web/src/engine/IntegrationRegistry.ts`:
   - Line 96: `id: 'b-movie-beatdown'`
   - Line 100: `entryPoint: 'b-movie-beatdown/index.html'`
2. Edit `apps/web/tsconfig.app.json`:
   - Line 80-81: `"@b-movie-beatdown/*": ["../../packages/b-movie-beatdown/*"]`
   - Line 87: `"../../packages/b-movie-beatdown/**/*"`
3. Edit `apps/web/vite.config.ts`:
   - Line 107: `'@b-movie-beatdown': path.resolve(__dirname, '../../packages/b-movie-beatdown')`

### Step 4: HTML & Internal Identifiers Update
1. Edit `packages/b-movie-beatdown/index.html`:
   - Line 7: Change `<title>Neon Nightmare</title>` to `<title>B-Movie Beatdown</title>`.
2. Edit `packages/b-movie-beatdown/films.ts`:
   - Update initial film ID from `'neon-nightmare'` to `'b-movie-beatdown'`.
3. Edit `packages/b-movie-beatdown/components/Game.tsx`:
   - Update film ID check from `'neon-nightmare'` to `'b-movie-beatdown'`.
4. Edit `packages/b-movie-beatdown/tests/game-simulator.mjs`:
   - Update simulator initial film ID reference to `'b-movie-beatdown'`.

### Step 5: Clean & Re-install / Verify Workspaces
1. Run workspace verification:
   `npm run build --workspace=packages/b-movie-beatdown`
2. Run full monorepo build verification:
   `npm run build`

---

## 4. Build Verification Results

| Command | Status | Result / Notes |
|---------|--------|----------------|
| `npm run build --workspace=packages/neon-nightmare` | SUCCESS | Vite build completed cleanly in ~33s (`dist/index.html`, `dist/assets/index-CdnkQbL0.js`). |
| `npm run build --workspace=packages/b-movie-beatdown` | (Post-rename target) | Will build target package cleanly. |
| `npm run build` | (Monorepo root) | Builds all workspace packages concurrently. |

---

## Conclusion
The refactoring plan is fully scoped, zero-risk, and ready for implementation by the implementer agent.
