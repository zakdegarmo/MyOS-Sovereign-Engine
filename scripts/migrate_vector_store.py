import json
import sqlite3
import ijson
import os
import struct
import time

JSON_PATH = "data/myos_vector_store.json"
DB_PATH = "data/myos_vector_store.db"

def init_db(conn):
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS vectors (
            id TEXT PRIMARY KEY,
            type TEXT,
            timestamp TEXT,
            text TEXT,
            embedding BLOB
        )
    ''')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_type ON vectors(type)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_timestamp ON vectors(timestamp)')
    conn.commit()

def migrate():
    if not os.path.exists(JSON_PATH):
        print(f"Error: {JSON_PATH} does not exist.")
        return

    # Delete existing db if it exists for a fresh migration
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)

    conn = sqlite3.connect(DB_PATH)
    init_db(conn)
    cursor = conn.cursor()

    print(f"Starting migration of {JSON_PATH} to SQLite...")
    start_time = time.time()
    
    batch = []
    batch_size = 5000
    total_processed = 0

    try:
        with open(JSON_PATH, "r", encoding="utf-8") as f:
            # ijson.kvitems parses {"key1": {...}, "key2": {...}}
            parser = ijson.kvitems(f, '')
            for doc_id, doc in parser:
                v_type = doc.get("type", "")
                v_timestamp = doc.get("timestamp", "")
                v_text = doc.get("text", "")
                embedding_list = doc.get("embedding", [])
                
                # Pack floats into a binary blob for efficient storage
                embedding_blob = struct.pack(f'{len(embedding_list)}f', *embedding_list)
                
                batch.append((doc_id, v_type, v_timestamp, v_text, embedding_blob))
                
                if len(batch) >= batch_size:
                    cursor.executemany(
                        'INSERT INTO vectors (id, type, timestamp, text, embedding) VALUES (?, ?, ?, ?, ?)',
                        batch
                    )
                    conn.commit()
                    total_processed += len(batch)
                    print(f"Processed {total_processed} items...")
                    batch = []
            
            # Process remaining
            if batch:
                cursor.executemany(
                    'INSERT INTO vectors (id, type, timestamp, text, embedding) VALUES (?, ?, ?, ?, ?)',
                    batch
                )
                conn.commit()
                total_processed += len(batch)

        print(f"Migration completed successfully in {time.time() - start_time:.2f} seconds.")
        print(f"Total items inserted: {total_processed}")

        # DB Vacuum
        print("Vacuuming database to optimize layout...")
        cursor.execute("VACUUM")
        conn.commit()
        print("Done.")

    except Exception as e:
        print(f"Error during migration: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
