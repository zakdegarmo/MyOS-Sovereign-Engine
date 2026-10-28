# Digital Detective Implementation Plan

## Overview
Implement film-noir Digital Detective CLI script `scripts/detective.py` and automated verification script `scripts/verify_detective.py`.

## Phases
1. **Phase 1: Exploration & Requirements Verification**
   - Inspect existing SQLite schema in `data/myos_vector_store.db`.
   - Verify Ollama API endpoints (`http://localhost:11434/api/generate` and `http://localhost:11434/api/embeddings`).
   - Check available models (`gemma4:latest`, `mxbai-embed-large:latest`).
2. **Phase 2: Implementation & Verification**
   - Implement `scripts/detective.py` with CLI arguments `--target-dir` and `--read-db`.
   - Implement `scripts/verify_detective.py` to run `detective.py --target-dir test_folder` and assert DB insertions and float blob unpacking.
   - Run verification tests via worker.
3. **Phase 3: Code Review & Quality Assurance**
   - Dispatch 2 independent Reviewers to verify implementation logic, robustness, and layout compliance.
4. **Phase 4: Stress Testing & Edge Cases**
   - Dispatch 2 Challengers to empirically test with edge cases (empty dirs, missing files, corrupted floats).
5. **Phase 5: Forensic Integrity Audit**
   - Dispatch Forensic Auditor to check for hardcoded test outputs or dummy facades.
6. **Phase 6: Reporting**
   - Send Victory Claim Report to Sentinel (parent agent).
