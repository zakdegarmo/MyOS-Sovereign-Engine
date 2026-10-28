# Digital Detective Architectural Specification & Implementation Strategy

## 1. Executive Summary & System Overview

The **Digital Detective** system (`scripts/detective.py`) is an autonomous file crawler and analytical engine that operates in a gritty 1940s film-noir persona. It scans text files within target directories or queries past case notes stored in a local SQLite vector store (`data/myos_vector_store.db`). It uses a local Ollama LLM (`gemma4:latest`) to narrate dramatic case notes for inspected content and an embedding model (`mxbai-embed-large:latest`) to vectorize those case notes into binary float blobs stored in SQLite.

`scripts/verify_detective.py` provides end-to-end automated verification by seeding test fixtures, invoking `detective.py` via subprocess, and asserting database row insertion and binary blob float unpacking integrity.

---

## 2. System Architecture & Data Flow

```
[ User CLI ] ---> detective.py (--target-dir / --read-db)
                       |
        +--------------+--------------+
        |                             |
        v                             v
[ Filesystem Crawler ]     [ SQLite DB Reader ]
 (skips binary/hidden)     (type='detective_note')
        |                             |
        +--------------+--------------+
                       |
                       v
            [ Film-Noir Persona Prompt ]
                       |
                       v
         [ Ollama /api/generate ]  (gemma4:latest)
                       |  returns case note text
                       v
        [ Ollama /api/embeddings ] (mxbai-embed-large:latest)
                       |  returns float vector [f32, ...]
                       v
          [ struct.pack -> Blob ]
                       |
                       v
    [ SQLite: data/myos_vector_store.db ] (table: vectors)
```

---

## 3. Detailed Specification: `scripts/detective.py`

### 3.1 Command-Line Interface (`argparse`)

The script must implement CLI parsing using Python's standard `argparse` module:

```python
import argparse

def parse_args():
    parser = argparse.ArgumentParser(
        description="Digital Detective - Film-Noir Filesystem Crawler & Reflection Engine"
    )
    parser.add_argument(
        "--target-dir",
        type=str,
        default=None,
        help="Path to directory for scanning text files."
    )
    parser.add_argument(
        "--read-db",
        action="store_true",
        default=False,
        help="Query existing detective notes from database and generate a reflection summary."
    )
    parser.add_argument(
        "--db-path",
        type=str,
        default="data/myos_vector_store.db",
        help="Path to SQLite database file."
    )
    parser.add_argument(
        "--ollama-url",
        type=str,
        default="http://localhost:11434",
        help="Base URL for local Ollama API."
    )
    parser.add_argument(
        "--model",
        type=str,
        default="gemma4:latest",
        help="Ollama model for film-noir case note generation."
    )
    parser.add_argument(
        "--embed-model",
        type=str,
        default="mxbai-embed-large:latest",
        help="Ollama model for generating text embeddings."
    )
    return parser.parse_args()
```

#### Execution Logic Modes:
1. **Target Directory Mode (`--target-dir <path>`)**:
   - Recursively traverses `<path>`.
   - Opens readable text files, generates individual film-noir case notes, computes embeddings, and saves to DB.
2. **Database Reflection Mode (`--read-db`)**:
   - Queries `data/myos_vector_store.db` for rows with `type = 'detective_note'`.
   - Concatenates retrieved notes into a case digest.
   - Generates an overarching synthesis/reflection case note via Ollama, computes its embedding, and saves to DB.
3. **Combined Mode (`--target-dir <path> --read-db`)**:
   - Runs Target Directory Mode first to inspect files and record new case notes.
   - Immediately follows with Database Reflection Mode to synthesize all accumulated notes including newly created ones.
4. **No Arguments Provided**:
   - Displays CLI `--help` and gracefully exits.

---

### 3.2 Filesystem Traversal & Content Extraction

- **Blacklist Directories**: Skip `.git`, `node_modules`, `__pycache__`, `.venv`, `dist`, `build`, `.agents`.
- **File Discovery**: `os.walk(target_dir)` or `pathlib.Path(target_dir).rglob('*')`.
- **Text File Validation & Binary Handling**:
  - Check file size (e.g. skip files > 2 MB to prevent LLM prompt overflow).
  - Attempt to read initial bytes `b = f.read(1024)`: check for null bytes `b'\x00' in b`. If null bytes exist, skip file as binary.
  - Wrap file read in `try ... except (UnicodeDecodeError, PermissionError, OSError)`:
    - On failure, print standard log: `[Digital Detective] Skipping unreadable/binary file: <path>` and continue gracefully without crashing.

---

### 3.3 Film-Noir Persona & Ollama HTTP Client

#### HTTP Client Strategy
To ensure maximum compatibility and zero external dependencies, use `urllib.request` and `json` (or optional `requests` fallback).

