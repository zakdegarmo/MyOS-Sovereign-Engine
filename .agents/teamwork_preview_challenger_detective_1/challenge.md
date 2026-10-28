# Adversarial Challenge Report: Digital Detective

## Challenge Summary

**Overall risk assessment**: LOW

All empirical stress test scenarios passed successfully. The `detective.py` engine demonstrates exceptional resilience against unreadable files, blacklisted directory navigation, empty directories, non-UTF-8 binary structures, empty database reads, invalid API endpoints, and offline fallback vector generation. Standard end-to-end verification (`verify_detective.py`) completed cleanly with exit code 0.

## Stress Test Results

| Scenario | Expected Behavior | Actual Behavior | Result |
| --- | --- | --- | --- |
| **Scenario 1: Empty Target Directory** | `--target-dir` points to empty directory. Crawls 0 files, stores 0 vectors, exits 0. | 0 readable text files found, 0 records added to SQLite DB. Exited with code 0. | **PASS** |
| **Scenario 2: 0-Byte & 1-Line Files** | Crawls 0-byte and 1-line UTF-8 text files without throwing exceptions. Generates case notes and 1024-dim float vectors. | Crawled 2 files (`empty.txt`, `oneline.txt`). 2 records stored with 1024-dim unpacked IEEE 754 float vectors. | **PASS** |
| **Scenario 3: Non-UTF-8 & Binary Files** | Gracefully skips files with null bytes, PNG media headers, and non-UTF-8 encodings (e.g. `UnicodeDecodeError`). | Null byte check skipped `nulls.dat` and `image.png`; `UnicodeDecodeError` handler skipped `non_utf8.bin`. 0 files processed. | **PASS** |
| **Scenario 4: Blacklisted Folders** | Skips `.git`, `node_modules`, `__pycache__`, and hidden folders starting with `.`. | Crawled `valid_sub/clue.txt` (1 file). Skipped all blacklisted/hidden subdirectories. | **PASS** |
| **Scenario 5: DB Read Mode (`--read-db`)** | Handles empty database gracefully (prints info message); synthesizes notes when records exist. | Empty DB printed message without error; populated DB synthesized existing notes and appended reflection vector. | **PASS** |
| **Scenario 6: Invalid Ollama URL** | Triggers offline fallback mechanism (`[Noir Case Note (Offline Fallback)]` + deterministic 1024-dim float embedding) without crash when URL is invalid or unreachable. | Printed warning logs; generated fallback note string and 1024-dim deterministic float vector. Exited 0. | **PASS** |
| **Scenario 7: Standard Verification Suite** | `python scripts/verify_detective.py` executes successfully. | Executed `verify_detective.py`, unpacked vector, verified SQLite storage, exit code 0. | **PASS** |

## Challenges & Failure Modes Analysis

### [Low] Challenge 1: Memory Footprint on Extremely Large DB Reads
- **Assumption challenged**: `--read-db` concatenates all past detective notes in `read_db_notes(conn)` into memory.
- **Attack scenario**: If SQLite database contains hundreds of thousands of entries, `SELECT text FROM vectors` and `"\n---\n".join(...)` could cause high memory usage.
- **Blast radius**: Low. `combined_notes[:4000]` limits prompt size to Ollama, but SQL fetch pulls all records into memory (`cursor.fetchall()`).
- **Mitigation**: Add `LIMIT 100` or pagination to `read_db_notes(conn)` if the database grows large in production.

### [Low] Challenge 2: Non-Null Byte Binary / Exotic Encoding Files
- **Assumption challenged**: Binary files are detected via null byte `b"\x00"` in the first 1024 bytes.
- **Attack scenario**: Some binary file formats (or non-UTF-8 encoded text files like Latin-1 or UTF-16 BE) do not contain `\x00` in the first 1024 bytes.
- **Blast radius**: Low. `UnicodeDecodeError` catch block in `crawl_text_files()` successfully catches decoding failures when `open(..., encoding="utf-8")` attempts to read the content.

## Unchallenged Areas

- Real Ollama LLM response accuracy — evaluated offline fallback generation paths.
