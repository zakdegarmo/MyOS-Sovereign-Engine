# Comprehensive Codebase Analysis, Control Scheme Design & Rewards System Audit

**Target Package**: `packages/neon-nightmare` (to be renamed `packages/b-movie-beatdown`)  
**Investigator**: Explorer Controls  
**Milestone**: Milestone 1 - Controls Overhaul & Rewards Generation Audit  
**Date**: 2026-07-26  

---

## Executive Summary

This report provides a full read-only architectural analysis of the gameplay system in `packages/neon-nightmare`, a zero-lag input engine specification transitioning from arrow keys to **WASD + Mouse Button attack controls**, and a forensic audit of the **Rewards Generation system** identifying 6 distinct root-cause bugs with exact step-by-step resolution plans.

---

## Section 1: Gameplay Code & System Architecture Analysis

### 1. Architectural Layout & Modules
- **`App.tsx`**: Top-level container component rendering game canvas overlay, retro title headers, and footer instructions.
- **`components/Game.tsx`**: Primary game loop driver (`requestAnimationFrame`), entity state manager (`player`, `enemies`, `particles`, `debris`, `cinematicParticles`), 2.5D physics engine (gravity, ground floor bounds, top-down vs side-scroll mode), combat resolution, and state dispatcher.
- **`components/InputManager.tsx`**: React custom hook (`useInput`) returning a `useRef` tracking keyboard code flags on `window`.
- **`components/HUD.tsx`**: Heads-up display rendering HP gauge, Budget (Hype) meter, accumulated cash, rescued/captured victim stats, and keybinding legend.
- **`components/Shop.tsx`**: Inter-level "Craft Services" upgrade system allowing players to purchase standard stat boosts (HP, Strength, Speed, Luck) and scaling "Fractal Items".
- **`services/drawService.ts`**: 2D HTML5 Canvas rendering engine. Handles sprite sheet trimming, chroma-key background removal, perspective depth scaling (`0.85x` to `1.25x`), background parallax scrolling, CRT scanline overlay, and entity particle effects.
- **`services/DirectorAI.ts`**: Autonomous director critique engine analyzing telemetry (`PlaySessionLogger`) to dynamically suggest stat and difficulty tweaks.
- **`services/audioService.ts`**: Web Audio API sound synthesizer for punches, hits, coins, jumps, smashes, explosions, and Wilhelm screams.
- **`constants.ts`**: Core game configuration (`CANVAS_WIDTH = 1024`, `CANVAS_HEIGHT = 600`, `WORLD_WIDTH = 4000`, `FLOOR_Y = 540`, `GRAVITY = 0.5`, `FRICTION = 0.85`, `INITIAL_STATS`).
- **`types.ts`**: TypeScript definitions for `Entity`, `PlayerStats`, `GameState`, `VisualTraits`, `FilmDef`, `LevelDef`.
- **`films.ts`**: Level definitions and film thematic manifests (`Neon Nightmare`, `Galactic Glitch`, `Crypt of the Damned`).

---

## Section 2: Input Handling Analysis & WASD + Mouse Control Scheme Design

### 1. Flaws in Current Input System
1. **Hardcoded Arrow Keys**: Movement relies on `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight` in `Game.tsx` (lines 81-96). WASD keys (`KeyW`, `KeyA`, `KeyS`, `KeyD`) are not handled.
2. **Missing Mouse Input Processing**: `InputManager.tsx` only registers `keydown` and `keyup` listeners on `window`. Mouse buttons (`mousedown`, `mouseup`, `mousemove`) are completely unhandled.
3. **Browser Context Menu Interruptions**: Right-click triggers default browser context menus on the canvas, breaking gameplay flow.
4. **Key Auto-Repeat Combo Triggering**: In `Game.tsx` (lines 128-189), holding `KeyX` triggers subsequent combo steps immediately upon cooldown expiration because key state remains `true` continuously. Edge-triggered single clicks/presses are missing.
5. **No Mouse Position Tracking**: Neither canvas-relative nor world-relative cursor coordinates are tracked, preventing mouse-aimed attacks or cursor direction targeting.