```python
import json
import urllib.request

def ollama_generate(ollama_url, model, system_prompt, user_prompt):
    endpoint = f"{ollama_url.rstrip('/')}/api/generate"
    payload = {
        "model": model,
        "system": system_prompt,
        "prompt": user_prompt,
        "stream": False
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(endpoint, data=data, headers={"Content-Type": "application/json"})
    
    with urllib.request.urlopen(req, timeout=60) as resp:
        res_json = json.loads(resp.read().decode("utf-8"))
        return res_json.get("response", "")

def ollama_embed(ollama_url, embed_model, text):
    endpoint = f"{ollama_url.rstrip('/')}/api/embeddings"
    payload = {
        "model": embed_model,
        "prompt": text
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(endpoint, data=data, headers={"Content-Type": "application/json"})
    
    with urllib.request.urlopen(req, timeout=30) as resp:
        res_json = json.loads(resp.read().decode("utf-8"))
        return res_json.get("embedding", [])
```

#### Film-Noir Prompt Templates
- **System Persona Prompt**:
  ```text
  You are a cynical, hard-boiled 1940s film-noir detective investigating digital clues in a neon-lit, rain-soaked cyber metropolis. 
  Narrate your analysis of files and case notes with sharp metaphors, gritty internal monologues, and dramatic observation. 
  Keep your case notes concise (1 to 3 paragraphs).
  ```

- **File Inspection Prompt**:
  ```text
  Case File: {filepath}
  File Content Snippet:
  ---
  {file_content}
  ---
  Detective Case Note:
  ```

- **Database Reflection Prompt**:
  ```text
  Subject: Reviewing Past Case Notes
  Accumulated Case Files:
  ---
  {case_notes_text}
  ---
  Detective Synthesis & Master Case Reflection:
  ```

---

### 3.4 SQLite Schema & Vector Insertion Logic

- **Database Path**: `data/myos_vector_store.db` (create parent directories if non-existent).
- **Schema**:
  ```sql
  CREATE TABLE IF NOT EXISTS vectors (
      id TEXT PRIMARY KEY,
      type TEXT,
      timestamp TEXT,
      text TEXT,
      embedding BLOB
  );
  CREATE INDEX IF NOT EXISTS idx_type ON vectors(type);
  CREATE INDEX IF NOT EXISTS idx_timestamp ON vectors(timestamp);
  ```
- **Record Construction & Packing**:
  - `id`: `f"det_{uuid.uuid4().hex[:12]}"` or `f"det_{int(time.time() * 1000)}"`
  - `type`: `'detective_note'`
  - `timestamp`: ISO 8601 UTC string (`datetime.datetime.now(datetime.timezone.utc).isoformat()`)
  - `text`: Generated noir case note string
  - `embedding`: Binary blob packed via `struct.pack(f'{len(floats)}f', *floats)`

---

## 4. Detailed Specification: `scripts/verify_detective.py`

### 4.1 Test Setup & Execution Protocol

`verify_detective.py` verifies end-to-end functionality automatically:

1. **Create Isolated Test Directory**:
   - Path: `test_folder` (inside workspace).
   - Seed sample text files:
     - `test_folder/clue1.txt`: `"Clue A: Encrypted payload delivered to staging environment at midnight."`
     - `test_folder/clue2.md`: `"Clue B: Suspect logged in from untrusted IP 192.168.1.105."`
     - `test_folder/binary_sample.bin`: Non-UTF8 byte sequence `b'\x80\xff\xfe\x00\x01\x02'` to verify binary skip logic.

2. **Execute `detective.py` via Subprocess**:
   ```python
   import sys
   import subprocess

   cmd = [
       sys.executable,
       "scripts/detective.py",
       "--target-dir", "test_folder"
   ]
   result = subprocess.run(cmd, check=True, capture_output=True, text=True)
   print("detective.py output:\n", result.stdout)
   ```

3. **Verify Database Entries & Embedding Unpacking**:
   ```python
   import sqlite3
   import struct

   db_path = "data/myos_vector_store.db"
   conn = sqlite3.connect(db_path)
   cursor = conn.cursor()

   cursor.execute(
       "SELECT id, type, timestamp, text, embedding FROM vectors WHERE type = 'detective_note' ORDER BY timestamp DESC LIMIT 1"
   )
   row = cursor.fetchone()

   assert row is not None, "ASSERTION ERROR: No row found with type='detective_note'"
   doc_id, v_type, v_timestamp, v_text, embedding_blob = row

   assert v_type == 'detective_note', f"ASSERTION ERROR: Expected type 'detective_note', got '{v_type}'"
   assert len(v_text) > 0, "ASSERTION ERROR: Case note text is empty"

   num_floats = len(embedding_blob) // 4
   embedding_list = list(struct.unpack(f'{num_floats}f', embedding_blob))

   assert len(embedding_list) > 0, "ASSERTION ERROR: Unpacked embedding array is empty"
   print(f"[Verification Successful] Inserted note ID: {doc_id}, Embedding dimension: {len(embedding_list)}")
   ```

4. **Cleanup**:
   - Clean up `test_folder` in a `finally` block or post-test run.

---

## 5. Architectural Quality Matrix & Layout Compliance

| Component | Target Location | Verification Criteria | Layout Status |
|---|---|---|---|
| Main Script | `scripts/detective.py` | CLI parsing, Ollama client, SQLite blob insertion | Standard Script Location |
| Test Script | `scripts/verify_detective.py` | Fixture setup, subprocess execution, SQLite assertions | Standard Test Location |
| Vector Store DB | `data/myos_vector_store.db` | Schema compliance with `vectors` table | Data Directory |

---
