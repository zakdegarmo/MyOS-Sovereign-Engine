# Milestone 1: Systems & Architecture Analysis Report
**Package Target**: `packages/neon-nightmare` (renamed to `packages/b-movie-beatdown` in M1 refactor)
**Agent**: Explorer Systems (`explorer_m1_systems`)
**Date**: 2026-07-26

---

## 1. Executive Summary

This report presents a thorough, read-only architectural investigation of `packages/neon-nightmare` for Milestone 1 of the **B-Movie Beatdown** overhaul. The objective is to identify root causes of enemy clustering and repetition, analyze player sprite sheet rendering and animation state handling, design a multi-layer parallax scrolling background system, and evaluate asset integration pipelines (`/cartoonify` workflow and `/forgeTool` skill).

---

## 2. Codebase Structure & Component Map

| Component / Module | Path | Primary Responsibilities |
|-------------------|------|--------------------------|
| `App.tsx` | `packages/neon-nightmare/App.tsx` | Root React container mounting `Game.tsx`. |
| `Game.tsx` | `packages/neon-nightmare/components/Game.tsx` | Core game loop, entity update logic, physics, collision detection, level generation (`generateLevel`), input processing. |
| `drawService.ts` | `packages/neon-nightmare/services/drawService.ts` | Rendering engine (`drawGame`, `drawEntity`, `drawBackground`), `SpriteSheet` class with chroma keying & frame trimming, perspective scaling, CRT filter. |
| `films.ts` | `packages/neon-nightmare/films.ts` | B-movie definitions (`NEON_NIGHTMARE`, `GALACTIC_GLITCH`, `CRYPT_OF_THE_DAMNED`, `ALL_FILMS`) and 10-level pillar structures. |
| `AssetManifest.ts` | `packages/neon-nightmare/assets/AssetManifest.ts` | `ASSET_MANIFEST` defining enemy assets, frame dimensions, scale, offset, and theme filtering (`getEnemiesByTheme`). |
| `types.ts` | `packages/neon-nightmare/types.ts` | Type definitions for `Entity`, `EntityType`, `VisualTraits`, `GameState`, `PlayerStats`, `LevelDef`, `FilmDef`. |
| `constants.ts` | `packages/neon-nightmare/constants.ts` | World dimensions (`CANVAS_WIDTH = 960`, `CANVAS_HEIGHT = 540`, `WORLD_WIDTH = 3200`), physics constants (`GRAVITY`, `FRICTION`). |
| `ZombiesEngine.ts` | `packages/neon-nightmare/components/ZombiesRemake/ZombiesEngine.ts` | Top-down Zombies Ate My Neighbors remake sub-engine. |

---

## 3. Enemy Spawner Logic Analysis & Wave-Based Redesign

### 3.1 Why Enemies Currently Cluster and Repeat

1. **Static Upfront Batch Spawning** (`Game.tsx`, lines 1167–1286):
   - In `generateLevel(filmId, levelIdx)`, all level entities are instantiated in a single bulk loop at level load time:
     ```typescript
     // Game.tsx lines 1177-1209
     const enemyCount = 8 + intensity * 4;
     for (let i = 0; i < enemyCount; i++) {
         entities.push({
             id: `enemy-${i}`,
             x: 500 + Math.random() * (WORLD_WIDTH - 600),
             y: 350 + Math.random() * 200,
             ...
         });
     }
     ```
   - Positions are chosen purely at random over the 3200px world width without min-distance constraints between entities, leading to high probability of spawn overlaps.

2. **Monolithic Enemy Type Forcing** (`Game.tsx`, lines 1181–1183):
   - For `neon-nightmare`, line 1182 explicitly overrides enemy types:
     ```typescript
     if (filmId === 'neon-nightmare') {
         type = 'ZOMBIE'; // Standardize on 16-bit Zombies for now
     }
     ```
   - This prevents diverse enemy encounters and makes every single enemy behave identically (`hp: 12 + intensity`, `speed: 1.2`).

3. **Simultaneous Camera-Triggered Agro** (`Game.tsx`, lines 373–415):
   - As the player scrolls right, any entity inside camera bounds (`cameraX - 100 < ent.x < cameraX + CANVAS_WIDTH + 100`) with `minDist < 600` activates simultaneously.
   - All activated enemies move straight toward the player at identical speeds (`(dx / minDist) * speed * tScale`), causing them to converge into a single dense clump.

4. **Absence of Runtime Wave Control**:
   - There is no dynamic spawner running during `update()`. No new enemies appear after the initial pool is killed, leading to empty stretches interspersed with dense mob clusters.

### 3.2 Designed Wave-Based, Paced Spawning Algorithm

To align with `films.ts` (10 levels per film, varying themes, background styles, and perspectives), we design a **Dynamic Paced Wave Controller** (`WaveSpawnerService`):

