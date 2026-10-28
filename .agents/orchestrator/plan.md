# Orchestrator Execution Plan — LPC Sprite Sheet Pipeline

## Goal
Build an automated local PyTorch + Diffusers pipeline for generating, slicing, and alpha-stripping 64x64 LPC-format pixel art sprite sheets on an NVIDIA GeForce RTX 4060 Ti GPU.

## Decomposition & Sub-Tasks

### Milestone 1: Local Stable Diffusion & PyTorch Environment (R1)
- Target: `tools/comfy_env` virtual environment.
- Action:
  1. Audit existing `tools/comfy_env` Python interpreter and installed packages.
  2. Verify PyTorch detects CUDA GPU (`GeForce RTX 4060 Ti`).
  3. Ensure required libraries (`torch`, `diffusers`, `transformers`, `accelerate`, `pillow`) are installed and functional.

### Milestone 2: Automated LPC 64x64 Sprite Generator Script (R2)
- Target: `tools/generate_lpc_sheet.py`.
- Action:
  1. Build Python script `tools/generate_lpc_sheet.py`.
  2. Implement Stable Diffusion image generation pipeline tuned for LPC sprite sheets (832x1344 dimensions = 13 cols x 21 rows of 64x64 frames).
  3. Implement background alpha stripping / color keying to convert background to transparent PNG.
  4. Ensure script saves output to `apps/web/public/assets/lpc/generated/` (creating directory if needed).

### Milestone 3: End-to-End Verification & Forensic Integrity Audit
- Action:
  1. Run test generation via worker/challenger.
  2. Verify generated PNG dimensions (832x1344) and alpha transparency.
  3. Perform Forensic Integrity Audit (`teamwork_preview_auditor`).
  4. Send victory report to Project Sentinel.

## Iteration Loop Policy
Each milestone follows: Explorer/Worker investigation & implementation -> Reviewer/Challenger validation -> Forensic Audit -> Gate.
