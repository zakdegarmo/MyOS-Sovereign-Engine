---
name: cpp_bridge
description: Documents the architecture and methodology for bridging high-level Antigravity environments (TypeScript/React/Node) with low-level bare-metal C++ logic using WebAssembly (Wasm), Node Native Addons (N-API), or direct memory hooking.
---

# C++ & Low-Level Bridge Skill

This skill documents the methodology for bridging the high-level Antigravity environment (TypeScript/React/Node) with low-level, bare-metal C++ logic using WebAssembly (Wasm), Node Native Addons (N-API), or direct memory hooking.

## 🎯 Objective
To enable bare-metal performance and direct hardware/memory access from within the Antigravity ecosystem, allowing for 2.5D rendering pipelines, emulator integration, and high-frequency real-time systems.

## 🏗️ Architecture Layers

1.  **High-Level (The UI/Orchestrator):** React, Three.js, Node.js.
2.  **Bridge Layer (The Glue):**
    *   **Emscripten/Wasm:** Best for portable, high-performance web code.
    *   **N-API / Node-Gyp:** Best for local desktop performance and system calls.
    *   **FFI (Foreign Function Interface):** Direct calls to compiled .dll or .so files.
3.  **Low-Level (The Core):** C++20, C, ASM.

## 🛠️ Workflows

### 1. The Wasm Pipeline
For browser-based low-level crunching:
- Compile C++ with `emcc`.
- Use `EMSCRIPTEN_BINDINGS` to expose functions to JS.
- Load via `fetch` and instantiate in a Web Worker to avoid blocking the UI thread.

### 2. The Native Addon Pipeline (VRAM Hooking)
For local execution (e.g., SNES VRAM injection):
- Use `node-addon-api`.
- Create a `binding.gyp` file.
- Use `MemorySnapshot` techniques to interface with external processes (emulators).

## ⚔️ Animation Priorities & Frame Locking (The "Running Slash")
When bridging high-frequency logic (C++ style loops) to React:
- Use **Priority Tiers**:
    - `Tier 0 (Override):` Death, Hurt (Immediate frame lock).
    - `Tier 1 (Discrete):` Strike, Spellcast (Duration lock).
    - `Tier 2 (Continuous):` Walk, Run (Looping).
- **Physics Coupling:** Even when "locked" in an animation tier, physics (translation) can continue to allow for "Running Slashes" or "Momentum Strikes".

## 🚀 Sandbox: Stop-Motion Interpolation
The theory of positioning 3D sprites, capturing frames, and interpolating:
1.  **Pose Phase:** Use a `PoseLab` component to set `Bone` transforms via UI.
2.  **Capture Phase:** Use `gl.readPixels` or `toDataURL` to save the camera-relative sprite.
3.  **Interpolation Phase:** Use a shader to blend between two textures based on a `tween` value (0.0 - 1.0).

---

*This skill is a living document for Antigravity and the Pilot to evolve together.*