### 2. Zero-Lag Control Scheme Specification
To ensure 60 FPS zero-lag responsiveness, input state must be maintained in a mutable `useRef<InputState>` object updated by native browser event listeners outside the React re-render cycle.

#### Input Contract Interface:
```typescript
export interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  attack: boolean;         // Hold state (Left Mouse / KeyX)
  special: boolean;        // Hold state (Right Mouse / KeyZ)
  jump: boolean;          // Hold state (Spacebar)
  attackPressed: boolean;  // Single-frame edge trigger for Left Click
  specialPressed: boolean; // Single-frame edge trigger for Right Click
  jumpPressed: boolean;    // Single-frame edge trigger for Spacebar
  mouseX: number;          // Canvas-relative X position
  mouseY: number;          // Canvas-relative Y position
}
```

#### Mapping Matrix:
| Action | Key / Input | Code | Behavior |
|---|---|---|---|
| **Move Up** | W / Up Arrow | `KeyW` / `ArrowUp` | `vy = -moveSpeed` |
| **Move Down** | S / Down Arrow | `KeyS` / `ArrowDown` | `vy = moveSpeed` |
| **Move Left** | A / Left Arrow | `KeyA` / `ArrowLeft` | `vx = -moveSpeed`, `facing = 'LEFT'` |
| **Move Right** | D / Right Arrow | `KeyD` / `Right Arrow` | `vx = moveSpeed`, `facing = 'RIGHT'` |
| **Jump** | Spacebar | `Space` | Jump (Side-scroll Y / Top-down Z) |
| **Primary Attack** | **Left Mouse Click** / X | Mouse Button 0 / `KeyX` | Single-click combo attack (Punch -> Kick -> Finisher) |
| **Special Action** | **Right Mouse Click** / Z | Mouse Button 2 / `KeyZ` | Triggers Budget FX Special Attack when Budget >= 100 |

### 3. Implementation Code for `InputManager.tsx`
```typescript
import { useEffect, useRef } from 'react';

export interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  attack: boolean;
  special: boolean;
  jump: boolean;
  attackPressed: boolean;
  specialPressed: boolean;
  jumpPressed: boolean;
  mouseX: number;
  mouseY: number;
}

export const useInput = (canvasRef: React.RefObject<HTMLCanvasElement | null>) => {
  const inputState = useRef<InputState>({
    up: false,
    down: false,
    left: false,
    right: false,
    attack: false,
    special: false,
    jump: false,
    attackPressed: false,
    specialPressed: false,
    jumpPressed: false,
    mouseX: 0,
    mouseY: 0,
  });

  useEffect(() => {
    const state = inputState.current;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'KeyW'].includes(e.code)) state.up = true;
      if (['ArrowDown', 'KeyS'].includes(e.code)) state.down = true;
      if (['ArrowLeft', 'KeyA'].includes(e.code)) state.left = true;
      if (['ArrowRight', 'KeyD'].includes(e.code)) state.right = true;
      if (['Space'].includes(e.code)) {
        if (!state.jump) state.jumpPressed = true;
        state.jump = true;
      }
      if (['KeyX'].includes(e.code)) {
        if (!state.attack) state.attackPressed = true;
        state.attack = true;
      }
      if (['KeyZ'].includes(e.code)) {
        if (!state.special) state.specialPressed = true;
        state.special = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['ArrowUp', 'KeyW'].includes(e.code)) state.up = false;
      if (['ArrowDown', 'KeyS'].includes(e.code)) state.down = false;
      if (['ArrowLeft', 'KeyA'].includes(e.code)) state.left = false;
      if (['ArrowRight', 'KeyD'].includes(e.code)) state.right = false;
      if (['Space'].includes(e.code)) state.jump = false;
      if (['KeyX'].includes(e.code)) state.attack = false;
      if (['KeyZ'].includes(e.code)) state.special = false;
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) { // Left Click
        if (!state.attack) state.attackPressed = true;
        state.attack = true;
      } else if (e.button === 2) { // Right Click
        if (!state.special) state.specialPressed = true;
        state.special = true;
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) state.attack = false;
      if (e.button === 2) state.special = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        state.mouseX = ((e.clientX - rect.left) / rect.width) * 1024;
        state.mouseY = ((e.clientY - rect.top) / rect.height) * 600;
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleBlur = () => {
      state.up = false; state.down = false; state.left = false; state.right = false;
      state.jump = false; state.attack = false; state.special = false;
      state.attackPressed = false; state.specialPressed = false; state.jumpPressed = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('blur', handleBlur);
    };
  }, [canvasRef]);

  return inputState;
};
```

