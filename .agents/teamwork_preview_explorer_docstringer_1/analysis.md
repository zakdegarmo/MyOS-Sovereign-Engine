# Technical Analysis: `scripts/docstringer.py` and Database Schema

## 1. Executive Summary

`scripts/docstringer.py` is designed to be an automated codebase indexer and docstring generator for MyOS. It traverses a target directory looking for source code files (`.py`, `.js`, `.ts`, `.tsx`), parses them using **Tree-sitter**, extracts function signatures/definitions, generates 1-2 sentence docstrings using a local Ollama LLM (`gemma4:latest`), generates vector embeddings using an Ollama embedding model (`mxbai-embed-large:latest`), and stores the result in a local SQLite database (`data/myos_code_index.db`).

Currently, `scripts/docstringer.py` provides the full infrastructure for DB setup, Ollama HTTP API interaction, and directory crawling, but `process_file()` is a placeholder stub awaiting AST node extraction logic.

---

## 2. Comprehensive Codebase Inspection: `scripts/docstringer.py`

### 2.1 File Information
- **Path**: `C:\Users\zakde\Desktop\AntiGravity projects\MyOS\scripts\docstringer.py`
- **Total Lines**: 98 lines
- **Language**: Python 3

### 2.2 Imports Breakdown

| Import | Category | Purpose in Script |
|---|---|---|
| `import os` | Standard Library | Directory walking (`os.walk`), path manipulation, directory creation |
| `import sys` | Standard Library | System/python environment access |
| `import sqlite3` | Standard Library | Connection and query execution for SQLite database |
| `import argparse` | Standard Library | Parsing `--target-dir` CLI argument |
| `import urllib.request` | Standard Library | HTTP POST requests to Ollama API endpoints |
| `import urllib.error` | Standard Library | Catching HTTP request exceptions |
| `import json` | Standard Library | Serializing payloads and deserializing API responses |
| `import struct` | Standard Library | Present for packing float vectors into binary BLOBs (currently unused in stub) |
| `import datetime` | Standard Library | Present for timestamping database records (currently unused in stub) |
| `from pathlib import Path` | Standard Library | Extracting file extensions (`Path(file).suffix`) |
| `import tree_sitter` | Core Dependency | Universal AST parser framework |
| `import tree_sitter_python` | Tree-Sitter Language | Language grammar binding for Python |
| `import tree_sitter_javascript` | Tree-Sitter Language | Language grammar binding for JavaScript |
| `import tree_sitter_typescript` | Tree-Sitter Language | Language grammar binding for TypeScript/TSX |

### 2.3 Global Variables and Configuration Constants

```python
OLLAMA_GENERATE_URL = "http://localhost:11434/api/generate"
OLLAMA_EMBED_URL    = "http://localhost:11434/api/embeddings"
MODEL_NAME          = "gemma4:latest"
EMBED_MODEL         = "mxbai-embed-large:latest"
DB_FILE             = "data/myos_code_index.db"

# Tree-sitter Parsers
py_parser = tree_sitter.Parser(tree_sitter.Language(tree_sitter_python.language()))
js_parser = tree_sitter.Parser(tree_sitter.Language(tree_sitter_javascript.language()))
ts_parser = tree_sitter.Parser(tree_sitter.Language(tree_sitter_typescript.language_typescript()))
```

### 2.4 Helper Function Documentation

#### 1. `setup_db(db_path)` (Lines 30-45)
- **Signature**: `setup_db(db_path)`
- **Role**: Initializes the SQLite database and ensures table creation.
- **Implementation**:
  - Connects to SQLite at `db_path`.
  - Executes `CREATE TABLE IF NOT EXISTS functions (...)`.
  - Commits transaction and returns `sqlite3.Connection`.

#### 2. `get_embedding(text)` (Lines 47-56)
- **Signature**: `get_embedding(text)`
- **Role**: Communicates with Ollama embeddings endpoint.
- **Implementation**:
  - Constructs JSON payload `{"model": EMBED_MODEL, "prompt": text}`.
  - Issues HTTP POST to `OLLAMA_EMBED_URL`.
  - Returns `data.get('embedding')` (list of floats) or `None` on failure.

#### 3. `generate_docstring(code_snippet)` (Lines 58-68)
- **Signature**: `generate_docstring(code_snippet)`
- **Role**: Communicates with Ollama text generation endpoint.
- **Implementation**:
  - Prompt: `"You are an expert developer. Read this code and output ONLY a concise, 1-2 sentence docstring explaining what it does. Do not include quotes or code blocks. Code:\n{code_snippet}"`
  - Payload: `{"model": MODEL_NAME, "prompt": prompt, "stream": False}`.
  - Issues HTTP POST to `OLLAMA_GENERATE_URL`.
  - Returns stripped `data.get('response', '')` or `""` on failure.

