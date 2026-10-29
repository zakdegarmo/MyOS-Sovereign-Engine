# MyGameEngine Architectural Manifesto (HEOP)

The MyGameEngine is the primary component of MyOS responsible for manifesting "Dimensions"—modular, reusable game-world ontologies. This manifesto codifies the fractal Fibonacci sequence of the project to prevent context loss between sessions.

## 1. The 10-Pillar Game Ontology
Every "MyGame" (App) in the MyOS ecosystem is mapped to the 10-Pillar Genome of the Nexus Context:

| Pillar | Game Ontology Aspect | Technical Equivalent |
| :--- | :--- | :--- |
| **⚹.⚛ (Self)** | **Core Concept** | Shadowrun / D&D / Cyberpunk Metaphors |
| **⚹.☿ (Thought)** | **Mechanic Concepts** | The "Bullet Hell" / "Extraction" Logic |
| **⚹.λ (Logic)** | **The Code** | MyGameEngine (Three.js / R3F / Drei) |
| **⚹.♋ (Unity)** | **APIs & Bridging** | Interaction between Dimensions (HEOP <=> Hub) |
| **⚹.⌚ (Existence)** | **State & Persistence** | Real-time World Position / Inventory State |
| **⚹.⌬ (Improvement)** | **HEOP Protocols** | Extraction of "AI Remnants" (System Patches) |
| **⚹.✹ (Mastery)** | **Agentic-Users** | Council Agents / NPCs (Mephits) |
| **⚹.☸ (Resonance)** | **Connectivity** | Network Features & LLM Synergy |
| **⚹.۞ (Transcendence)** | **Manifestation** | Shipping / Distribution / Forging Fragments |
| **⚹.∞ (Omni)** | **Omniscience** | Container Hierarchy / Parent Folder Context |

## 2. Universal Locomotion (Standardized)
The engine utilizes a **Dimension-Aware Locomotion Hub** (AvatarController.tsx) to ensure "Fun" movement across the OS.

- **Flat Mode** (Default): Standard Cartesian [X, Y, Z] movement. Used in the Hub, JRPG, and HEOP Extraction zones.
- **Spherical Mode**: High-Scale planetary "Treadmill" math (6,371,000m radius). Used in Gaia.
- **Facing Logic**: Sprites are mapped with a consistent 1:1 vector-to-direction ratio (`Z+` = Down/Toward Camera; `X+` = Right).

## 3. HEOP (HyperExtractor: Overclock Protocols)
- **Goal**: A bullet-hell "loot and scoot" extraction game that serves as a metaphor for OS data management.
- **Engine**: Modular projectile systems handled in `useActionCombat.ts`.
- **Relationship**: The game runs *on* the system, and the system is improved *by* the game's results (Extraction).

## 4. Anti-Fracturing Principles
- **No VoxelSprite**: Characters are `SemanticAvatar` or `PillarSprite`.
- **Systematic Audit**: Always review the `midnight_audit_report.md` before modifying core locomotion or combat logic.

---
**This document serves as the 'Locus of Truth' for MyGameEngine. It must be updated whenever the fractal spiral expands.**