```typescript
export interface WaveDef {
    waveNumber: number;
    triggerX: number; // Camera progress trigger (e.g. 600, 1400, 2200)
    maxOnScreen: number; // Cap active enemies (e.g. 5-8)
    spawnIntervalMs: number; // Stagger delay (e.g. 1500ms)
    composition: {
        type: EntityType;
        weight: number;
        variantId?: string;
    }[];
    lockCamera: boolean; // Stop camera scroll until wave is cleared ("GO ->" prompt)
}
```

#### Key Mechanics:
1. **Camera-Lock Milestone Zones ("Go / Stop" Gates)**:
   - Level length (`WORLD_WIDTH = 3200px`) is partitioned into 3-4 wave sectors (e.g., Sector 1 at X=800, Sector 2 at X=1600, Sector 3 at X=2400).
   - Upon reaching a wave sector, the camera locks in place (`cameraX` upper bound frozen). The wave manager spawns enemies in staggered bursts.
2. **Offscreen Staggered Ingress & Slot Allocation**:
   - Enemies spawn 60px outside left/right viewport boundaries (`cameraX - 60` or `cameraX + CANVAS_WIDTH + 60`).
   - A slot manager assigns distinct Y-offsets (`y: 350 + slot * 40`) and attack angles to prevent overlapping.
3. **Film-Thematic Composition Array**:
   - *Neon Nightmare* (80s Slasher): Mix of slow Zombies (tanks), fast Werewolves (leap lunges), and Killer Dolls (flankers).
   - *Galactic Glitch* (Sci-Fi): Mechs (ranged cannons) and Xenomorphs (speed sprinters).
   - *Crypt of the Damned* (Gothic): Poltergeists (teleporting ghosts) and Vampire Lords (mid-bosses).

---

## 4. Player Character Sprite Sheets & Animation State Handling

### 4.1 Current Implementation in `drawService.ts`

- **Sprite Loading & Cache**:
  - Batting Girl assets loaded via `SpriteSheet` instances: `BG_IDLE`, `BG_WALK`, `BG_JUMP`, `BG_HURT`, `BG_ATT1` (Punch), `BG_ATT2` (Kick), `BG_ATT3` (Special Spin).
- **State Selection** (`drawEntity`, lines 489–506):
  ```typescript
  if (ent.type === 'PLAYER') {
      const animSpeed = 100;
      sheet = BG_IDLE;
      if (ent.vy !== 0 && BG_JUMP.ready) { sheet = BG_JUMP; col = Math.floor(Date.now() / animSpeed) % 8; }
      else if (ent.state === 'WALK' && BG_WALK.ready) { sheet = BG_WALK; col = Math.floor(Date.now() / animSpeed) % 6; }
      else if (ent.state === 'ATTACK') { sheet = BG_ATT1; col = Math.floor(Date.now() / 80) % 11; }
      else if (ent.state === 'KICK') { sheet = BG_ATT2; col = Math.floor(Date.now() / 80) % 8; }
      else if (ent.state === 'SPECIAL') { sheet = BG_ATT3; col = Math.floor(Date.now() / 80) % 11; }
      else if (ent.flash && ent.flash > 0 && BG_HURT.ready) { sheet = BG_HURT; col = Math.floor(Date.now() / animSpeed) % 8; }
      else { col = Math.floor(Date.now() / 150) % 15; }
  }
  ```

### 4.2 Deficiencies & Frame Slicing Issues

1. **Time-Based Frame Calculation (`Date.now()`)**:
   - Animations use system time `Date.now() / animSpeed` instead of entity frame accumulators (`frameTimer`). During frame drops or time scale debug adjustments (`gameState.debugSettings.timeScale`), animation speed desynchronizes from gameplay speed.
2. **CPU Canvas Chroma Keying Halos**:
   - `SpriteSheet` constructor (lines 44–58) performs hard color distance sampling (`d < 85`). It lacks soft similarity thresholding and green spill suppression, leaving bright green/white halo fringes around sprite silhouettes.
   - Reserializes canvas data using `c.toDataURL()`, causing memory spikes during initial asset loading.
3. **Missing Death State**:
   - When player HP reaches 0, `Game.tsx` instantly transitions to `screen: 'GAMEOVER'` without rendering a collapse/death sprite animation.

### 4.3 Smooth Rendering & Chroma Key Purging Specification

- **Chroma Key Shader / Alpha Purge Formula**:
  To achieve clean transparency without halos, replace CPU sampling with a 2-pass offscreen canvas / WebGL shader algorithm:
  $$\text{distance} = \sqrt{(R - R_{key})^2 + (G - G_{key})^2 + (B - B_{key})^2}$$
  $$\alpha = \text{clamp}\left(\frac{\text{distance} - \text{similarity}}{\text{smoothness}}, 0.0, 1.0\right)$$
  - Green Spill Suppression: $G_{clean} = \min(G, \max(R, B))$.
- **Tick-Synchronized Animation State Machine**:
  - Replace `Date.now()` indexing with frame counters incremented inside `update()`: `ent.frameTimer += 1 * tScale`.
  - Frame index: `col = Math.floor(ent.frameTimer / ticksPerFrame) % totalFrames`.