#### 4. `process_file(filepath, conn)` (Lines 70-72)
- **Signature**: `process_file(filepath, conn)`
- **Role**: File processor and AST parser.
- **Status**: **STUB**. Currently only prints `f"Processing {filepath}..."`. Needs implementation for AST extraction, docstring generation, embedding, and SQL insertion.

#### 5. `crawl_directory(target_dir, conn)` (Lines 74-81)
- **Signature**: `crawl_directory(target_dir, conn)`
- **Role**: Recursive directory crawler.
- **Filters**: Excludes directories named `'node_modules'`, `'.git'`, or `'dist'`.
- **Target Extensions**: `{'.py', '.js', '.ts', '.tsx'}`.
- **Action**: Calls `process_file(os.path.join(root, file), conn)` for matching files.

### 2.5 CLI / Main Execution Flow (`main()`, Lines 83-98)
1. CLI Arguments parsed using `argparse`:
   - `--target-dir` (required): Target directory path to scan.
2. DB Path Resolution: `db_path = os.path.join(os.path.dirname(__file__), "..", DB_FILE)` (maps to `<Project_Root>/data/myos_code_index.db`).
3. Parent Directory Creation: `os.makedirs(os.path.dirname(db_path), exist_ok=True)`.
4. Setup Database: Calls `setup_db(db_path)`.
5. Crawl Directory: Calls `crawl_directory(args.target_dir, conn)`.
6. Cleanup: Closes DB connection (`conn.close()`) and prints completion message.

---

## 3. Database Schema Analysis

### 3.1 Table Schema: `functions` (`data/myos_code_index.db`)
Defined in `scripts/docstringer.py`:

```sql
CREATE TABLE IF NOT EXISTS functions (
    id TEXT PRIMARY KEY,
    file_path TEXT,
    func_name TEXT,
    signature TEXT,
    docstring TEXT,
    timestamp TEXT,
    embedding BLOB
)
```

#### Column Details & Constraints

| Column Name | Data Type | Constraint | Description |
|---|---|---|---|
| `id` | `TEXT` | `PRIMARY KEY` | Unique record identifier (e.g., `filepath::func_name` or UUID) |
| `file_path` | `TEXT` | None | Relative or absolute path to source file |
| `func_name` | `TEXT` | None | Function or method identifier name |
| `signature` | `TEXT` | None | Extracted parameter list / type annotations / signature string |
| `docstring` | `TEXT` | None | LLM-generated or existing docstring summary |
| `timestamp` | `TEXT` | None | ISO 8601 string of when the record was indexed |
| `embedding` | `BLOB` | None | Packed binary vector representation (floats packed via `struct.pack`) |

### 3.2 Comparison with Existing Project Database: `data/myos_vector_store.db`
The primary vector store used in MyOS is located at `data/myos_vector_store.db` (populated via `scripts/migrate_vector_store.py`).

#### Table Schema: `vectors` (`data/myos_vector_store.db`)
```sql
CREATE TABLE vectors (
    id TEXT PRIMARY KEY,
    type TEXT,
    timestamp TEXT,
    text TEXT,
    embedding BLOB
);
CREATE INDEX idx_type ON vectors(type);
CREATE INDEX idx_timestamp ON vectors(timestamp);
```

#### Schema Comparison Matrix

| Aspect | `functions` (`myos_code_index.db`) | `vectors` (`myos_vector_store.db`) |
|---|---|---|
| **Primary Key** | `id` (TEXT) | `id` (TEXT) |
| **Code Specific Fields** | `file_path`, `func_name`, `signature`, `docstring` | Generic `type`, `text` |
| **Timestamp** | `timestamp` (TEXT) | `timestamp` (TEXT) |
| **Vector Storage** | `embedding` (BLOB) | `embedding` (BLOB) |
| **Indexes** | None currently defined in script | `idx_type`, `idx_timestamp` |

---

## 4. Current Deficiencies & Implementation Recommendations

1. **Unimplemented `process_file` Stub**:
   - `tree-sitter` parsers are instantiated (`py_parser`, `js_parser`, `ts_parser`) but need node query / traversal logic to locate `function_definition` (Python) or `function_declaration` / `method_definition` / `arrow_function` (JS/TS).
2. **Missing Binary Vector Packing**:
   - `struct` is imported but not yet used to convert float vectors from `get_embedding()` into binary `BLOB` values (`struct.pack(f'{len(vec)}f', *vec)`).
3. **Missing Indexing**:
   - `functions` table currently lacks indexes on `file_path` or `func_name`. Adding `CREATE INDEX IF NOT EXISTS idx_func_filepath ON functions(file_path);` will optimize lookups.
