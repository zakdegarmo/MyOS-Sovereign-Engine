---
description: Perform the Cartoonify (Manifestation) process to integrate high-fidelity 2D assets as living autonomous entities in the MyOS Hub.
---

# Cartoonify Manifestation Workflow

Use this workflow to transform a raw 2D animation asset (GIF or Sprite Sheet) into a fully autonomous, high-fidelity "Elite" NPC within the Three.js Hub environment.

## Phase 1: Asset Extraction (Nigredo)
1.  **Locate Assets**: Identify high-fidelity source animations (e.g., 256px  GIFs or sheets).
2.  **Library Check**: Ensure `omggif.js` is loaded in `index.html` for on-the-fly GIF decoding.
// turbo
3.  **Sync**: Copy assets to `/apps/web/public/assets/`.

## Phase 2: Frame Refinement (Albedo)
1.  **Avatar Implementation**: Create or update an `EliteAvatar` instance.
2.  **GIF-Ripper Logic**: 
    - Use `(window as any).GifReader` to decode the buffer.
    - Extract frames into `THREE.CanvasTexture` arrays.
3.  **Chroma-Key Shader**:
    - Implement the `Pro-Grade Chroma-Key Shader` to purge the background (typically `0xffffff`).
    - Adjust `uSimilarity` (start at 0.7) and `uSmoothness` (0.05) to eliminate edge glow ("fluorescent effect").
4.  **Spatial Calibration**:
    -   Set `PlaneGeometry` aspect ratio based on GIF dimensions.
    -   Translate geometry by `0.5` on the Y-axis for a "feet-on-ground" pivot.

## Phase 3: Autonomous Union (Rubedo)
1.  **NPC Wrapper**: Wrap the `EliteAvatar` in an `EliteMephitNPC`.
2.  **Persona Pivot**: 
    - Define a heroic/character-accurate System Prompt.
    - Link the `triggerBark` function to `localLlmService.ts` (Ollama/Mistral).
3.  **Movement Engine**: 
    - Use `useRef` for `targetPos` and `posRef` to avoid React closure traps in `useFrame`.
    - Implement smooth autonomous wandering with frequent probability pulses.
4.  **Ensemble Scaling**:
    - Calibrate the `scale` prop to match the Hub's baseline ratio (Mephit 1.5 standard).

## Final Verification
- [ ] Character billboards correctly to the camera.
- [ ] Character walks autonomously without freezing.
- [ ] Local LLM delivers barks on click/timer without quotes.
- [ ] Background is perfectly transparent.