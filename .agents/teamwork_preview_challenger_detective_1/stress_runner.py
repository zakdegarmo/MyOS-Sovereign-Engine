#!/usr/bin/env python3
"""
Empirical Stress Test Suite for Digital Detective (scripts/detective.py).
"""

import os
import shutil
import sqlite3
import struct
import subprocess
import sys
import time

PROJECT_ROOT = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS"
DETECTIVE_SCRIPT = os.path.join(PROJECT_ROOT, "scripts", "detective.py")
VERIFY_SCRIPT = os.path.join(PROJECT_ROOT, "scripts", "verify_detective.py")
TEST_WORK_DIR = os.path.join(r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\.agents\teamwork_preview_challenger_detective_1", "stress_fixtures")


def setup_fixtures():
    if os.path.exists(TEST_WORK_DIR):
        shutil.rmtree(TEST_WORK_DIR, ignore_errors=True)
    os.makedirs(TEST_WORK_DIR, exist_ok=True)


def cleanup_fixtures():
    if os.path.exists(TEST_WORK_DIR):
        shutil.rmtree(TEST_WORK_DIR, ignore_errors=True)


def run_cmd(args):
    cmd = [sys.executable, DETECTIVE_SCRIPT] + args
    result = subprocess.run(cmd, capture_output=True, text=True, cwd=PROJECT_ROOT)
    return result


def test_scenario_1_empty_dir():
    print("--- Test Scenario 1: Empty Target Directory ---")
    empty_dir = os.path.join(TEST_WORK_DIR, "empty_dir")
    os.makedirs(empty_dir, exist_ok=True)
    db_path = os.path.join(TEST_WORK_DIR, "s1.db")

    res = run_cmd(["--target-dir", empty_dir, "--db-path", db_path])
    assert res.returncode == 0, f"Expected returncode 0, got {res.returncode}. Stderr: {res.stderr}"
    assert "Found 0 readable text file(s)" in res.stdout, f"Unexpected stdout: {res.stdout}"

    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("SELECT count(*) FROM vectors")
    count = cur.fetchone()[0]
    conn.close()
    assert count == 0, f"Expected 0 records in db, got {count}"
    print("PASS: Empty target directory handled correctly (0 files crawled, 0 notes stored).")


def test_scenario_2_empty_and_single_line_files():
    print("--- Test Scenario 2: 0-Byte and 1-Line Text Files ---")
    text_dir = os.path.join(TEST_WORK_DIR, "text_dir")
    os.makedirs(text_dir, exist_ok=True)

    # 0-byte file
    with open(os.path.join(text_dir, "empty.txt"), "w", encoding="utf-8") as f:
        pass

    # 1-line file
    with open(os.path.join(text_dir, "oneline.txt"), "w", encoding="utf-8") as f:
        f.write("A solitary shadow crossed the neon alley.\n")

    db_path = os.path.join(TEST_WORK_DIR, "s2.db")
    res = run_cmd(["--target-dir", text_dir, "--db-path", db_path])
    assert res.returncode == 0, f"Expected returncode 0, got {res.returncode}. Stderr: {res.stderr}"
    assert "Found 2 readable text file(s)" in res.stdout, f"Unexpected stdout: {res.stdout}"

    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("SELECT id, text, embedding FROM vectors")
    rows = cur.fetchall()
    conn.close()
    assert len(rows) == 2, f"Expected 2 records in db, got {len(rows)}"

    for doc_id, text, emb_blob in rows:
        assert len(text) > 0, "Case note text should not be empty"
        num_floats = len(emb_blob) // 4
        assert num_floats == 1024, f"Expected 1024 floats, got {num_floats}"

    print("PASS: 0-byte and 1-line files processed successfully into 1024-dim vectors.")


def test_scenario_3_binary_media_nullbyte():
    print("--- Test Scenario 3: Non-UTF-8 Binary, Media, and Null Byte Files ---")
    bin_dir = os.path.join(TEST_WORK_DIR, "bin_dir")
    os.makedirs(bin_dir, exist_ok=True)

    # Null byte file
    with open(os.path.join(bin_dir, "nulls.dat"), "wb") as f:
        f.write(b"Header text before\x00null byte content")

    # Fake PNG media header (contains null bytes)
    with open(os.path.join(bin_dir, "image.png"), "wb") as f:
        f.write(b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x01\x00")

    # Non-UTF-8 binary without null bytes (Latin-1 / arbitrary high-bit bytes)
    with open(os.path.join(bin_dir, "non_utf8.bin"), "wb") as f:
        f.write(b"\x80\x81\x82\x90\x91\x92\xff\xfe\xfd")

    db_path = os.path.join(TEST_WORK_DIR, "s3.db")
    res = run_cmd(["--target-dir", bin_dir, "--db-path", db_path])
    assert res.returncode == 0, f"Expected returncode 0, got {res.returncode}. Stderr: {res.stderr}"
    assert "Found 0 readable text file(s)" in res.stdout, f"Unexpected stdout: {res.stdout}"
    assert "Skipping binary file" in res.stdout or "Skipping unreadable file" in res.stdout

    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("SELECT count(*) FROM vectors")
    count = cur.fetchone()[0]
    conn.close()
    assert count == 0, f"Expected 0 records in db, got {count}"
    print("PASS: Binary, media, and non-UTF-8 files skipped cleanly without exception.")


def test_scenario_4_blacklisted_folders():
    print("--- Test Scenario 4: Blacklisted and Hidden Directory Exclusion ---")
    root_dir = os.path.join(TEST_WORK_DIR, "blacklist_root")
    os.makedirs(os.path.join(root_dir, ".git"), exist_ok=True)
    os.makedirs(os.path.join(root_dir, "node_modules"), exist_ok=True)
    os.makedirs(os.path.join(root_dir, "__pycache__"), exist_ok=True)
    os.makedirs(os.path.join(root_dir, ".agents"), exist_ok=True)
    os.makedirs(os.path.join(root_dir, "valid_sub"), exist_ok=True)

    with open(os.path.join(root_dir, ".git", "config.txt"), "w") as f:
        f.write("git secret")
    with open(os.path.join(root_dir, "node_modules", "package.txt"), "w") as f:
        f.write("node package secret")
    with open(os.path.join(root_dir, "__pycache__", "compiled.pyc"), "w") as f:
        f.write("pycache secret")
    with open(os.path.join(root_dir, ".agents", "agent.txt"), "w") as f:
        f.write("agent secret")
    with open(os.path.join(root_dir, "valid_sub", "clue.txt"), "w") as f:
        f.write("The real clue is here.")

    db_path = os.path.join(TEST_WORK_DIR, "s4.db")
    res = run_cmd(["--target-dir", root_dir, "--db-path", db_path])
    assert res.returncode == 0, f"Expected returncode 0, got {res.returncode}. Stderr: {res.stderr}"
    assert "Found 1 readable text file(s)" in res.stdout, f"Expected 1 file, got stdout: {res.stdout}"

    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("SELECT count(*) FROM vectors")
    count = cur.fetchone()[0]
    conn.close()
    assert count == 1, f"Expected 1 record in db, got {count}"
    print("PASS: Blacklisted folders (.git, node_modules, __pycache__, .agents) strictly ignored.")


def test_scenario_5_read_db_mode():
    print("--- Test Scenario 5: --read-db on Empty vs Populated Database ---")
    # 5a: empty db
    empty_db = os.path.join(TEST_WORK_DIR, "empty_read.db")
    res_empty = run_cmd(["--read-db", "--db-path", empty_db])
    assert res_empty.returncode == 0, f"Expected 0, got {res_empty.returncode}. Stderr: {res_empty.stderr}"
    assert "No existing detective notes found in database to reflect upon" in res_empty.stdout

    # 5b: populated db
    pop_db = os.path.join(TEST_WORK_DIR, "s2.db") # from scenario 2 which has 2 notes
    res_pop = run_cmd(["--read-db", "--db-path", pop_db])
    assert res_pop.returncode == 0, f"Expected 0, got {res_pop.returncode}. Stderr: {res_pop.stderr}"
    assert "Recorded case note ID:" in res_pop.stdout

    conn = sqlite3.connect(pop_db)
    cur = conn.cursor()
    cur.execute("SELECT count(*) FROM vectors")
    count = cur.fetchone()[0]
    conn.close()
    assert count == 3, f"Expected 3 records in populated db after reflection, got {count}"
    print("PASS: --read-db handles empty DB gracefully and synthesizes populated DB correctly.")


def test_scenario_6_invalid_ollama_url():
    print("--- Test Scenario 6: Invalid Ollama URL & Offline Fallback ---")
    text_dir = os.path.join(TEST_WORK_DIR, "text_dir")
    db_path = os.path.join(TEST_WORK_DIR, "s6_invalid_url.db")

    # Out of range port / unreachable host
    res = run_cmd([
        "--target-dir", text_dir,
        "--db-path", db_path,
        "--ollama-url", "http://localhost:99999"
    ])
    assert res.returncode == 0, f"Expected returncode 0, got {res.returncode}. Stderr: {res.stderr}"
    assert "Warning: Ollama generate endpoint unreachable" in res.stdout
    assert "Warning: Ollama embed endpoint unreachable" in res.stdout

    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("SELECT text, embedding FROM vectors")
    rows = cur.fetchall()
    conn.close()
    assert len(rows) == 2, f"Expected 2 records, got {len(rows)}"

    for text, emb_blob in rows:
        assert "[Noir Case Note (Offline Fallback)]" in text, "Expected fallback text in note"
        num_floats = len(emb_blob) // 4
        assert num_floats == 1024, f"Expected 1024 float fallback vector, got {num_floats}"

    print("PASS: Invalid Ollama URL triggers offline fallback without crashing.")


def test_scenario_7_verify_detective_script():
    print("--- Test Scenario 7: Standard Verification Suite (verify_detective.py) ---")
    cmd = [sys.executable, VERIFY_SCRIPT]
    res = subprocess.run(cmd, capture_output=True, text=True, cwd=PROJECT_ROOT)
    print("verify_detective.py stdout:\n" + res.stdout)
    if res.stderr:
        print("verify_detective.py stderr:\n" + res.stderr)

    assert res.returncode == 0, f"Standard verification failed with exit code {res.returncode}!"
    assert "[VERIFICATION SUCCESSFUL]" in res.stdout, "Verification output missing success banner."
    print("PASS: scripts/verify_detective.py executed with exit code 0.")


def main():
    print("Starting Empirical Stress Testing Suite for Digital Detective...\n")
    setup_fixtures()
    try:
        test_scenario_1_empty_dir()
        test_scenario_2_empty_and_single_line_files()
        test_scenario_3_binary_media_nullbyte()
        test_scenario_4_blacklisted_folders()
        test_scenario_5_read_db_mode()
        test_scenario_6_invalid_ollama_url()
        test_scenario_7_verify_detective_script()
        print("\n==========================================")
        print(" ALL EMPIRICAL STRESS TESTS PASSED SUCCESSFULLY! ")
        print("==========================================\n")
    finally:
        cleanup_fixtures()


if __name__ == "__main__":
    main()
