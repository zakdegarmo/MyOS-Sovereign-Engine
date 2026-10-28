#!/usr/bin/env python3
"""
Empirical Stress Test Runner for Digital Detective.
Tests database schema edge cases, vector blob serialization limits, float precision,
and repeated execution idempotency.
"""

import math
import os
import shutil
import sqlite3
import struct
import subprocess
import sys
import time

PROJECT_ROOT = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS"
DETECTIVE_PY = os.path.join(PROJECT_ROOT, "scripts", "detective.py")
VERIFY_PY = os.path.join(PROJECT_ROOT, "scripts", "verify_detective.py")
TEMP_DB_PATH = os.path.join(PROJECT_ROOT, ".agents", "teamwork_preview_challenger_detective_2", "temp_stress.db")
TEMP_FIXTURE_DIR = os.path.join(PROJECT_ROOT, ".agents", "teamwork_preview_challenger_detective_2", "temp_fixture")

sys.path.insert(0, os.path.join(PROJECT_ROOT, "scripts"))
import detective  # import functions directly for unit stress tests

results = {}

def log_test(name, status, details=""):
    results[name] = {"status": status, "details": details}
    print(f"[{'PASS' if status else 'FAIL'}] {name}: {details}")

def cleanup():
    if os.path.exists(TEMP_DB_PATH):
        try:
            os.remove(TEMP_DB_PATH)
        except OSError:
            pass
    if os.path.exists(TEMP_FIXTURE_DIR):
        shutil.rmtree(TEMP_FIXTURE_DIR, ignore_errors=True)

# ---------------------------------------------------------
# Test 1: Successive executions of verify_detective.py
# ---------------------------------------------------------
def test_1_successive_verify_executions():
    print("\n--- Running Test 1: Successive Executions of verify_detective.py ---")
    runs = 5
    success_count = 0
    errors = []

    for i in range(runs):
        cmd = [sys.executable, VERIFY_PY]
        proc = subprocess.run(cmd, capture_output=True, text=True, cwd=PROJECT_ROOT)
        if proc.returncode == 0:
            success_count += 1
        else:
            errors.append(f"Run {i+1} failed with return code {proc.returncode}.\nStderr: {proc.stderr}")

    status = (success_count == runs)
    details = f"Executed verify_detective.py {runs} times. Successes: {success_count}/{runs}."
    if errors:
        details += " Errors: " + "; ".join(errors)
    log_test("Successive verify_detective.py Executions", status, details)

