#!/usr/bin/env python3
"""
Verification Script for Digital Detective (scripts/detective.py).

Creates a temporary test fixture directory with text and binary files,
invokes detective.py via subprocess, queries the SQLite database (data/myos_vector_store.db),
and asserts vector insertion and binary float embedding unpacking integrity.
"""

import os
import shutil
import sqlite3
import struct
import subprocess
import sys

DB_PATH = "data/myos_vector_store.db"
TEST_DIR = "test_folder"


def setup_test_fixtures():
    """Create test directory with sample text files and a binary file."""
    if os.path.exists(TEST_DIR):
        shutil.rmtree(TEST_DIR)
    os.makedirs(TEST_DIR, exist_ok=True)

    # Sample text file 1
    with open(os.path.join(TEST_DIR, "case_file_alpha.txt"), "w", encoding="utf-8") as f:
        f.write("Clue #101: System access logs reveal unauthorized API calls at 03:00 AM.\n")
        f.write("Target table: vectors. Query type: detective_note.\n")

    # Sample text file 2
    with open(os.path.join(TEST_DIR, "case_file_beta.md"), "w", encoding="utf-8") as f:
        f.write("# Cyber Investigation Report\n")
        f.write("Suspect uploaded encrypted float vector payload into SQLite store.\n")

    # Sample binary file (must be skipped gracefully)
    with open(os.path.join(TEST_DIR, "corrupt_payload.bin"), "wb") as f:
        f.write(b"\x80\xff\x00\xfe\x01\x02\x03\x04\x00\xff")

    print(f"[Verification Setup] Created test fixtures in directory '{TEST_DIR}'.")


def cleanup_test_fixtures():
    """Remove test directory."""
    if os.path.exists(TEST_DIR):
        shutil.rmtree(TEST_DIR, ignore_errors=True)
        print(f"[Verification Cleanup] Removed directory '{TEST_DIR}'.")


def run_verification():
    """Execute end-to-end detective verification test."""
    setup_test_fixtures()
    try:
        # Step 1: Run detective.py --target-dir test_folder --read-db via subprocess
        cmd = [
            sys.executable,
            "scripts/detective.py",
            "--target-dir", TEST_DIR,
            "--read-db",
            "--db-path", DB_PATH
        ]
        print(f"[Verification Test] Executing command: {' '.join(cmd)}")
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        print("[Verification Output] Standard Output:\n" + result.stdout)

        if result.stderr:
            print("[Verification Output] Standard Error:\n" + result.stderr)

        # Step 2: Query database for newly created detective_note row
        assert os.path.exists(DB_PATH), f"ASSERTION FAILED: Database file '{DB_PATH}' does not exist."
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        cursor.execute(
            "SELECT id, type, timestamp, text, embedding FROM vectors WHERE type = 'detective_note' ORDER BY timestamp DESC LIMIT 1"
        )
        row = cursor.fetchone()
        conn.close()

        # Step 3: Assertions on row content
        assert row is not None, "ASSERTION FAILED: No record found with type='detective_note' in vectors table."
        doc_id, v_type, v_timestamp, v_text, embedding_blob = row

        assert v_type == "detective_note", f"ASSERTION FAILED: Expected type 'detective_note', got '{v_type}'"
        assert isinstance(v_text, str) and len(v_text) > 0, "ASSERTION FAILED: Case note text is empty or not string."
        assert isinstance(embedding_blob, bytes) and len(embedding_blob) > 0, "ASSERTION FAILED: Embedding BLOB is empty or not bytes."

        # Step 4: Binary float vector unpacking assertion
        num_floats = len(embedding_blob) // 4
        assert num_floats > 0 and len(embedding_blob) % 4 == 0, f"ASSERTION FAILED: Invalid byte size for float vector ({len(embedding_blob)} bytes)."

        embedding_list = list(struct.unpack(f"{num_floats}f", embedding_blob))
        assert len(embedding_list) == num_floats, f"ASSERTION FAILED: Unpacked {len(embedding_list)} floats, expected {num_floats}."
        assert all(isinstance(x, float) for x in embedding_list), "ASSERTION FAILED: Not all unpacked vector elements are float."

        print("\n" + "=" * 60)
        print("[VERIFICATION SUCCESSFUL]")
        print(f" - Note ID: {doc_id}")
        print(f" - Record Type: {v_type}")
        print(f" - Timestamp: {v_timestamp}")
        print(f" - Case Note Length: {len(v_text)} chars")
        print(f" - Vector Dimensions: {len(embedding_list)} floats ({len(embedding_blob)} bytes)")
        print(f" - Sample Floats (first 5): {embedding_list[:5]}")
        print("=" * 60 + "\n")

    finally:
        cleanup_test_fixtures()


if __name__ == "__main__":
    run_verification()