---

## 5. Multi-Layer Parallax Scrolling Background Architecture

### 5.1 Current Background Implementation

In `drawService.ts` (lines 350–398):
- `drawBackground` renders 3 pseudo-layers:
  1. Sky Gradient + Fixed Moon at `(700, 60)` (Parallax = 0.0).
  2. City Buildings at `farX = -(camX * 0.2) % 400` (Parallax = 0.2).
  3. Neon Sign at `signX = (1200 - (camX * 0.4)) % WORLD_WIDTH` (Parallax = 0.4).
  4. Floor/Road at Y=400 with perspective grid lines (Parallax = 1.0).

### 5.2 4-Layer Parallax Architecture Specification

To create high-fidelity retro environments across all film background styles (`NEON_VEGAS`, `STUDIO_LOT`, `CINEMA`), we specify a 4-layer parallax engine:

| Layer ID | Layer Name | Content Assets | Parallax Ratio ($k_i$) | Render Position Formula | Depth / Z-Index |
|----------|------------|----------------|------------------------|-------------------------|-----------------|
| **L0** | Sky & Moon | Night sky gradient, moon, starfield | $0.00$ | $X_0 = 0$ | $-400$ |
| **L1** | Far Skyline | Mountain silhouettes, far city towers | $0.20$ | $X_1 = -(C_x \times 0.20) \pmod{W_1}$ | $-300$ |
| **L2** | Mid Structures | Billboards, neon signs, streetlights | $0.50$ | $X_2 = -(C_x \times 0.50) \pmod{W_2}$ | $-150$ |
| **L3** | Playfield | Road, sidewalk, prop placement surface | $1.00$ | $X_3 = -C_x$ | $0$ |
| **L4** | Foreground | Overhanging pipes, foreground railings | $1.30$ | $X_4 = -(C_x \times 1.30) \pmod{W_4}$ | $+100$ |

#### Parallax Offset Math:
For a layer $i$ with texture width $W_i$ and camera horizontal offset $C_x$:
$$X_{render, i} = -(C_x \cdot k_i) \pmod{W_i}$$
Draw dual tiles at $X_{render, i}$ and $X_{render, i} + W_i$ to ensure seamless infinite horizontal scrolling.

---

## 6. Asset Pipeline & Integration Review

### 6.1 `/cartoonify` Workflow Analysis (`.agents/workflows/cartoonify.md`)
- **3-Phase Pipeline**:
  1. **Nigredo (Extraction)**: Decodes GIFs/sheets via `omggif.js` or image buffers.
  2. **Albedo (Refinement)**: Applies `Pro-Grade Chroma-Key Shader` (`uSimilarity: 0.7`, `uSmoothness: 0.05`) to purge backgrounds and calibrates vertical pivot ($0.5$ Y-translation).
  3. **Rubedo (Integration)**: Wraps entity with movement engine and autonomous behavior.
- **Application to B-Movie Beatdown**:
  - The chroma-key shader parameters and edge-smoothing math from `/cartoonify` provide the direct specification for upgrading `SpriteSheet` rendering in `drawService.ts`.

### 6.2 `/forgeTool` Skill Analysis (`.gemini/config/skills/forge_tool/SKILL.md`)
- **Workflow**:
  - Calls `python C:\Users\zakde\.gemini\config\skills\forge_tool\scripts\local_forge.py "<description>"` targeting local Ollama instance `localhost:11434` (gemma4) to generate Python tools and `SKILL.md` entries.
- **Application to Milestone 2 (`pixel_forge.py`)**:
  - In Milestone 2, `/forgeTool` will be invoked to craft `tools/pixel_forge.py`.
  - `pixel_forge.py` will handle local generation of retro 1996 pixel art assets for player animations, enemy types, destructible props, power-ups, and multi-layer parallax backgrounds.

---

## 7. Recommendations for Implementation (Milestones 2–4)

1. **M1 (Refactor & Bugfix)**:
   - Complete package rename (`packages/neon-nightmare` -> `packages/b-movie-beatdown`).
   - Fix rewards generation logic.
   - Implement responsive WASD + Mouse controls.
2. **M2 (`pixel_forge.py` Asset Generator)**:
   - Forge `pixel_forge.py` via `/forgeTool` skill.
   - Generate pixel assets for player states, enemy types (Zombie, Werewolf, Alien, Mech, Vampire), props (Trash, Crate, Barrel, Hydrant, Food Table), and parallax background layers.
3. **M3 (Enemy & Character Overhaul)**:
   - Replace static `generateLevel` upfront spawning with the `WaveSpawnerService`.
   - Update player sprite sheet state machine with tick-based timers and soft chroma-key background purging.
4. **M4 (Parallax & Presentation)**:
   - Implement the 4-layer parallax background engine in `drawService.ts`.
   - Integrate Cinema Marquee splash screens and level demo cutscenes.
