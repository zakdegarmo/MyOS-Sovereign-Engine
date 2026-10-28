import sqlite3
import sys

sys.stdout.reconfigure(encoding='utf-8')

conn = sqlite3.connect('data/myos_vector_store.db')
c = conn.cursor()

print("Schema of ancestral_memories:")
c.execute("PRAGMA table_info(ancestral_memories);")
for col in c.fetchall():
    print(" ", col)

print("\nSample ancestral_memory:")
c.execute("SELECT id, archive_source, file_path, category, title, timestamp, dominant_pillar FROM ancestral_memories LIMIT 5;")
for row in c.fetchall():
    print(" ", row)

print("\nCategories in ancestral_memories:")
c.execute("SELECT category, count(*) FROM ancestral_memories GROUP BY category;")
for row in c.fetchall():
    print(" ", row)

print("\nArchive sources in ancestral_memories:")
c.execute("SELECT archive_source, count(*) FROM ancestral_memories GROUP BY archive_source;")
for row in c.fetchall():
    print(" ", row)

conn.close()
