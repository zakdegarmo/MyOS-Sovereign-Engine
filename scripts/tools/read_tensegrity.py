import sqlite3
import json
import sys

sys.stdout.reconfigure(encoding="utf-8")

conn = sqlite3.connect("data/myos_vector_store.db")
row = conn.cursor().execute("SELECT content FROM ancestral_memories WHERE title LIKE '%tensegrity%' LIMIT 1").fetchone()
if row:
    try:
        data = json.loads(row[0])
        chunks = data.get("chunkedPrompt", {}).get("chunks", [])
        for chunk in chunks:
            raw_text = chunk.get("text", "")
            try:
                sub = json.loads(raw_text)
                for item in sub:
                    print(item.get("payload", {}).get("text", ""))
            except:
                print(raw_text)
    except Exception as e:
        print(row[0][:1500])
conn.close()
