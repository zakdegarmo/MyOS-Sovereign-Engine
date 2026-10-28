# E2E Test Infra: myos_ux_reviewer

## Test Philosophy
- Opaque-box, requirement-driven testing. No internal code dependency.
- Strategy: 4-Tier test methodology (Feature Coverage, Boundary/Corner Cases, Cross-Feature Combinations, Real-World Workloads).

## Feature Inventory & Test Matrix
| # | Feature | Tier 1 (Feature) | Tier 2 (Boundary) | Tier 3 (Pairwise) | Tier 4 (Scenario) |
|---|---------|:----------------:|:-----------------:|:-----------------:|:-----------------:|
| 1 | Automated Navigation & Screenshot Capture | 5 | 5 | ✓ | ✓ |
| 2 | Screenshot Visual State Coordination | 5 | 5 | ✓ | ✓ |
| 3 | Ollama Local Llava Vision Integration | 5 | 5 | ✓ | ✓ |
| 4 | UI/UX Insight & Critique Extraction | 5 | 5 | ✓ | ✓ |
| 5 | Visual Insight Aggregator | 5 | 5 | ✓ | ✓ |
| 6 | Ollama Local Gemma4 Journalistic Synthesis | 5 | 5 | ✓ | ✓ |
| 7 | Sneak Peek Markdown Article Generator | 5 | 5 | ✓ | ✓ |
| 8 | E2E Main Pipeline Orchestrator | 5 | 5 | ✓ | ✓ |

## Test Architecture
- Test Runner: `python tests/e2e_runner.py`
- Pass Condition: 100% tests pass, exit code 0.
- Fallback / Mock support: Includes live Ollama test modes (`localhost:11434`) and mock server fallback for deterministic CI runs.

## Tier Breakdown
- **Tier 1 (40 tests)**: Validates basic feature invocation for navigator, vision, synthesizer, and CLI args.
- **Tier 2 (40 tests)**: Tests missing screenshots, unreachable Ollama endpoints, empty insights JSON, corrupted images, invalid flags.
- **Tier 3 (8 tests)**: Pairwise flow tests (e.g. navigator -> vision, vision -> synthesizer, full CLI options).
- **Tier 4 (5 tests)**: Real-world application scenarios (full pipeline end-to-end execution on live/mock Astra Lab UI).