---

## Section 3: Rewards Generation Forensic Audit & Exact Fixes

### 1. Root Cause Identification

#### Bug 3.1: Mid-Air Drop Bounce Caused by `frameTimer` Overloading (`Game.tsx:317-322`)
- **Location**: `Game.tsx` lines 317-322 and 677.
- **Symptom**: Items and coins dropped from destroyed props or slain enemies bounce in mid-air at arbitrary vertical positions (`y + 20`) rather than landing on the ground floor.
- **Root Cause**: `spawnCoin` sets `frameTimer: y + 20` to track bounce height instead of using a dedicated `groundY` property. In `update()`, `if (ent.y > ent.frameTimer)` catches items 20px below where the entity died. If a zombie dies at `y = 350`, the coin freezes mid-air at `y = 370`.
- **Fix**: Add `groundY?: number` to `Entity` interface in `types.ts`. Set `groundY = ent.y` (or floor Y limit) on drop and test `if (ent.y > ent.groundY)`.

#### Bug 3.2: Direct React State Mutation during Collection (`Game.tsx:325-336`)
- **Location**: `Game.tsx` line 325-336.
- **Symptom**: Cash UI displays corrupted floating point totals (e.g., `$10.500000000000002`), state fails to update cleanly, and React re-renders are missed.
- **Root Cause**: Code directly mutates state: `stats.money += ent.value || 1; setStats({ ...stats });`. Direct state mutation breaks React reconciliation.
- **Fix**: Replace with immutable functional state setter: `setStats(prev => ({ ...prev, money: Number((prev.money + (ent.value || 1)).toFixed(2)) }))`.

#### Bug 3.3: Stale Closure Reference to `stats.luck` in `spawnCoin` (`Game.tsx:682`)
- **Location**: `Game.tsx` line 682.
- **Symptom**: Purchasing Luck upgrades in Craft Services (`Shop.tsx`) does not update coin reward calculations during active gameplay.
- **Root Cause**: `spawnCoin` accesses `stats.luck` from component outer render closure. Inside `requestAnimationFrame`, `stats` is stale unless read from a `statsRef` or functional parameter.
- **Fix**: Maintain a `statsRef` in `Game.tsx` synced to `stats` state, or pass `stats.luck` explicitly into `spawnCoin`.

#### Bug 3.4: Floating Red/Black HP Bar Rendered Over All Dropped Coins and Items (`drawService.ts:697-704`)
- **Location**: `services/drawService.ts` lines 665-667 & 697-704.
- **Symptom**: Every coin and item on the floor displays a floating black and red enemy health bar above it.
- **Root Cause**: In `drawEntity()`, the block `else if (ent.type === 'COIN' || ent.type === 'ITEM')` draws the coin/item graphic but fails to `return`. Execution falls through to lines 697-704, which renders an HP bar above the entity.
- **Fix**: Add `return;` immediately after rendering `COIN` or `ITEM` in `drawService.ts`.

#### Bug 3.5: Missing `COIN` & `ITEM` Visual Trait Initialization (`Game.tsx:1094-1149`)
- **Location**: `Game.tsx` `createVisuals()` function.
- **Symptom**: Unhandled visual trait generation for items causes fallback objects to be populated with blank hair/skin properties.
- **Root Cause**: `createVisuals()` has no case branch for `'COIN'` or `'ITEM'`, returning default fallback values.
- **Fix**: Add explicit case returns in `createVisuals()` for `'COIN'` and `'ITEM'`.

