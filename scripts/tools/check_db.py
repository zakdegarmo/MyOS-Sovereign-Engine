import sqlite3

conn = sqlite3.connect('data/myos_vector_store.db')
cursor = conn.cursor()
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = cursor.fetchall()
print("Tables:", tables)

for (t,) in tables:
    cursor.execute(f"SELECT count(*) FROM [{t}]")
    cnt = cursor.fetchone()[0]
    print(f"  {t}: {cnt} rows")
    cursor.execute(f"PRAGMA table_info([{t}])")
    cols = [c[1] for c in cursor.fetchall()]
    print(f"    cols: {cols}")
