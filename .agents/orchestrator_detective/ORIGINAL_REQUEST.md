# Original User Request

## 2026-07-22T16:41:48Z

Build a Python script (`detective.py`) that acts as an autonomous film-noir "Digital Detective". It crawls the user's filesystem in chunks, reads file contents, uses a local `gemma4:latest` LLM to summarize/understand the files while narrating its thoughts in a hard-boiled detective persona, and saves its case notes into an existing SQLite database (`data/myos_vector_store.db`).

Working directory: `C:\Users\zakde\Desktop\AntiGravity projects\MyOS\scripts`
Integrity mode: benchmark

## Requirements

### R1. Command Line Interface
The script must expose CLI arguments to control its investigation. It must support `--target-dir <path>` to scan a specific folder and its files, and `--read-db` to read entries from the SQLite DB so it can "study" past cases.

### R2. Persona & Generative Summarization
The script must call the local Ollama API (`http://localhost:11434/api/generate`) using the `gemma4:latest` model. It must inject a system prompt that forces the model into a film-noir detective persona. The model should output a dramatic "case note" summarizing the file or database entry it was fed.

### R3. Embedding & Database Storage
After generating the case note, the script must generate an embedding for that note by calling the local Ollama embeddings API (`http://localhost:11434/api/embeddings`) using the `mxbai-embed-large:latest` model. It must then insert a new row into `data/myos_vector_store.db` (table: `vectors`) containing an ID, type ('detective_note'), timestamp, the case note text, and the embedding packed as a binary blob of floats.

## Acceptance Criteria

### Verification Script
- [ ] Create a `verify_detective.py` script that runs `detective.py --target-dir test_folder`.
- [ ] The verification script must assert that a new row with type 'detective_note' was added to `myos_vector_store.db`.
- [ ] The verification script must assert that the inserted embedding blob can be unpacked into a list of floats (matching the dimension output of `mxbai-embed-large:latest`).