#### Bug 3.6: Luck Stat Ignoring Drop Probabilities and Item Quality
- **Location**: `Game.tsx` `generateLevel()` & `update()`.
- **Symptom**: High `luck` stat only slightly modifies base coin value, but does not increase burger spawn rates or double-coin drops.
- **Root Cause**: Item drop probability is hardcoded to fixed values (`Math.random() > 0.7 ? 'BURGER' : 'COIN'`).
- **Fix**: Factor `stats.luck` into drop chance calculation:
  ```typescript
  const dropChance = Math.min(0.9, 0.4 + (stats.luck * 0.1));
  const isBurger = Math.random() < (0.3 + stats.luck * 0.05);
  ```

---

## Section 4: Step-by-Step Fix Instructions for Implementer

1. **Update `types.ts`**:
   Add `groundY?: number;` to `Entity` interface.

2. **Fix `useInput` in `components/InputManager.tsx`**:
   Replace `InputManager.tsx` with the complete zero-lag mouse + WASD implementation provided in Section 2.3. Update `Game.tsx` to pass `canvasRef` to `useInput(canvasRef)`.

3. **Update Combat Input in `Game.tsx`**:
   - Replace `keys.current['ArrowLeft']` with `input.left || input.keys['ArrowLeft']` (and corresponding check for right, up, down).
   - In `update()`, check `input.attackPressed` for single-click combo triggers, then reset `input.attackPressed = false` at the end of the tick.
   - On `input.specialPressed`, check `stats.budget >= 100` and execute Special Attack, then reset `input.specialPressed = false`.

4. **Fix Item Drop Physics & State Mutations in `Game.tsx`**:
   - Update `spawnCoin` and `spawnItem`:
     ```typescript
     const spawnCoin = (x: number, y: number, value: number) => {
       entitiesRef.current.enemies.push({
         id: Math.random().toString(),
         type: 'COIN',
         x, y, width: 20, height: 20,
         hp: 1, maxHp: 1, state: 'IDLE', facing: 'LEFT',
         groundY: Math.min(y + 30, 540),
         frame: 0, frameTimer: 0,
         color: COLORS.COIN,
         vx: (Math.random() - 0.5) * 4,
         vy: -4,
         value: Number((value + (statsRef.current.luck * 0.5)).toFixed(2)),
         visuals: createVisuals('COIN')
       });
     };
     ```
   - Update `COIN` collection logic in `Game.tsx`:
     ```typescript
     if (ent.type === 'COIN') {
       const rewardVal = ent.value || 1;
       setStats(prev => ({
         ...prev,
         money: Number((prev.money + rewardVal).toFixed(2))
       }));
       addParticle(ent.x, ent.y, `$${rewardVal.toFixed(2)}`, 'yellow');
       audio.playCoin();
       enemies.splice(i, 1);
     }
     ```

5. **Fix Health Bar Overflow in `drawService.ts`**:
   In `services/drawService.ts`, update lines 665-667:
   ```typescript
   } else if (ent.type === 'COIN' || ent.type === 'ITEM') {
     ctx.fillStyle = ent.type === 'COIN' ? COLORS.COIN : 'red';
     ctx.beginPath();
     ctx.arc(centerX, drawY + 10, 8 * pScale, 0, Math.PI * 2);
     ctx.fill();
     return; // <--- MUST RETURN TO PREVENT DRAWING HEALTH BAR
   }
   ```

---

## Verification Plan

1. **Input Verification**:
   - Press WASD to ensure character moves up/down/left/right smoothly.
   - Click Left Mouse Button to verify combo attacks trigger cleanly without stuck states.
   - Right Click on canvas: verify no context menu appears and Special Attack fires when Budget meter is full (100%).
2. **Rewards System Verification**:
   - Destroy crates/barrels: confirm items drop to the floor plane (`groundY`) rather than freezing mid-air.
   - Walk over coins: confirm cash increases cleanly with exact 2-decimal precision without float precision errors.
   - Inspect dropped coins on ground: verify no black/red HP bars appear over coins or burgers.
