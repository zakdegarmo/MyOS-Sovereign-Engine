# Adversarial Challenge Report — SQLite Persistence & Binary BLOB Mechanics

## Challenge Summary

**Overall risk assessment**: HIGH

Empirical testing of `scripts/docstringer.py` confirmed that while binary BLOB vector packing/unpacking and source code docstring retention perform flawlessly, **database re-indexing idempotency is broken**. Primary keys based on file byte offsets (`node.start_byte`) shift after docstring insertion, causing SQLite to insert duplicate stale records on subsequent runs.

---

## Challenges

### [HIGH] Challenge 1: Primary Key Volatility (`node.start_byte`) Causes Duplicate Stale Records on Re-Indexing

- **Assumption challenged**: `docstringer.py` assumes `record_id = f"{rel_path}:{node.start_byte}:{func_name}"` is a stable primary key for SQLite `INSERT OR REPLACE`.
- **Attack scenario**:
  1. Index a codebase where functions lack docstrings (Run 1).
  2. `docstringer.py` auto-generates and inserts docstrings directly into source files.
  3. Re-run `docstringer.py` on the modified codebase (Run 2).
  4. Adding docstring text shifts `node.start_byte` forward for all subsequent AST nodes in the file.
  5. In Run 2, `docstringer.py` generates new `record_id`s with updated byte offsets for the same functions.
  6. `INSERT OR REPLACE INTO functions` matches on `id`. Because `id` changed, SQLite inserts 6 NEW rows instead of replacing existing ones.
- **Blast radius**:
  - Database row count grew from **7 to 13 records** after a single re-index pass.
  - Stale function records pointing to obsolete byte offsets persist indefinitely.
  - Vector searches will return duplicate results and inaccurate line/byte offsets.
- **Mitigation**:
  - Change primary key strategy to stable identifiers (e.g., `f"{rel_path}:{func_name}"` or `f"{rel_path}:{parent_scope}:{func_name}"`).
  - Alternatively, execute `DELETE FROM functions WHERE file_path = ?` prior to re-indexing a file.

---

## Stress Test Results

| Test Scenario | Expected Behavior | Actual Behavior | Pass/Fail |
|---|---|---|---|
| **Binary BLOB Vector Unpacking** | 1024 floats, valid `float32` types, range `[-1.0, 1.0]`, no `NaN`/`Inf` | Unpacked 1024 floats per record (`struct.unpack('1024f', blob)`), values in `[-0.117, 0.228]`, 0 `NaN`/`Inf` | **PASS** |
| **Source File Modification Idempotency** | No duplicate docstring insertions on Run 2 | Source files unchanged (`"""` and JSDoc counts identical between Run 1 and Run 2) | **PASS** |
| **Pre-existing Docstring Retention** | Pre-existing docstrings left untouched | Retained original docstrings without modification across multiple runs | **PASS** |
| **Database Re-Indexing Idempotency** | DB record count remains 7 on re-index | DB record count grew from 7 to 13 records due to `node.start_byte` key shifting | **FAIL** |

---

## Unchallenged Areas

- **Semantic Vector Search**: Out of scope for persistence and indexing mechanics verification.
- **Ollama API Timeout/Error Handling**: Fallback deterministic vector generator was active during tests; live LLM network resiliency was not challenged.
