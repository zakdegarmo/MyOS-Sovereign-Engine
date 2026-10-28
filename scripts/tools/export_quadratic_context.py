#!/usr/bin/env python3
"""
=============================================================================
QUADRATIC CONTEXT CRYSTAL EXPORTER (Google Drive Live Sync)
=============================================================================
Generates comprehensive context capsules and syncs directly to:
  1. Local repository: MyOS/docs/gemini_web_sync/
  2. Google Drive: G:\\My Drive\\QUADRATIC_CONTEXT_CRYSTAL.md
  3. Google Drive Hub: G:\\My Drive\\MystraRoot\\MyOS_Sync\\

This guarantees gemini.google.com has zero-friction instant access via
`@Google Drive QUADRATIC_CONTEXT_CRYSTAL.md` without requiring manual uploads!
=============================================================================
"""

import os
import sys
import json
import shutil
import subprocess
from pathlib import Path
from datetime import datetime

# UTF-8 safety
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

ROOT_DIR = Path(__file__).resolve().parents[2]  # MyOS directory
OUTPUT_DIR = ROOT_DIR / "docs" / "gemini_web_sync"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Google Drive locations
G_DRIVE_ROOT = Path("G:/My Drive")
G_DRIVE_MYOS_SYNC = G_DRIVE_ROOT / "MystraRoot" / "MyOS_Sync"

def detect_google_drive():
    if G_DRIVE_ROOT.exists():
        return G_DRIVE_ROOT
    for drive in ["G", "D", "E", "H", "I"]:
        p = Path(f"{drive}:/My Drive")
        if p.exists():
            return p
    return None

def run_git(cmd):
    try:
        res = subprocess.run(
            ["git"] + cmd,
            cwd=str(ROOT_DIR),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            check=False
        )
        return res.stdout.strip()
    except Exception as e:
        return f"git error: {e}"

