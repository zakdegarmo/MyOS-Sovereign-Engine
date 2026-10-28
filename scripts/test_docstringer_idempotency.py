import os
import sys
import shutil
import sqlite3
import struct
import subprocess
import math
from pathlib import Path

def test_idempotency_and_vectors():
    print("=== Starting Docstringer Re-indexing Idempotency & Vector Verification Test ===")
    project_root = Path(__file__).resolve().parent.parent
    test_dir = project_root / "test_verify_docstringer_idempotency"
    test_db_dir = project_root / "data"
    test_db_path = test_db_dir / "test_verify_docstringer_idempotency.db"
    docstringer_script = project_root / "scripts" / "docstringer.py"

    # Clean up previous test artifacts
    if test_dir.exists():
        shutil.rmtree(test_dir)
    if test_db_path.exists():
        test_db_path.unlink()

    test_dir.mkdir(parents=True, exist_ok=True)
    test_db_dir.mkdir(parents=True, exist_ok=True)

    # 1. Populate test directory with sample Python and TypeScript code
    py_sample = test_dir / "math_utils.py"
    py_sample.write_text(
        "def add_numbers(a: int, b: int) -> int:\n"
        "    return a + b\n\n"
        "class Calculator:\n"
        "    def divide(self, num: float, den: float) -> float:\n"
        "        if den == 0:\n"
        "            raise ValueError('Division by zero')\n"
        "        return num / den\n",
        encoding="utf-8"
    )

    ts_sample = test_dir / "user_service.ts"
    ts_sample.write_text(
        "function formatName(first: string, last: string): string {\n"
        "    return `${first} ${last}`;\n"
        "}\n\n"
        "class UserService {\n"
        "    findUserById(id: string): string {\n"
        "        return `User_${id}`;\n"
        "    }\n"
        "}\n",
        encoding="utf-8"
    )

    cmd = [
        sys.executable,
        str(docstringer_script),
        "--target-dir",
        str(test_dir),
        "--db-path",
        str(test_db_path)
    ]

    # --- FIRST INDEXING PASS ---
    print("\n[PASS 1] Executing docstringer indexing pass 1...")
    res1 = subprocess.run(cmd, capture_output=True, text=True)
    assert res1.returncode == 0, f"Pass 1 failed: {res1.stderr}"
    print("Pass 1 completed successfully.")

    # Inspect DB after Pass 1
    conn = sqlite3.connect(str(test_db_path))
    c = conn.cursor()
    c.execute("SELECT id, file_path, func_name, signature, docstring, timestamp, embedding FROM functions")
    rows1 = c.fetchall()
    conn.close()

    count1 = len(rows1)
    print(f"Pass 1 row count: {count1}")
    assert count1 > 0, "Pass 1 returned 0 rows in database!"

    ids_pass1 = set(r[0] for r in rows1)
    
    # Verify vectors in Pass 1
    print("\n[VECTOR CHECK PASS 1] Unpacking float BLOB vectors...")
    for row in rows1:
        rec_id, file_path, func_name, signature, docstring, timestamp, blob = row
        assert blob is not None and len(blob) > 0, f"BLOB is empty for {rec_id}"
        assert len(blob) % 4 == 0, f"BLOB size {len(blob)} not multiple of 4 bytes"
        
        num_floats = len(blob) // 4
        floats = struct.unpack(f'{num_floats}f', blob)
        assert len(floats) == num_floats, f"Float count mismatch for {rec_id}"
        
        # Verify valid floats (no NaN, Inf, non-zero dimension)
        for i, val in enumerate(floats):
            assert isinstance(val, float), f"Element {i} in {rec_id} is not a float"
            assert not math.isnan(val), f"Element {i} in {rec_id} is NaN"
            assert not math.isinf(val), f"Element {i} in {rec_id} is Inf"
            
        print(f"  Verified {rec_id}: {num_floats} floats, min={min(floats):.4f}, max={max(floats):.4f}, sample={floats[:3]}")

    # --- SECOND INDEXING PASS (RE-INDEXING IDEMPOTENCY TEST) ---
    print("\n[PASS 2] Executing docstringer re-indexing pass 2 (on exact same target & DB)...")
    res2 = subprocess.run(cmd, capture_output=True, text=True)
    assert res2.returncode == 0, f"Pass 2 failed: {res2.stderr}"
    print("Pass 2 completed successfully.")

    # Inspect DB after Pass 2
    conn = sqlite3.connect(str(test_db_path))
    c = conn.cursor()
    c.execute("SELECT id, file_path, func_name, signature, docstring, timestamp, embedding FROM functions")
    rows2 = c.fetchall()
    conn.close()

    count2 = len(rows2)
    print(f"Pass 2 row count: {count2}")
    
    # IDEMPOTENCY ASSERTION: Row count MUST NOT grow or duplicate
    assert count2 == count1, f"IDEMPOTENCY FAILURE! Row count changed from {count1} to {count2} on re-indexing!"
    
    ids_pass2 = set(r[0] for r in rows2)
    assert ids_pass2 == ids_pass1, "ID set mismatch between Pass 1 and Pass 2!"
    
    print("\n[VECTOR CHECK PASS 2] Unpacking float BLOB vectors after re-indexing...")
    for row in rows2:
        rec_id, file_path, func_name, signature, docstring, timestamp, blob = row
        assert blob is not None and len(blob) > 0, f"BLOB is empty for {rec_id} in Pass 2"
        assert len(blob) % 4 == 0, f"BLOB size {len(blob)} not multiple of 4 bytes in Pass 2"
        
        num_floats = len(blob) // 4
        floats = struct.unpack(f'{num_floats}f', blob)
        assert len(floats) == num_floats, f"Float count mismatch for {rec_id} in Pass 2"
        
        for i, val in enumerate(floats):
            assert isinstance(val, float), f"Element {i} in {rec_id} is not float in Pass 2"
            assert not math.isnan(val), f"Element {i} in {rec_id} is NaN in Pass 2"
            assert not math.isinf(val), f"Element {i} in {rec_id} is Inf in Pass 2"
            
        print(f"  Verified {rec_id}: {num_floats} floats, min={min(floats):.4f}, max={max(floats):.4f}, sample={floats[:3]}")

    # --- THIRD INDEXING PASS (TRIPLE IDEMPOTENCY VERIFICATION) ---
    print("\n[PASS 3] Executing docstringer re-indexing pass 3 (triple check)...")
    res3 = subprocess.run(cmd, capture_output=True, text=True)
    assert res3.returncode == 0, f"Pass 3 failed: {res3.stderr}"
    
    conn = sqlite3.connect(str(test_db_path))
    c = conn.cursor()
    c.execute("SELECT COUNT(*) FROM functions")
    count3 = c.fetchone()[0]
    conn.close()
    
    print(f"Pass 3 row count: {count3}")
    assert count3 == count1, f"IDEMPOTENCY FAILURE! Row count changed from {count1} to {count3} on 3rd indexing pass!"

    print("\n=======================================================================")
    print("EMPIRICAL TEST PASSED: Re-indexing idempotency & SQLite vector persistence")
    print(f"- Initial Indexing Row Count: {count1}")
    print(f"- Re-indexing Pass 2 Row Count: {count2} (Delta = 0)")
    print(f"- Re-indexing Pass 3 Row Count: {count3} (Delta = 0)")
    print("- All vector BLOBs unpacked as valid IEEE 754 32-bit floats with 0 NaNs / 0 Infs.")
    print("=======================================================================")
    sys.exit(0)

if __name__ == "__main__":
    test_idempotency_and_vectors()