# ---------------------------------------------------------
# Test 2: Database Schema Re-initialization & Idempotency
# ---------------------------------------------------------
def test_2_schema_reinit_idempotency():
    print("\n--- Running Test 2: Schema Re-initialization & Idempotency ---")
    cleanup()
    try:
        # Step 2a: Multi-reinit
        for i in range(20):
            conn = detective.init_db(TEMP_DB_PATH)
            conn.close()
        
        # Step 2b: Verify schema & indexes
        conn = detective.init_db(TEMP_DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute("PRAGMA table_info(vectors)")
        columns = {row[1]: row[2] for row in cursor.fetchall()}
        expected_cols = {"id": "TEXT", "type": "TEXT", "timestamp": "TEXT", "text": "TEXT", "embedding": "BLOB"}
        
        cols_match = all(k in columns for k in expected_cols)

        cursor.execute("PRAGMA index_list(vectors)")
        indexes = {row[1] for row in cursor.fetchall()}
        indexes_match = ("idx_type" in indexes) and ("idx_timestamp" in indexes)

        # Step 2c: Verify insertion pre and post re-init
        detective.insert_detective_note(conn, "Pre note", [0.1, 0.2, 0.3])
        conn.close()

        # Re-init again
        conn2 = detective.init_db(TEMP_DB_PATH)
        notes = detective.read_db_notes(conn2)
        conn2.close()

        data_preserved = (len(notes) == 1 and notes[0][2] == "Pre note")

        status = cols_match and indexes_match and data_preserved
        details = f"Cols match: {cols_match}, Indexes match ({indexes}): {indexes_match}, Data preserved: {data_preserved}"
        log_test("Schema Re-initialization Idempotency", status, details)
    except Exception as e:
        log_test("Schema Re-initialization Idempotency", False, f"Exception: {e}")

# ---------------------------------------------------------
# Test 3: Float Blob Packing/Unpacking Accuracy & Precision
# ---------------------------------------------------------
def test_3_float_blob_accuracy_and_precision():
    print("\n--- Running Test 3: Float Blob Packing/Unpacking Accuracy & Precision ---")
    cleanup()
    conn = detective.init_db(TEMP_DB_PATH)

    subtests = []

    # Test cases: (name, vector)
    test_vectors = [
        ("Standard 1024 vector", detective.generate_fallback_embedding("test", 1024)),
        ("Negative float values", [-0.05, -1.0, -123.456, -0.00001, -3.1415926]),
        ("Near-zero float values", [1e-7, -1e-7, 1e-15, -1e-15, 0.0, -0.0, 1e-38]),
        ("Extreme float values (IEEE 754 boundaries)", [3.402823e+38, -3.402823e+38, 1.175494e-38, -1.175494e-38]),
        ("Varying dimension: 1 float", [0.42]),
        ("Varying dimension: 384 floats", [i * 0.001 for i in range(384)]),
        ("Varying dimension: 4096 floats", [i * -0.0001 for i in range(4096)]),
        ("Zero dimension vector", []),
    ]

    all_passed = True
    subtest_reports = []

    for name, vec in test_vectors:
        try:
            doc_id = detective.insert_detective_note(conn, f"Note for {name}", vec)
            
            cursor = conn.cursor()
            cursor.execute("SELECT embedding FROM vectors WHERE id = ?", (doc_id,))
            blob = cursor.fetchone()[0]

            # Assertion 1: Byte size exact match (4 * len(vec))
            expected_bytes = 4 * len(vec)
            if len(blob) != expected_bytes:
                all_passed = False
                subtest_reports.append(f"{name}: Byte size mismatch (got {len(blob)}, expected {expected_bytes})")
                continue

            # Assertion 2: Unpack precision preservation
            num_floats = len(blob) // 4
            if num_floats > 0:
                unpacked = list(struct.unpack(f"{num_floats}f", blob))
                if len(unpacked) != len(vec):
                    all_passed = False
                    subtest_reports.append(f"{name}: Length mismatch after unpack")
                    continue

                # Check delta per element (struct 'f' is 32-bit single precision float)
                max_delta = 0.0
                for orig, unp in zip(vec, unpacked):
                    if math.isnan(orig) or math.isinf(orig):
                        continue
                    # 32-bit float relative tolerance ~1e-6
                    delta = abs(orig - unp)
                    if delta > max_delta:
                        max_delta = delta
                    
                    # For non-zero floats, check relative error or absolute error for near-zero
                    rel_error = delta / (abs(orig) + 1e-30)
                    if rel_error > 1e-5 and delta > 1e-7:
                        all_passed = False
                        subtest_reports.append(f"{name}: Precision failure for val {orig} -> {unp} (delta={delta}, rel_err={rel_error})")
                        break
                else:
                    subtest_reports.append(f"{name}: OK (max_delta={max_delta:.2e})")
            else:
                subtest_reports.append(f"{name}: OK (empty vector)")
        except Exception as e:
            all_passed = False
            subtest_reports.append(f"{name}: Exception {e}")

    conn.close()
    log_test("Float Blob Accuracy & Precision", all_passed, " | ".join(subtest_reports))

# ---------------------------------------------------------
# Test 4: Binary Blob Corruption & Edge Case Unpacking
# ---------------------------------------------------------
def test_4_binary_blob_corruption_and_edge_cases():
    print("\n--- Running Test 4: Binary Blob Corruption & Edge Cases ---")
    cleanup()
    conn = detective.init_db(TEMP_DB_PATH)

    subtests_passed = True
    reports = []

    # Case 4a: Corrupt blob insertion (odd byte lengths, e.g. 5 bytes, 7 bytes)
    cursor = conn.cursor()
    corrupt_blobs = [
        (b"\x00\x00\x00", 3),  # 3 bytes
        (b"\x00\x00\x00\x00\x00", 5),  # 5 bytes
        (b"\x01\x02\x03\x04\x05\x06\x07", 7),  # 7 bytes
    ]

    for i, (c_blob, c_len) in enumerate(corrupt_blobs):
        c_id = f"corrupt_{i}"
        cursor.execute("INSERT INTO vectors (id, type, timestamp, text, embedding) VALUES (?, 'detective_note', '2026-01-01T00:00:00Z', 'corrupt', ?)", (c_id, c_blob))
        conn.commit()

        cursor.execute("SELECT embedding FROM vectors WHERE id = ?", (c_id,))
        retrieved_blob = cursor.fetchone()[0]

        # Verify unpacking handling
        num_floats = len(retrieved_blob) // 4
        remainder = len(retrieved_blob) % 4
        
        # struct.unpack should raise error if byte length doesn't match format exactly
        raised_struct_error = False
        try:
            struct.unpack(f"{len(retrieved_blob)}f", retrieved_blob)
        except struct.error:
            raised_struct_error = True

        if remainder != 0 and raised_struct_error:
            reports.append(f"Corrupt length {c_len}: Unpack properly raised struct.error due to {remainder} byte remainder.")
        else:
            subtests_passed = False
            reports.append(f"Corrupt length {c_len}: Failed struct.error assertion (raised={raised_struct_error}, remainder={remainder}).")

    # Case 4b: Special values NaN and Infinity
    try:
        special_vec = [float('nan'), float('inf'), float('-inf')]
        doc_id_special = detective.insert_detective_note(conn, "Special Floats", special_vec)
        cursor.execute("SELECT embedding FROM vectors WHERE id = ?", (doc_id_special,))
        blob_special = cursor.fetchone()[0]
        unpacked_special = list(struct.unpack("3f", blob_special))

        is_nan = math.isnan(unpacked_special[0])
        is_pos_inf = math.isinf(unpacked_special[1]) and unpacked_special[1] > 0
        is_neg_inf = math.isinf(unpacked_special[2]) and unpacked_special[2] < 0

        if is_nan and is_pos_inf and is_neg_inf:
            reports.append("Special floats (NaN, +Inf, -Inf): Successfully packed and unpacked.")
        else:
            subtests_passed = False
            reports.append(f"Special floats check failed: {unpacked_special}")
    except Exception as e:
        subtests_passed = False
        reports.append(f"Special floats exception: {e}")

    conn.close()
    log_test("Binary Blob Corruption & Edge Cases", subtests_passed, " | ".join(reports))

# ---------------------------------------------------------
# Test 5: Idempotency & Database Indexing Performance
# ---------------------------------------------------------
def test_5_indexing_and_performance():
    print("\n--- Running Test 5: Database Indexing & Query Performance ---")
    cleanup()
    conn = detective.init_db(TEMP_DB_PATH)
    cursor = conn.cursor()

    # Step 5a: EXPLAIN QUERY PLAN check on read_db_notes query
    query = "SELECT id, timestamp, text FROM vectors WHERE type = 'detective_note' ORDER BY timestamp ASC"
    cursor.execute(f"EXPLAIN QUERY PLAN {query}")
    plan_rows = cursor.fetchall()
    plan_text = " ".join([str(r) for r in plan_rows])

    index_used = ("idx_type" in plan_text) or ("idx_timestamp" in plan_text) or ("USING INDEX" in plan_text)

    # Step 5b: Populate 5,000 records to test performance under load
    print("Inserting 5,000 records to benchmark index performance...")
    dummy_vec = detective.generate_fallback_embedding("benchmark", 1024)
    dummy_blob = struct.pack("1024f", *dummy_vec)

    records = []
    for i in range(5000):
        t_type = "detective_note" if i % 2 == 0 else "other_type"
        records.append((f"id_{i:05d}", t_type, f"2026-07-22T{i//3600:02d}:{(i%3600)//60:02d}:{i%60:02d}Z", f"Text sample {i}", dummy_blob))

    t0_insert = time.perf_counter()
    cursor.executemany("INSERT INTO vectors (id, type, timestamp, text, embedding) VALUES (?, ?, ?, ?, ?)", records)
    conn.commit()
    t_insert = time.perf_counter() - t0_insert

    t0_query = time.perf_counter()
    notes = detective.read_db_notes(conn)
    t_query = time.perf_counter() - t0_query

    conn.close()

    status = (len(notes) == 2500) and (t_query < 0.1)
    details = (
        f"Fetched {len(notes)}/2500 notes in {t_query*1000:.2f} ms. "
        f"5000 inserts in {t_insert:.3f} s. "
        f"Query plan: {plan_text}. Index used: {index_used}."
    )
    log_test("Database Indexing & Query Performance", status, details)

# ---------------------------------------------------------
# Main Executor
# ---------------------------------------------------------
def main():
    print("==========================================================")
    print(" Digital Detective Empirical Stress Test Runner ")
    print("==========================================================")

    test_1_successive_verify_executions()
    test_2_schema_reinit_idempotency()
    test_3_float_blob_accuracy_and_precision()
    test_4_binary_blob_corruption_and_edge_cases()
    test_5_indexing_and_performance()

    cleanup()

    print("\n==========================================================")
    print(" STRESS TEST RESULTS SUMMARY ")
    print("==========================================================")
    all_pass = True
    for test_name, info in results.items():
        res_str = "PASS" if info["status"] else "FAIL"
        if not info["status"]:
            all_pass = False
        print(f"[{res_str}] {test_name}\n   Details: {info['details']}\n")

    overall = "PASS" if all_pass else "FAIL"
    print(f"OVERALL VERDICT: {overall}")
    return 0 if all_pass else 1

if __name__ == "__main__":
    sys.exit(main())
