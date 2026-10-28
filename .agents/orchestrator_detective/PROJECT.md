# Project: Digital Detective (`detective.py` & `verify_detective.py`)

## Architecture
- `scripts/detective.py`: CLI script for filesystem investigation and DB note saving.
  - Arguments: `--target-dir <path>` (scan specific directory), `--read-db` (read entries from SQLite DB).
  - LLM API: Ollama `http://localhost:11434/api/generate` with `gemma4:latest` model + film-noir detective system prompt.
  - Embedding API: Ollama `http://localhost:11434/api/embeddings` with `mxbai-embed-large:latest` model.
  - Storage: SQLite database `data/myos_vector_store.db` (table: `vectors`).
    - Schema: ID (TEXT PRIMARY KEY), type ('detective_note'), timestamp (TEXT), text (TEXT), embedding (BLOB float array).
- `scripts/verify_detective.py`: Verification script.
  - Executes `detective.py --target-dir test_folder` (creates a test_folder if needed).
  - Asserts row added to `data/myos_vector_store.db` with `type = 'detective_note'`.
  - Asserts embedding blob in DB unpacks to a list of floats matching the dimension of `mxbai-embed-large:latest` (1024 floats).

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Exploration & Schema Analysis | Inspect `data/myos_vector_store.db`, test Ollama APIs, confirm table schema & embedding dimension | None | DONE |
| 2 | Implementation & Local Testing | Implement `scripts/detective.py` and `scripts/verify_detective.py`, run verification script | M1 | DONE |
| 3 | Review & Quality Check | Independent code review by Reviewers | M2 | DONE |
| 4 | Stress Test & Edge Cases | Challenger empirical verification | M3 | DONE |
| 5 | Forensic Audit | Forensic Auditor integrity verification | M4 | DONE |

## Interface Contracts
### `detective.py` CLI
- `python scripts/detective.py --target-dir <path>`
- `python scripts/detective.py --read-db`
- `python scripts/detective.py --target-dir <path> --read-db`

### SQLite Table: `vectors` in `data/myos_vector_store.db`
- Columns: `id` (PRIMARY KEY), `type` (TEXT), `timestamp` (TEXT), `text` (TEXT), `embedding` (BLOB)

## Code Layout
- `scripts/detective.py`
- `scripts/verify_detective.py`
- `data/myos_vector_store.db`
