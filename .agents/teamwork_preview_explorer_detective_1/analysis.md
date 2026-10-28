# Digital Detective SQLite Vector Store Schema & Embedding Packing Analysis

**Agent**: Explorer Subagent (`teamwork_preview_explorer_detective_1`)  
**Date**: 2026-07-22  
**Target Database**: `c:\Users\zakde\Desktop\AntiGravity projects\MyOS\data\myos_vector_store.db`  

---

## Executive Summary

This investigation analyzed the SQLite vector database `data/myos_vector_store.db`, its schema structure, column definitions, index layout, real project code references, and exact Python float packing/unpacking mechanisms for 32-bit floating point vector embeddings.

The database `data/myos_vector_store.db` stores pre-computed high-dimensional vector embeddings derived from the 2.88 GB JSON store (`data/myos_vector_store.json`). The database contains a single primary table named `vectors` indexed by `type` and `timestamp`.

---

## 1. SQLite Database Schema Inspection

### 1.1 Database File Details
- **Path**: `c:\Users\zakde\Desktop\AntiGravity projects\MyOS\data\myos_vector_store.db`
- **Primary Table**: `vectors`
- **Origin**: Created and populated by `scripts/migrate_vector_store.py`.

### 1.2 Column Information (`PRAGMA table_info(vectors)`)

| Column Name | SQLite Data Type | Primary Key | Nullable | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `TEXT` | `1` (PRIMARY KEY) | `YES` | 32-character MD5 hash string (e.g. `"24daeaf1398660f4bd64942a98c6f565"`) |
| `type` | `TEXT` | `0` | `YES` | Block category (`"intention"`, `"journal"`, `"fact"`) |
| `timestamp` | `TEXT` | `0` | `YES` | ISO-8601 formatted timestamp string (`"2026-06-28T22:48:57.098309"`) |
| `text` | `TEXT` | `0` | `YES` | Raw transcript context chunk or text summary |
| `embedding` | `BLOB` | `0` | `YES` | Packed binary IEEE 754 32-bit float vector elements |

### 1.3 Table Indexes
- `idx_type`: `CREATE INDEX IF NOT EXISTS idx_type ON vectors(type)`
- `idx_timestamp`: `CREATE INDEX IF NOT EXISTS idx_timestamp ON vectors(timestamp)`

### 1.4 Active Codebase References
1. **`scripts/migrate_vector_store.py`**:
   - Migration utility using `ijson` to parse `data/myos_vector_store.json`.
   - Initializes table and indexes.
   - Packs Python float arrays into binary `BLOB` objects via `struct.pack`.
   - Inserts batches of 5,000 items with `cursor.executemany()`.
2. **`scripts/test_sqlite_vector_store.py`**:
   - Verification script that selects `id, type, timestamp, text, embedding FROM vectors LIMIT 1`.
   - Unpacks binary blob to float vector via `struct.unpack(f'{num_floats}f', embedding_blob)`.
3. **`backend/tools/search_metadata.py`**:
   - Production keyword search engine querying `SELECT id, type, timestamp, text FROM vectors WHERE LOWER(text) LIKE ... ORDER BY timestamp DESC`.

---

## 2. Canonical DDL Statement (`CREATE TABLE IF NOT EXISTS`)

To ensure complete schema compatibility across migrations and new environments, the canonical SQL DDL statement for the `vectors` table is:

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

### Schema Design Verification
- **`id TEXT PRIMARY KEY`**: Supports string document keys (MD5 hashes, UUIDs, or URI addresses).
- **`type TEXT`**: Supports filtering by node category (`intention`, `journal`, `fact`).
- **`timestamp TEXT`**: Supports chronological range queries and sorting (`ORDER BY timestamp DESC`).
- **`text TEXT`**: Supports full text keyword searching via `LIKE` queries or FTS5 extensions.
- **`embedding BLOB`**: Provides minimal memory footprint ($4 \text{ bytes per dimension}$), storing standard 32-bit float arrays natively as binary blobs.

---

## 3. Python Binary Embedding Packing & Unpacking Syntax Verification

### 3.1 Binary Packing (Python `list[float]` $\rightarrow$ `bytes` BLOB)

#### Method A: Using Standard Library `struct` (Canonical Project Method)
```python
import struct

vec = [0.0123, -0.4567, 0.8901, 0.1122]  # Vector of N float values
num_floats = len(vec)

# Pack floats as 32-bit IEEE 754 single precision ('f')
embedding_blob = struct.pack(f'{num_floats}f', *vec)
```
- **Byte Size**: $4 \times \text{len}(vec)$ bytes (e.g. 1,536 float dimensions = 6,144 bytes).

#### Method B: Using Standard Library `array`
```python
import array

vec = [0.0123, -0.4567, 0.8901, 0.1122]
embedding_blob = array.array('f', vec).tobytes()
```

#### Method C: Using `numpy` (Numerical Computations)
```python
import numpy as np

vec = [0.0123, -0.4567, 0.8901, 0.1122]
embedding_blob = np.array(vec, dtype=np.float32).tobytes()
```

---

### 3.2 Binary Unpacking (`bytes` BLOB $\rightarrow$ Python `list[float]`)

#### Method A: Using Standard Library `struct` (Used in `scripts/test_sqlite_vector_store.py`)
```python
import struct

# embedding_blob is retrieved from SQLite cursor row[4]
num_floats = len(embedding_blob) // 4
embedding_tuple = struct.unpack(f'{num_floats}f', embedding_blob)
embedding_list = list(embedding_tuple)
```

#### Method B: Using Standard Library `array` (High Performance Pure Python)
```python
import array

# Direct buffer conversion using 'f' type code
embedding_list = array.array('f', embedding_blob).tolist()
```
*Or via explicit `frombytes()`*:
```python
float_arr = array.array('f')
float_arr.frombytes(embedding_blob)
embedding_list = float_arr.tolist()
```

#### Method C: Using `numpy` (Zero-copy array construction)
```python
import numpy as np

embedding_vec = np.frombuffer(embedding_blob, dtype=np.float32)
```

---

## 4. Endianness & Precision Considerations

- **Float Format**: Standard `f` format character uses 32-bit IEEE 754 single precision float (C `float`).
- **Byte Order**: Native system byte order is used by default in `struct.pack(f'{N}f', *vec)`. On standard x86_64 / ARM architectures, this is Little-Endian.
- **Cross-Platform Explicit Endianness**: To guarantee cross-platform binary consistency regardless of hardware architecture, use standard Little-Endian explicit format `'<'`:
  - Pack: `struct.pack(f'<{num_floats}f', *vec)`
  - Unpack: `struct.unpack(f'<{num_floats}f', embedding_blob)`

---

## 5. Summary of Findings

1. **Table Schema**: The `vectors` table exists in `data/myos_vector_store.db` with 5 columns (`id`, `type`, `timestamp`, `text`, `embedding`).
2. **Indexing**: Indexed on `type` and `timestamp` columns.
3. **Data Storage Format**: Vectors are stored as binary byte blobs (`BLOB`), packed at 4 bytes per float.
4. **Syntax Verification**: `struct.unpack(f'{len(blob)//4}f', blob)` and `array.array('f', blob).tolist()` both successfully convert SQLite binary BLOBs back into Python float vectors.
