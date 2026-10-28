# 🏛️ MyOS MASTER TASK LEDGER [AMO: 0000]

This file is the **PERMANENT** registry of tasks, features, and fixes for MyOS. 
**DO NOT OVERWRITE THIS FILE.** Append new tasks or update status on existing ones.

---

## 🌀 Active Ontological Priorities
| ID | Category | Task Description | Status | Priority |
| :--- | :--- | :--- | :--- | :--- |
| **SYS-01** | **Core** | Cleanup: Delete "The Forge" garbage and rename internal service refs to "The Core". | 🔄 In-Progress | CRITICAL |
| **UI-01** | **Nexus** | Fix `NexusContainer` recursion: Render factor grids for all 10 pillars (not just Self). | 🔄 In-Progress | HIGH |
| **UI-02** | **Docks** | Audit and fix Nested Docks across all pillar interfaces for consistent behavior. | ⏳ Pending | HIGH |
| **GAME-01** | **Holodeck** | Prototype "Zombies Ate My Neighbors" style 3D Mode 8 engine in the Cartesian grid. | ⏳ Pending | CREATIVE |
| **AL-01** | **Lab** | Connect `AnalysisLab.tsx` to real Gemini LLM for trait manifestation logic. | ⏳ Pending | MEDIUM |
| **MEM-01** | **Memory** | Implement `MemCube.add()` to actually write entries to `memory_core.json`. | ⏳ Pending | MEDIUM |

---

## 🛠️ Technical Debt & Stubs (Deep Audit)
- [ ] **Vector Service**: Missing actual ontological distance calculation (currently placeholders).
- [ ] **The Forge Persistence**: `exportToPillar` logic is a log-only stub. Needs IDB/LocalStorage.
- [ ] **TCP Node**: Ghost node requires actual networking logic or removal.
- [ ] **Library Sync**: Ensure `dist/library` reflects changes made in the UI panels.

---

## 📜 Historical Tasks (Recovered from Git)
- [x] Phase 1: Procedural Semantic Avatars (Canvas Compositor).
- [x] Phase 1.1: LPC Asset Reorganization.
- [x] 3D Knowledge Graph: Base implementation with force-directed physics.
- [x] System HUD: Dock refactor and Councilor Summoning logic.
- [ ] Camera Scaling: Coordinate grid zoom bounds and Terraria-style nav.
- [ ] Euclidean Traversal: Refactor `WanderingWrapper` to `AvatarController` for P2P movement (1 unit/sec).

---

## 🎮 The "ZAMN" Game Offshoot
- [ ] Initialize new workspace or sub-directory for the Game Engine.
- [ ] Reference MyOS `AvatarController` and `SemanticAvatar` assets.
- [ ] Use a clean "Panels Only" UI for the 10 main game components.
- [ ] Implement Top-Down / Isometric Mode 8 camera logic.

---

*Last Updated: 2026-03-17 17:55 - Antigravity*
