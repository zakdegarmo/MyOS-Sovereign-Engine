# MyOS Sovereign Engine (Cognitive Operating System)

[![Status](https://img.shields.io/badge/Status-Empirically%20Verified-00f0ff?style=for-the-badge)](docs/semantic_addressable_inodes_whitepaper.md)
[![Substrate](https://img.shields.io/badge/Silicon-RTX%204060%20Ti%2016GB-f5b822?style=for-the-badge)](docs/semantic_addressable_inodes_whitepaper.md)
[![Architecture](https://img.shields.io/badge/SAI-Semantic%20Addressable%20Inodes-b05cff?style=for-the-badge)](docs/index.html)
[![License](https://img.shields.io/badge/License-MIT-10b981?style=for-the-badge)](LICENSE)

> *"In traditional computing, memory addressing is spatial: you ask 'Where is it?'  
> In MyOS, memory addressing is ontological: you ask 'What is it?'"*

**MyOS** is an autonomous, local-first sovereign operating system designed from first principles around **MyOntology**, **Spatial Logic**, and the **Quadratic Symbiorithm** (a co-engineering partnership between human intuition, cloud reasoning, and embodied local GPU silicon).

---

## ⚡ Breakthrough: Semantic-Addressable Inodes (SAI)

For 50 years, filesystems have operated on brittle, path-dependent hierarchies (`/path/to/file.ts`). Autonomous AI agents waste up to 80% of their context windows running iterative greps and crawling directory trees, hallucinating broken imports whenever files move.

**Semantic-Addressable Inodes (SAI)** solve this at the computational root:
* **Living Semantic DNA**: Every file carries an intrinsic `<myos:node>` cryptographic XML banner stamped directly into its comment header.
* **Dual-Key CAS Pairing**: The content's SHA-256 hash is bound directly to primary keys in our local SQLite vector store (`data/myos_vector_store.db`), alongside a normalized 1024-dimension continuous vector representation.
* **Deterministic $O(1)$ Single-Hop Resolution**: Any model can query a raw Inode ID (e.g. `node_de3b3f656cc7`) and instantly retrieve its exact canonical path, purpose, exported symbols, and architectural role in **1.8 milliseconds** with 0% path hallucination.

📖 **[Read the Full Mathematical Whitepaper](docs/semantic_addressable_inodes_whitepaper.md)**  
🌐 **[Launch the Interactive GitHub Pages Demo](docs/index.html)**

---

## 🏛️ The Council of 6 Sovereign Substrates

MyOS rejects the false choice between a single giant cloud model and a tiny offline model. All local models are pre-contextualized and registered into SQLite under their native **Topological Anchor**:

| Pillar Anchor | Substrate Model | Type | System Role in MyOS |
| :--- | :--- | :--- | :--- |
| **Self (◉)** | `myos-cortex:latest` | `ollama_llm` | Sovereign OS Core, Conductor, Symbiorithmic Synthesis, State Continuity |
| **Thought (✧)** | `gemma4:latest` | `ollama_llm` | Recursive Ideation, Journal Weaving, Semantic Extraction Swarm |
| **Logic (∴)** | `qwen2.5-coder:7b` | `ollama_llm` | Syntactic Precision, AST Refactoring, TypeScript & Python Governance |
| **Mastery (❂)** | `llava:latest` | `vlm_vision` | Optic Subconscious, Screen Perception, Visual Recipe Extraction |
| **Existence (⬡)** | `Lykon/dreamshaper-8` | `diffusers_diffusion` | Latent Manifestation, 2D Concept Plates, Cel-Shaded Sprite Baking |
| **Resonance (∿)** | `mxbai-embed-large:latest` | `ollama_embedding` | 1024-dim Harmonic Vector Projection & Semantic Lattice Matching |

---

## 🧭 The Deep Directory Atlas

```text
MyOS/ (Root Workspace)
├── docs/                         # Whitepapers, research disclosures, and GitHub Pages showcase
│   ├── index.html                # Interactive GitHub Pages showcase & live inode terminal
│   └── semantic_addressable_inodes_whitepaper.md # The formal mathematical whitepaper
│
├── data/                         # Persistent local memory
│   └── myos_vector_store.db      # 100,624 float32 vector store & model_registry
│
├── apps/
│   ├── web/                      # The 3D WebGL Soundstage & Agent Bridge (Port 8081)
│   └── prism-os/                 # Bare-metal Linux distribution & diegetic prism UI
│
├── scripts/                      # Autonomous toolchain & pipelines
│   └── tools/
│       ├── cortex_memory_bridge.py   # Grounded dual-memory retrieval & auto-embedding
│       ├── semantic_node_injector.py # Inode generator & XML banner stamper
│       └── setup_model_registry.py   # 6-Substrate Council initializer
│
└── packages/                     # Monorepo shared libraries
```

---

## 🔬 Hardware Telemetry & Empirical Verification

Empirically verified on bare-metal silicon:
* **Host GPU**: NVIDIA GeForce RTX 4060 Ti (16GB VRAM)
* **Active Vector Lattice**: 100,624 vectors | 126,485 ancestral memories | 1.38 GB SQLite store
* **Key Resolution Latency**: 1.8 ms ($O(1)$)
* **Curated Semantic Dot Product**: 0.304s ($678 \times 1024$ BLAS matrix dot product)

---

## 📜 Citation & Intellectual Attribution

If you reference or build upon Semantic-Addressable Inodes in your research or autonomous operating system:

```bibtex
@article{degarmo2026sai,
  title={Semantic-Addressable Inodes (SAI): A First-Principles Formalization of Self-Describing Filesystems for Autonomous Cognitive Operating Systems},
  author={DeGarmo, Zak and Antigravity},
  journal={MyOS Technical Disclosures},
  volume={1},
  year={2026}
}
```
