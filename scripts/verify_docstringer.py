import os
import sys
import shutil
import sqlite3
import struct
import subprocess

TEST_DIR = "scratch/test_docstringer"
DB_PATH = "scratch/test_docstringer/test_code_index.db"

def setup_test_files():
    if os.path.exists(TEST_DIR):
        shutil.rmtree(TEST_DIR)
    os.makedirs(TEST_DIR, exist_ok=True)

    py_file = os.path.join(TEST_DIR, "sample.py")
    with open(py_file, "w", encoding="utf-8") as f:
        f.write('''def calculate_sum(a, b):
    return a + b
''')

    ts_file = os.path.join(TEST_DIR, "sample.ts")
    with open(ts_file, "w", encoding="utf-8") as f:
        f.write('''export function multiply(x: number, y: number): number {
    return x * y;
}
''')

def run_verification():
    setup_test_files()

    cmd = [
        sys.executable,
        "scripts/docstringer.py",
        "--target-dir", TEST_DIR,
        "--db-path", DB_PATH
    ]
    print("Running docstringer.py...")
    res = subprocess.run(cmd, capture_output=True, text=True)
    print("STDOUT:", res.stdout)
    print("STDERR:", res.stderr)

    assert res.returncode == 0, f"Script failed with code {res.returncode}"

    # Check python file modification
    with open(os.path.join(TEST_DIR, "sample.py"), "r", encoding="utf-8") as f:
        py_content = f.read()
    print("Modified Python File:\n", py_content)
    assert '"""' in py_content or "'''" in py_content, "Python docstring missing!"

    # Check TS file modification
    with open(os.path.join(TEST_DIR, "sample.ts"), "r", encoding="utf-8") as f:
        ts_content = f.read()
    print("Modified TS File:\n", ts_content)
    assert "/**" in ts_content or "//" in ts_content or "Summary" in ts_content, "TS docstring missing!"

    # Check SQLite DB
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT id, file_path, func_name, docstring, embedding FROM functions")
    rows = cursor.fetchall()
    print(f"Database rows count: {len(rows)}")
    for r in rows:
        print(f"Row: ID={r[0]}, Func={r[2]}, Docstring={r[3]}")
        blob = r[4]
        if blob:
            floats = struct.unpack(f"{len(blob)//4}f", blob)
            print(f"  Embedding dimension: {len(floats)}")

    assert len(rows) >= 2, "Expected at least 2 database entries!"
    print("\nSUCCESS: /docStringer verification passed clean!")

if __name__ == "__main__":
    run_verification()
