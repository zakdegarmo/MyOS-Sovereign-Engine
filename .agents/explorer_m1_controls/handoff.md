# Handoff Report — Explorer Controls (Milestone 1)

**Working Directory**: `c:\Users\zakde\Desktop\AntiGravity projects\MyOS\.agents\explorer_m1_controls`  
**Target Package**: `packages/neon-nightmare` (to be `packages/b-movie-beatdown`)  
**Parent Conversation ID**: `ad3ceac7-c468-4407-9a25-e56d4e458853`  
**Date**: 2026-07-26  

---

## 1. Observation

Direct observations from examining `packages/neon-nightmare`:

1. **Input Handling (`components/InputManager.tsx:1-26`)**:
   ```typescript
   export const useInput = () => {
     const keys = useRef<{ [key: string]: boolean }>({});
     useEffect(() => {
       const handleKeyDown = (e: KeyboardEvent) => { keys.current[e.code] = true; };
       const handleKeyUp = (e: KeyboardEvent) => { keys.current[e.code] = false; };
       window.addEventListener('keydown', handleKeyDown);
       window.addEventListener('keyup', handleKeyUp);
       return () => { ... };
     }, []);
     return keys;
   };
   ```
   - Only listens to `keydown` and `keyup`. No `mousedown`, `mouseup`, `mousemove`, `contextmenu`, or `blur` listeners exist anywhere in the application.

2. **Movement & Combat Control Input Checks (`components/Game.tsx:81-128`)**:
   - Lines 81-93 check `keys.current['ArrowUp']`, `keys.current['ArrowDown']`, `keys.current['ArrowLeft']`, `keys.current['ArrowRight']`. WASD keys (`KeyW`, `KeyA`, `KeyS`, `KeyD`) are unhandled.
   - Line 115 checks `keys.current['KeyZ']` for Special Attack.
   - Line 128 checks `keys.current['KeyX']` for Combo Attack.

3. **Rewards Drop Physics & Ground Collision (`components/Game.tsx:317-322` & `677`)**:
   - `spawnCoin` sets `frameTimer: y + 20`.
   - Lines 317-322 check:
     ```typescript
     if (ent.y > ent.frameTimer) {
       ent.y = ent.frameTimer;
       ent.vy = -ent.vy * 0.5;
       ...
     }
     ```
   - Overloads `frameTimer` to serve as drop height, causing items dropped at `y = 350` to bounce mid-air at `y = 370`.

4. **Direct React State Mutation (`components/Game.tsx:325-336`)**:
   ```typescript
   if (ent.type === 'COIN') {
     stats.money += ent.value || 1;
     ...
   }
   setStats({ ...stats });
   ```
   - Mutates `stats.money` directly in-place before calling `setStats({ ...stats })`, violating React state immutability.

5. **Floating Health Bar Rendering (`services/drawService.ts:665-667` & `697-704`)**:
   ```typescript
   else if (ent.type === 'COIN' || ent.type === 'ITEM') {
     ctx.fillStyle = ent.type === 'COIN' ? COLORS.COIN : 'red';
     ctx.beginPath(); ctx.arc(centerX, drawY + 10, 8 * pScale, 0, Math.PI * 2); ctx.fill();
   }
   ```
   - Does NOT `return;` after rendering coin/item. Execution falls through to line 697:
   ```typescript
   const hp = Math.max(0, ent.hp / ent.maxHp);
   ...
   ctx.fillStyle = hpCol; ctx.fillRect(centerX - barW / 2, barY, barW * hp, barH);
   ```
   - Renders a black/red HP bar over every coin and burger sitting on the floor.

---

## 2. Logic Chain

1. **Observation 1 & 2** show that input handling currently listens only to window keyboard events and hardcodes Arrow keys + Z/X/Space. 
   - **Reasoning**: To transition to modern beat-'em-up controls, WASD keys must be registered for movement, and mouse button events (`mousedown`, `mouseup`, `mousemove`, `contextmenu`) must be bound. Storing single-frame edge triggers (`attackPressed`, `specialPressed`) prevents key auto-repeat glitches during combo strikes.
   - **Conclusion**: Implement the complete `InputState` interface and event management system specified in `analysis.md`.

2. **Observation 3** demonstrates that `frameTimer` is overloaded to calculate drop bounce bounds.
   - **Reasoning**: Setting `frameTimer = y + 20` limits falling distance relative to where the entity died instead of the floor plane (`FLOOR_Y` / 2.5D depth ground).
   - **Conclusion**: Introduce an explicit `groundY?: number` property on `Entity` to ground items properly.

3. **Observation 4** shows direct state mutation (`stats.money += ...`).
   - **Reasoning**: Direct mutation breaks React's shallow comparison, resulting in stale UI state and float precision errors.
   - **Conclusion**: Replace with functional immutable updates (`setStats(prev => ({ ...prev, money: ... }))`).

4. **Observation 5** demonstrates fall-through execution in `drawEntity()`.
   - **Reasoning**: Because `COIN` and `ITEM` rendering blocks do not `return`, rendering falls through to generic HP bar code.
   - **Conclusion**: Add `return;` at the end of the `COIN`/`ITEM` block in `drawService.ts`.

---

## 3. Caveats

- **Pixel Forge Tool Dependencies**: milestone 2 will generate replacement sprite assets via `pixel_forge.py`. The control and reward fixes designed herein maintain complete compatibility with both legacy assets and upcoming pixel art sprite sheets.
- **Top-Down vs Side-Scroll Jumping**: Level definitions in `films.ts` specify `TOP_DOWN` vs `SIDE_SCROLL` perspectives. Jump controls use Z-axis altitude for top-down levels and Y-axis physics for side-scroll levels.

---

## 4. Conclusion

The audit of controls and reward generation in `packages/neon-nightmare` is complete. The exact control scheme design (WASD movement, Left Click attack, Right Click special, Space jump) and step-by-step code fixes for all 6 identified rewards bugs have been documented in `analysis.md`.

---

## 5. Verification Method

1. **Inspect Artifacts**:
   - Verify `c:\Users\zakde\Desktop\AntiGravity projects\MyOS\.agents\explorer_m1_controls\analysis.md` exists and contains full architectural analysis, zero-lag WASD+Mouse control implementation, and step-by-step rewards bug fixes.
2. **Execute Build/Check Test**:
   - Run `npx tsc --noEmit` in `packages/neon-nightmare` (or PowerShell command `npm run build`) to confirm TypeScript type safety.
3. **Runtime Invalidation Conditions**:
   - Input system fails if WASD keys fail to move player or right click triggers context menu.
   - Rewards system fails if dropped coins float in mid-air or display floating health bars above them.
