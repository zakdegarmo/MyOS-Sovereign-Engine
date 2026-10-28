# Project: myos_ux_reviewer

## Architecture
Autonomous UI/UX review pipeline that navigates the MyOS web application (Astra Lab dev environment), captures screenshots, analyzes visual states via a local `llava` model on Ollama (`http://localhost:11434`), and synthesizes the findings into a tech review article using a local `gemma4` model on Ollama.

Target project directory: `C:\Users\zakde\teamwork_projects\myos_ux_reviewer`

```
C:\Users\zakde\teamwork_projects\myos_ux_reviewer\
├── src\
│   ├── navigator.py               # R1: Automated navigation & screenshot capture
│   ├── vision_analyzer.py         # R2: Local llava vision API integration & insight extraction
│   ├── journalistic_synthesizer.py # R3: Local gemma4 synthesis & Markdown report generation
│   └── main_pipeline.py           # End-to-end execution runner
├── screenshots\                   # Captured visual states (.png)
├── visual_insights.json           # Aggregated structured vision analysis
├── myos_ux_sneak_peek_review.md   # Final generated Markdown review article
└── tests\
    ├── test_navigator.py
    ├── test_vision_analyzer.py
    ├── test_journalistic_synthesizer.py
    ├── test_main_pipeline.py
    └── e2e_runner.py              # 4-tier test runner
```

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Automated Navigation & Screenshot Capture | Navigate MyOS Astra Lab UI & save screenshot sequence | M1 | R1 |
| 2 | Screenshot Visual State Coordination | Ensure browser navigation coordinates with capture timing to avoid missing UI states | M1 | R1 |
| 3 | Ollama Local Llava Vision Integration | Send screenshots to local `llava` model via Ollama API (`localhost:11434`) | M2 | R2 |
| 4 | UI/UX Insight & Critique Extraction | Extract structured UX feedback, pain points, and design notes per screen | M2 | R2 |
| 5 | Visual Insight Aggregator | Combine multi-screen visual insights into structured JSON for synthesis | M2 | R2 |
| 6 | Ollama Local Gemma4 Journalistic Synthesis | Query `gemma4` model via Ollama API (`localhost:11434`) with aggregated insights | M3 | R3 |
| 7 | Sneak Peek Markdown Article Generator | Format synthesis into an industry-standard "early sneak peek" review article | M3 | R3 |
| 8 | E2E Main Pipeline Orchestrator | Complete pipeline script running capture -> vision -> synthesis | M4 | Acceptance Criteria |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Navigation & Capture Engine (R1) | `navigator.py`, screenshot capture, timing coordination | None | PLANNED |
| 2 | Local Vision Analysis Engine (R2) | `vision_analyzer.py`, Ollama `llava` prompt integration, insight aggregation | M1 | PLANNED |
| 3 | Journalistic Synthesis Engine (R3) | `journalistic_synthesizer.py`, Ollama `gemma4` article generation | M2 | PLANNED |
| 4 | Main Pipeline & E2E Verification (Final) | `main_pipeline.py`, full CLI runner, 100% E2E test suite pass | M1, M2, M3 | PLANNED |

## Interface Contracts
### `navigator.py` ↔ `vision_analyzer.py`
- `navigator.py` produces `screenshots/*.png` and metadata `screenshots/manifest.json`.
- `manifest.json` schema: `[{"id": string, "path": string, "timestamp": string, "route": string, "action": string}]`.

### `vision_analyzer.py` ↔ `journalistic_synthesizer.py`
- `vision_analyzer.py` produces `visual_insights.json`.
- `visual_insights.json` schema: `{"app_name": "MyOS Astra Lab", "insights": [{"screen": string, "good": [string], "bad": [string], "neutral": [string], "usability_score": number}]}`.

### `journalistic_synthesizer.py` ↔ Output
- Produces `myos_ux_sneak_peek_review.md` containing headers: `# MyOS Astra Lab: Early Sneak Peek & UX Review`, `## Executive Summary`, `## The Good: Design Highlights`, `## The Bad: Pain Points & Flaws`, `## The Neutral: Observations`, `## Final Verdict & UX Recommendations`.

## Code Layout
- Target Workspace: `C:\Users\zakde\teamwork_projects\myos_ux_reviewer`
- Language: Python 3 / Node.js
- CLI interface: `python src/main_pipeline.py [--url URL] [--output FILE]`
