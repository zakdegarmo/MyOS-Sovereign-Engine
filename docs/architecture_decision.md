# Architecture Decision Document (ADR) - AI-Orchestrated D&D VTT Cartridge

This document details the architectural decisions made for the AI-orchestrated D&D virtual tabletop platform cartridge within MyOS.

## 1. Stack Choice

**Decision**: React + TypeScript + React Three Fiber (R3F) + Vite + Tailwind CSS.

### Rationale:
- **React & TypeScript**: The MyOS web portal runs on a modern React/Vite/TS stack. Implementing the VTT as a native React component ensures seamless shell/dashboard integration, hot reloading, sharing state hooks, and zero cross-origin/iframe communication overhead. TypeScript provides complete static type safety for the complex 3D rendering context, state updates, and external API integrations.
- **React Three Fiber (R3F)**: R3F allows declarative composition of Three.js scenes within a React lifecycle. This dramatically simplifies updating player/monster token positions, grid heights, and colors using standard React state hooks without manual raw WebGL or three.js object lifecycle manipulation.
- **Vite & Tailwind CSS**: Vite offers sub-millisecond hot-module replacement (HMR) for fast iterative development of both 2D control panels and 3D scenes. Tailwind CSS enables crafting high-fidelity Cyberpunk/Retro control dashboards using utility classes, aligning with the visual theme of OmniLab.

---

## 2. Visual Style Choice

**Decision**: A 3D VTT (Virtual Tabletop) slice featuring a terraced hexagonal grid with 3D player and monster figurines/tokens, and an interactive side control panel.

### Rationale:
- **Terraced Hex Grid**: Hexagonal cells are standard in tactical tabletop gaming. By rendering the grid cells as 3D cylinders (`<cylinderGeometry args={[0.762, 0.82, 1, 6]} />` or equivalent) with varying heights (Z-axis offsets) and thematic hex colors (e.g., `#2e7d32` for grass, `#37474f` for rock, `#0277bd` for water, `#ef6c00` for lava/sand), we establish a detailed 3D terrain slice.
- **3D Tokens/Figurines**: Players and monsters are represented by distinct 3D geometry objects (e.g., a high-tech cyan/blue capsule for the player, and an industrial red cylinder/capsule for the goblin) positioned on top of the terrain blocks.
- **Cyberpunk Retro UI Panel**: Side panels styled with neon outlines, status bars, and diagnostic feeds display metrics (HP, Coordinates, Turn Log) alongside the action console, invoking a vintage computer terminal/VTT fusion.

---

## 3. Narrative Pipeline Choice

**Decision**: Structured JSON prompt pipeline feeding into a local Ollama instance running the `gemma4:latest` model, with a robust client-side dice-rolling fallback.

### Rationale:
- **Structured Prompts**: A structured layout converts the game state (JSON containing Player class, HP, position; Goblin HP, position; and the player's text action) into a standardized instruction block. This ensures that even light models understand their role as a dungeon master (DM), processing actions and returning both a narrative description and structured state corrections (like Goblin HP reductions).
- **gemma4:latest Local Ollama Integration**: Querying `http://localhost:11434/api/chat` avoids privacy leakage and network roundtrip latency. The cartridge uses native JSON schema hints in the chat payload to nudge the model toward structured outputs.
- **Graceful Client Fallback**: If the Ollama server is offline or the model fails to load, the client gracefully activates a local fallback engine using simulated D&D dice rolls (`Math.random()`) and pre-coded DM text. This ensures the environment never crashes, displaying an informative banner: `[OFFLINE DM MODE]: Local Ollama offline. Dice rolls simulated locally.`

---

## 4. Audio Integration

**Decision**: Tone.js audio engine triggering synth chords and roll sound effects.

### Rationale:
- **Synthesizer sound generation**: By synthesizing sounds (square/triangle waves with brief decay envelopes) via Tone.js instead of loading static WAV/MP3 files, we prevent asset loading failures and minimize bundle size.
- **Interactivity constraint**: Web browsers block AudioContext creation before user click. We initialize and start the Tone.js context upon the user's first click interaction (e.g., clicking "Start Sound", "Send Action", or interacting with the grid).
