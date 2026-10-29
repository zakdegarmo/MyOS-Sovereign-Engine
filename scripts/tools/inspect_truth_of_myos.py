import sqlite3
import os

db_path = 'data/myos_vector_store.db'
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    c.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [r[0] for r in c.fetchall()]
    print('Tables in vector store:', tables)
    for t in tables:
        try:
            c.execute(f"SELECT count(*) FROM {t}")
            print(f"  {t}: {c.fetchone()[0]} rows")
        except Exception as e:
            print(f"  {t}: error {e}")
    conn.close()
else:
    print('No db found at', db_path)
