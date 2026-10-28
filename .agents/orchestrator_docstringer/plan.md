# Plan: Docstringer Completion & Verification

## Architecture & Requirements
- Complete `scripts/docstringer.py` by implementing `process_file(filepath, conn)`.
- Use `tree-sitter` (`tree_sitter_python`, `tree_sitter_javascript`, `tree_sitter_typescript`) for multi-language AST parsing of `.py`, `.js`, `.ts`/`.tsx` files.
- Extract functions and classes.
- Detect existing docstrings/JSDoc; if missing, generate using `generate_docstring()`.
- Safely modify source code at exact byte offsets preserving leading indentation.
- Index into SQLite DB (`functions` table) using `struct.pack` for float array embeddings.
- Create `scripts/verify_docstringer.py` to test on sample `.py` and `.ts` files, asserting code modification and DB float array entries.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Exploration & Specs | Explore `scripts/docstringer.py`, existing DB schema, tree-sitter installation/bindings | none | DONE |
| 2 | Implementation | Implement `process_file` in `scripts/docstringer.py` | M1 | DONE |
| 3 | Verification Suite | Create `scripts/verify_docstringer.py` and run verification | M2 | DONE |
| 4 | Review, Challenge & Audit | Run Reviewers, Challengers, and Forensic Auditor | M3 | DONE (ALL APPROVED & CLEAN) |
