import os
import sqlite3

def check_db(path):
    print(f"=== Checking {path} ===")
    if not os.path.exists(path):
        print("File does not exist.")
        return
    try:
        conn = sqlite3.connect(path)
        tables = conn.execute("SELECT name, sql FROM sqlite_master WHERE type='table'").fetchall()
        for name, sql in tables:
            print(f"Table: {name}")
            print(f"SQL: {sql}")
            # Get table info / PRAGMA
            pragma = conn.execute(f"PRAGMA table_info('{name}')").fetchall()
            print("Columns:")
            for col in pragma:
                print(f"  {col}")
            print()
        conn.close()
    except Exception as e:
        print(f"Error reading {path}: {e}")

if __name__ == "__main__":
    base = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    check_db(os.path.join(base, "data", "myos_vector_store.db"))
    check_db(os.path.join(base, "data", "myos_code_index.db"))
