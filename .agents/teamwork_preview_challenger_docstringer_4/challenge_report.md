# Challenge Report: SQLite Vector Persistence & Re-Indexing Idempotency

## Challenge Summary

**Overall risk assessment**: LOW

Empirical testing confirms that SQLite vector persistence and re-indexing idempotency in `docstringer.py` operate correctly under standard workloads. Float vector BLOBs are stored as raw IEEE 754 32-bit float arrays (`struct.pack(f'{len(embedding)}f', *embedding)`) and unpack cleanly with 0 floating-point corruption or NaN/Inf values. Re-indexing the same codebase results in exactly zero row duplication (`INSERT OR REPLACE` mechanism).

However, stress testing revealed potential edge cases in primary key construction and file locking on Windows.

---

## Challenges

### [Medium] Challenge 1: Anonymous Function Primary Key Collision

- **Assumption challenged**: Each indexed construct in a file has a unique `func_name`.
- **Attack scenario**: A JavaScript or TypeScript file contains multiple anonymous arrow functions or anonymous default export functions. `extract_func_name` returns `"<anonymous>"` for all anonymous functions.
- **Blast radius**: The primary key `record_id = f"{rel_path}:<anonymous>"` will cause later anonymous functions in the same file to overwrite earlier anonymous functions during `INSERT OR REPLACE`, losing vector indices and docstrings for all but the last anonymous function.
- **Mitigation**: Include line numbers or AST start byte offsets in `record_id` (e.g., `f"{rel_path}:{func_name}:{node.start_byte}"`).

### [Low] Challenge 2: Windows SQLite DB File Locking on Cleanup

- **Assumption challenged**: SQLite database files can be deleted (`unlink()`) immediately between test runs without process release.
- **Attack scenario**: On Windows OS, if a script opens an SQLite connection without explicit closure before `unlink()`, `PermissionError: [WinError 32]` is raised.
- **Blast radius**: Test harness scripts or cleanup routines crash on Windows if database handles remain lingering or un-garbage-collected.
- **Mitigation**: Wrap SQLite connections in context managers (`with sqlite3.connect(...) as conn:`) and ensure explicit `conn.close()` calls before file unlinking.

### [Low] Challenge 3: Windows vs Posix Path Format Consistency in Primary Keys

- **Assumption challenged**: `rel_path = str(filepath)` produces identical primary keys across platforms.
- **Attack scenario**: Running `docstringer.py` on Windows produces backslashes (`\`) in `record_id` (e.g. `C:\path\to\file.py:func`), whereas running on Linux/macOS or via normalized pathing produces forward slashes (`/`).
- **Blast radius**: Cross-platform database migration or path format changes might cause duplicate rows if primary key string representation varies between OS environments.
- **Mitigation**: Normalize relative file paths using `.as_posix()` (e.g. `Path(filepath).as_posix()`).

---

## Stress Test Results

| Scenario | Expected Behavior | Actual Behavior | Pass/Fail |
|---|---|---|---|
| Run `scripts/verify_docstringer.py` | Python docstrings & TS JSDoc inserted, DB populated, embeddings unpacked | All 7 records created, embeddings unpacked as 1024 floats | **PASS** |
| Run 1 on test directory (6 AST nodes) | Database created with 6 function records | 6 records inserted, 1024-dim float BLOBs verified | **PASS** |
| Run 2 re-indexing on exact same directory | Database row count remains 6 (0 row growth) | Row count = 6 (Delta = 0), primary keys updated | **PASS** |
| Run 3 re-indexing (triple pass) | Database row count remains 6 (0 row growth) | Row count = 6 (Delta = 0) | **PASS** |
| Unpack float vector BLOBs using `struct.unpack(f'{len(blob)//4}f', blob)` | Return exact float tuples without NaNs/Infs | 1024 floats per vector, 0 NaNs, 0 Infs, valid ranges | **PASS** |

---

## Unchallenged Areas

- **Vector similarity search performance & ANN index structure**: Out of scope for docstringer indexing pass (focus was persistence format and idempotency).
- **Large-scale repository scaling (>10,000 files)**: Tested on sample suites with Python and TypeScript functions/classes/interfaces; multi-gigabyte DB stress testing was not performed.
