import sqlite3
import struct

DB_PATH = "data/myos_vector_store.db"

def test_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Get a count
    cursor.execute("SELECT COUNT(*) FROM vectors")
    count = cursor.fetchone()[0]
    print(f"Total rows in DB: {count}")

    # Fetch one row
    cursor.execute("SELECT id, type, timestamp, text, embedding FROM vectors LIMIT 1")
    row = cursor.fetchone()
    if row:
        doc_id, v_type, v_timestamp, v_text, embedding_blob = row
        print(f"ID: {doc_id}")
        print(f"Type: {v_type}")
        print(f"Timestamp: {v_timestamp}")
        print(f"Text Snippet: {v_text[:100]}...")
        
        # Unpack embedding
        num_floats = len(embedding_blob) // 4
        embedding_list = struct.unpack(f'{num_floats}f', embedding_blob)
        print(f"Embedding dimensions: {len(embedding_list)}")
        print(f"First 5 elements: {embedding_list[:5]}")
    
    conn.close()

if __name__ == "__main__":
    test_db()
