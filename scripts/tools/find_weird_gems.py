import sqlite3
import sys

sys.stdout.reconfigure(encoding="utf-8")

conn = sqlite3.connect("data/myos_vector_store.db")
c = conn.cursor()

queries = [
    "SELECT id, title, dominant_pillar, substr(content, 1, 500) FROM ancestral_memories WHERE title LIKE '%cyclotrope%' OR content LIKE '%cyclotrope%' LIMIT 3",
    "SELECT id, title, dominant_pillar, substr(content, 1, 500) FROM ancestral_memories WHERE title LIKE '%tensegrity%' LIMIT 3",
    "SELECT id, title, dominant_pillar, substr(content, 1, 500) FROM ancestral_memories WHERE title LIKE '%Dewey%' AND content LIKE '%alchem%' LIMIT 3",
    "SELECT id, title, dominant_pillar, substr(content, 1, 500) FROM ancestral_memories WHERE title LIKE '%quantum%' OR content LIKE '%quantum%' LIMIT 3",
    "SELECT id, title, dominant_pillar, substr(content, 1, 500) FROM ancestral_memories WHERE title LIKE '%synthesize%' AND category = 'philosophical_dialogue' LIMIT 3"
]

for q in queries:
    rows = c.execute(q).fetchall()
    for r in rows:
        print(f"TITLE: {r[1]} [{r[2]}]")
        print(f"CONTENT: {r[3]}")
        print("=" * 60)

conn.close()