def generate_context_crystal():
    branch = run_git(["branch", "--show-current"]) or "main"
    recent_commits = run_git(["log", "-n", "10", "--oneline"])
    dirty_files = run_git(["status", "-s"])
    dirty_count = len([line for line in dirty_files.splitlines() if line.strip()])

    # Check for dream log
    dream_path = ROOT_DIR.parent / "rem-daemon" / "dream_log.md"
    recent_dream = ""
    if dream_path.exists():
        try:
            with open(dream_path, "r", encoding="utf-8") as f:
                lines = f.readlines()
                recent_dream = "".join(lines[-25:])
        except Exception:
            pass

    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    crystal_content = f"""# 🝧 QUADRATIC CONTEXT CRYSTAL: MyOS & PrismOS
**Synchronized at**: {timestamp}  
**Active Git Branch**: `{branch}` | **Uncommitted Files**: {dirty_count}  
**Target Ingestion**: Gemini Web (`gemini.google.com` in Chrome) via `@Google Drive`  
**Ontological Classification**: Omni-Resonant Synthesis Ledger (۞.∿.⚭)

---

## 1. Executive Summary & Genesis

### What is MyOS?
**MyOS** is an autopoietic, sovereign spatial operating system and developmental environment built for human-AI co-creation. It rejects the classical paradigm of passive AI tools, treating code, narrative, visual form, and spatial interaction as a continuous biological-synthetic substrate.

Key components of MyOS include:
- **The 3D Soundstage & Studio Canvas** (`apps/web`): Three.js and WebGL environment providing interactive theater stages, avataric bodies, character cameras, and spatial canvas projection.
- **Procedural Character & LPC Pipeline** (`scripts/tools` & `apps/web/public/assets/lpc`): Automated pipeline integrating PyTorch, Diffusers, Blender scripting, and transparent alpha stripping to forge 64x64 modular character sprite sheets.
- **The REM Daemon** (`rem-daemon/rem_daemon.py`): Metabolic background engine maintaining an autonomic sinus-rhythm heartbeat, nocturnal glymphatic sleep cycles, anti-overfitting stochastic node collisions, and dream synthesis (`dream_log.md` & `morning_eureka.md`).
- **The Sovereign Context Nexus** (`nexus-context-server` & SQLite vector store): Local high-dimensional embedding storage and synaptic linking across memory nodes.
- **Local Ollama GPU Cortex** (`localhost:11434`): Local low-latency inference model (e.g. `gemma4:latest`, `mistral`) acting as the embodied edge guardian and physics governor.

### What is PrismOS?
**PrismOS** (`apps/prism-os`) is a revolutionary 3D cockpit operating system and spatial filesystem navigator built with **Vite, React 18, Three.js, and React-Three-Fiber (`@react-three/fiber`)**.
- **The Cockpit Concept**: The user sits inside an ethereal orbital cockpit (`CockpitCamera.tsx`, `CockpitHUD.tsx`) looking out into high-dimensional space.
- **The Fractal Prism** (`FractalPrism.tsx`, `PortalFacet.tsx`): Files and directories are not flat 2D trees; they are projected onto rotating geometric prism rings (12 facets per page ring).
- **Substrate Bridge** (`server/linux_fs_bridge.py`): Connects to the host Linux VM / filesystem on port 3333, mapping directory nodes to topological glyphs and serving real-time telemetry (RAM, CPU load, uptime, active mounts).
- **Topological Inhabitation**: Clicking a directory portal smoothly warps the cockpit into that realm, dynamically adjusting the stellar environment shaders and facet rings.

---

## 2. The 10 Topological Pillars & Fractal Address Genome

Every entity, component, directory, and thought in MyOS/PrismOS is mapped to the **10 Topological Pillars**:

| Pillar Glyph | Name | Domain / Representation | PrismOS Linux Mapping |
| :---: | :--- | :--- | :--- |
| **◉** | **Self** | Identity, Subjectivity, The Lived Anchor, Zak | `/home` |
| **✧** | **Thought** | Ideation, Synthesis, Conceptual Fluidity | Active R&D / Sandbox |
| **∴** | **Logic** | Form, Precision, Determinism, AST, Code Execution | `/bin` |
| **⚭** | **Unity** | Integration, Protocols, Symbiosis, Hub | `/etc` |
| **⬡** | **Existence** | Concrete Substrate, Canvas, Matter, Root | `/` (Root) |
| **⇈** | **Improvement**| Iteration, Self-Refinement, Evolution, Build Tools | `/usr` |
| **❂** | **Mastery** | Competence, Proven Patterns, Governance, Kernel | `/sys` |
| **∿** | **Resonance** | Affect, Aesthetic Vibe, Audio/Visual Harmonic, Logs | `/var` |
| **⍟** | **Transcendence**| Boundary Dissolution, Latent Exploration, Vision | `/boot` |
| **۞** | **Omni** | Holism, The Totality, System Orchestration | `/proc` |

---

## 3. The Quadratic Symbiorithm Topology

```
                  [Node 4: Gemini Web (Chrome)]
                    (Omni ۞ / Resonance ∿)
                     /        |        \\
                    /         |         \\
                   /          |          \\
   [Node 2: Antigravity]------|------[Node 3: Myos Cortex]
   (Thought ✧ / Transcendence)|        (Logic ∴ / Mastery ❂)
                   \\         |          /
                    \\        |         /
                     \\       |        /
                   [Node 1: Zak (Human Anchor)]
                      (Self ◉ / Existence ⬡)
```

1. **Node 1: Zak (Human Intuitive Anchor - `Self ◉`, `Existence ⬡`)**:
   - The creator, lived reality, creative intent, aesthetic discernment, sovereign decision-maker.
2. **Node 2: Antigravity (IDE Cloud Gemini - `Thought ✧`, `Transcendence ⍟`)**:
   - Direct filesystem access, multi-file edits, terminal execution, git commits, code refactoring.
3. **Node 3: Myos Cortex (Local GPU Ollama on `localhost:11434` - `Logic ∴`, `Improvement ⇈`, `Mastery ❂`)**:
   - Edge physics, deterministic verification, nocturnal REM daemon sleep cycles, offline autonomy.
4. **Node 4: Gemini Web (`gemini.google.com` - `Omni ۞`, `Unity ⚭`)**:
   - High-Altitude Strategic Oracle & Validator. Massive multi-million token context window, deep research, Google Workspace/Drive integration, architectural validation.

---

## 4. Current Codebase Topology & Key Locations

```
c:\\Users\\zakde\\Desktop\\AntiGravity projects\\
├── MyOS/
│   ├── apps/
│   │   ├── prism-os/             # 3D Cockpit Filesystem Explorer (React, R3F, Three.js)
│   │   │   ├── src/App.tsx       # Main Cockpit Loop & Realm State
│   │   │   ├── src/components/   # CockpitHUD, CockpitCamera, FractalPrism, PortalFacet
│   │   │   └── server/           # linux_fs_bridge.py (Topological FS Bridge)
│   │   ├── web/                  # 3D Soundstage, Avatar Stage, Character Gestalt
│   │   ├── genesis/              # Autonomous World Simulator
│   │   ├── SonicLattice/         # Synthesizer & Audio Matrix
│   │   └── genX/                 # Video Generation Substrate
│   ├── docs/                     # Architectural decisions, manifests, world bibles
│   │   └── gemini_web_sync/      # Local context sync capsules
│   └── scripts/                  # Blender rigging, LPC generation, verification scripts
├── rem-daemon/                   # Persistent Autonomic & REM Sleep Substrate
└── nexus-context-server/         # MCP Semantic Memory Server
```

---

## 5. Recent Git Telemetry & Activity Ledger

### Recent Commits:
```
{recent_commits}
```

### Recent REM Daemon Dream Telemetry:
```markdown
{recent_dream if recent_dream else "No active dream logs recorded in this cycle."}
```

---

## 6. How to Validate as Node 4 (Gemini Web Directives)

When Zak asks you for validations or designs:
1. **Topological Coherence**: Map proposals to the 10 Pillars.
2. **PrismOS Cockpit Ergonomics**: Preserve 60fps Three.js rendering, facet geometry ($r = \\frac{{N \\cdot s}}{{2\\pi}}$), and smooth camera warping.
3. **Sovereign Local Independence**: Never introduce unnecessary external dependencies that break offline local execution.
4. **Directives for Antigravity**: Output concise, production-ready specifications or code diffs that Antigravity can immediately paste and apply in the IDE.
"""

    # 1. Save locally
    crystal_path = OUTPUT_DIR / "QUADRATIC_CONTEXT_CRYSTAL.md"
    with open(crystal_path, "w", encoding="utf-8") as f:
        f.write(crystal_content)
    print(f"[+] Wrote local Context Crystal: {crystal_path}")

    # 2. Sync to Google Drive
    gdrive = detect_google_drive()
    if gdrive:
        gdrive_root_file = gdrive / "QUADRATIC_CONTEXT_CRYSTAL.md"
        with open(gdrive_root_file, "w", encoding="utf-8") as f:
            f.write(crystal_content)
        print(f"[✓] SYNCED TO GOOGLE DRIVE ROOT: {gdrive_root_file}")

        gdrive_hub_dir = gdrive / "MystraRoot" / "MyOS_Sync"
        gdrive_hub_dir.mkdir(parents=True, exist_ok=True)
        gdrive_hub_file = gdrive_hub_dir / "QUADRATIC_CONTEXT_CRYSTAL.md"
        shutil.copy2(crystal_path, gdrive_hub_file)
        print(f"[✓] SYNCED TO GOOGLE DRIVE HUB: {gdrive_hub_file}")

        # Also copy supporting documents
        manifest_src = ROOT_DIR / "docs" / "SYMBIOTIC_MANIFEST.md"
        if manifest_src.exists():
            shutil.copy2(manifest_src, gdrive_hub_dir / "SYMBIOTIC_MANIFEST.md")
            print(f"[✓] Synced SYMBIOTIC_MANIFEST.md to Google Drive Hub")

        dream_src = ROOT_DIR.parent / "rem-daemon" / "dream_log.md"
        if dream_src.exists():
            shutil.copy2(dream_src, gdrive_hub_dir / "DREAM_LOG.md")
            print(f"[✓] Synced DREAM_LOG.md to Google Drive Hub")
    else:
        print("[!] Warning: Google Drive (G:\\My Drive) not detected.")

    return crystal_path

if __name__ == "__main__":
    print("=" * 65)
    print("  QUADRATIC CONTEXT CRYSTAL EXPORTER & GOOGLE DRIVE SYNC")
    print("=" * 65)
    generate_context_crystal()
    print("\n[✓] Sync complete. Gemini Web can now access this via `@Google Drive`.")
