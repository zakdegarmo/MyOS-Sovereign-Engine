# Digital Detective Architectural Design Handoff Report

## 1. Observation

Direct observations made during codebase inspection:
- **Project Structure**: Workspace `c:\Users\zakde\Desktop\AntiGravity projects\MyOS`. Target scripts are in `scripts/` (`scripts/detective.py` and `scripts/verify_detective.py`). Vector store database is located at `data/myos_vector_store.db`.
- **Database Schema**: Existing SQLite vector store schema defined in `scripts/migrate_vector_store.py:14-20`:
  ```sql
  CREATE TABLE IF NOT EXISTS vectors (
      id TEXT PRIMARY KEY,
      type TEXT,
      timestamp TEXT,
      text TEXT,
      embedding BLOB
  );
  ```
- **Embedding Packing & Unpacking Mechanism**:
  - Packing (`scripts/migrate_vector_store.py:57`): `struct.pack(f'{len(embedding_list)}f', *embedding_list)`
  - Unpacking (`scripts/test_sqlite_vector_store.py:26-27`):
    ```python
    num_floats = len(embedding_blob) // 4
    embedding_list = struct.unpack(f'{num_floats}f', embedding_blob)
    ```
- **Ollama Integration Patterns**: Found in `scripts/python/my_rag.py:42-53` and `my_rag.py:133-138`:
  - API Base: `http://localhost:11434/api`
  - Generation endpoint: `http://localhost:11434/api/generate` with payload `{"model": "gemma4:latest", "prompt": ..., "stream": false}`
  - Embedding endpoint: `http://localhost:11434/api/embeddings` with payload `{"model": "mxbai-embed-large:latest", "prompt": ...}`
- **Original User Request**: `c:\Users\zakde\Desktop\AntiGravity projects\MyOS\.agents\orchestrator_detective\ORIGINAL_REQUEST.md` specifies CLI parameters (`--target-dir`, `--read-db`), film-noir persona requirements, SQLite `type = 'detective_note'` insertion, and `verify_detective.py` test suite.

---

## 2. Logic Chain

1. **Observation**: SQLite database `data/myos_vector_store.db` uses `vectors` table with `id`, `type`, `timestamp`, `text`, and `embedding` columns.
   **Deduction**: `detective.py` must populate `type` as `'detective_note'`, format timestamps in standard ISO 8601 strings, and binary-pack float vectors into `BLOB` using Python `struct.pack`.

2. **Observation**: `--target-dir` scans folders while `--read-db` reads past `type = 'detective_note'` entries from SQLite.
   **Deduction**: Argument parser must accept both options independently or together. When both are supplied, running file scanning first followed by DB reflection allows the reflection prompt to synthesize newly inserted notes alongside existing ones.

3. **Observation**: Directory scanning might encounter non-UTF8 files (binary files, compressed archives, audio/image files).
   **Deduction**: `detective.py` must use standard binary header checks (`b'\x00' in chunk`) and try-except handling for `UnicodeDecodeError` or `OSError` to log skips gracefully without failing execution.

4. **Observation**: `verify_detective.py` requires end-to-end assertion of script execution, DB record insertion, and vector blob decoding.
   **Deduction**: `verify_detective.py` will generate a temporary fixture folder `test_folder` containing sample text and binary files, execute `detective.py --target-dir test_folder` via `subprocess.run`, query `data/myos_vector_store.db` for `type = 'detective_note'`, and decode the float blob with `struct.unpack(f'{num_floats}f', embedding_blob)`.

---

## 3. Caveats

- **Ollama Service Dependency**: `detective.py` relies on a running local Ollama service (`http://localhost:11434`) with models `gemma4:latest` and `mxbai-embed-large:latest`. If Ollama is offline or models are missing, HTTP requests will raise ConnectionError/URLError. Error handling should report Ollama availability clearly.
- **Embedding Vector Dimension**: The vector dimension depends on `mxbai-embed-large:latest` (typically 1024 dimensions). The verification script checks `len(floats) > 0` and matches byte count (`len(blob) == num_floats * 4`).
- **Read-Only Scope**: As an Explorer subagent, code changes were not written to `scripts/detective.py` or `scripts/verify_detective.py` directly; complete design specs have been written to `analysis.md`.

---

## 4. Conclusion

The architectural design for `detective.py` and `verify_detective.py` is fully specified and compliant with all project requirements in `PROJECT.md` and `ORIGINAL_REQUEST.md`. The design covers:
- CLI argument parsing (`--target-dir`, `--read-db`).
- Robust text file crawling and binary skipping.
- Film-noir prompt templating for LLM generation (`gemma4:latest`).
- Ollama vector embedding generation (`mxbai-embed-large:latest`).
- SQLite storage in `data/myos_vector_store.db` with `type = 'detective_note'`.
- Automated E2E verification script (`verify_detective.py`) asserting DB entry presence and vector float blob unpacking.

The specification is detailed in `c:\Users\zakde\Desktop\AntiGravity projects\MyOS\.agents\teamwork_preview_explorer_detective_3\analysis.md`.

---

## 5. Verification Method

To verify the implementation once written by an implementer agent:
1. Run the verification script:
   ```powershell
   python scripts/verify_detective.py
   ```
2. Manually test CLI combinations:
   ```powershell
   python scripts/detective.py --target-dir scripts
   python scripts/detective.py --read-db
   python scripts/detective.py --target-dir scripts --read-db
   ```
3. Inspect database content using SQLite Python standard library:
   ```python
   import sqlite3, struct
   conn = sqlite3.connect("data/myos_vector_store.db")
   c = conn.cursor()
   c.execute("SELECT id, type, text, embedding FROM vectors WHERE type='detective_note' ORDER BY timestamp DESC LIMIT 1")
   row = c.fetchone()
   print("ID:", row[0], "Text:", row[2][:100])
   floats = struct.unpack(f"{len(row[3])//4}f", row[3])
   print("Floats count:", len(floats))
   ```
