#!/usr/bin/env python3
"""
Visual Asset Indexer - Analyzes LPC assets visually using a local VLM (Llava)
and stores semantic metadata and embeddings directly into the MyOS SQLite vector store.
"""

import argparse
import base64
import datetime
import hashlib
import json
import os
import sqlite3
import struct
import urllib.request
import urllib.error
import uuid

def parse_args():
    parser = argparse.ArgumentParser(description="Visual Asset Indexer for MyOS")
    parser.add_argument("--asset-dir", type=str, default="../apps/web/public/assets/lpc", help="Path to assets")
    parser.add_argument("--db-path", type=str, default="../data/myos_vector_store.db", help="Path to SQLite DB")
    parser.add_argument("--ollama-url", type=str, default="http://localhost:11434", help="Ollama API URL")
    parser.add_argument("--vlm-model", type=str, default="llava:latest", help="Vision model (e.g. llava)")
    parser.add_argument("--embed-model", type=str, default="mxbai-embed-large:latest", help="Embedding model")
    parser.add_argument("--limit", type=int, default=0, help="Limit number of processed files for testing")
    return parser.parse_args()

def generate_fallback_embedding(text, dimension=1024):
    seed_hash = hashlib.md5(text.encode("utf-8")).hexdigest()
    seed = int(seed_hash, 16)
    return [((((seed + i * 1013) % 10007) / 10007.0) * 2.0 - 1.0) * 0.05 for i in range(dimension)]

def ollama_embed(ollama_url, embed_model, text):
    endpoint = f"{ollama_url.rstrip('/')}/api/embeddings"
    payload = {"model": embed_model, "prompt": text}
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(endpoint, data=data, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            embedding = json.loads(resp.read().decode("utf-8")).get("embedding", [])
            if embedding and isinstance(embedding, list):
                return embedding
    except Exception as e:
        print(f"Warning: Embedding failed ({e}). Using fallback.")
    return generate_fallback_embedding(text)

def ollama_generate_vision(ollama_url, model, prompt, image_path):
    try:
        with open(image_path, "rb") as f:
            img_b64 = base64.b64encode(f.read()).decode("utf-8")
    except Exception as e:
        print(f"Could not read image {image_path}: {e}")
        return ""
    
    endpoint = f"{ollama_url.rstrip('/')}/api/generate"
    payload = {
        "model": model,
        "prompt": prompt,
        "images": [img_b64],
        "stream": False
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(endpoint, data=data, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            return json.loads(resp.read().decode("utf-8")).get("response", "").strip()
    except Exception as e:
        print(f"Warning: VLM failed for {image_path}: {e}")
        return ""

def init_db(db_path):
    os.makedirs(os.path.dirname(os.path.abspath(db_path)), exist_ok=True)
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS vectors (
            id TEXT PRIMARY KEY,
            type TEXT,
            timestamp TEXT,
            text TEXT,
            embedding BLOB
        );
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_type ON vectors(type);")
    conn.commit()
    return conn

def insert_asset_metadata(conn, asset_path, metadata, embedding_floats):
    cursor = conn.cursor()
    # Check if already indexed
    cursor.execute("SELECT id FROM vectors WHERE type = 'lpc_asset' AND text LIKE ?", (f'%"{asset_path}"%',))
    if cursor.fetchone():
        print(f"Skipping {asset_path}, already indexed.")
        return
        
    doc_id = f"asset_{uuid.uuid4().hex[:12]}"
    timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat()
    embedding_blob = struct.pack(f"{len(embedding_floats)}f", *embedding_floats)

    cursor.execute(
        "INSERT INTO vectors (id, type, timestamp, text, embedding) VALUES (?, ?, ?, ?, ?)",
        (doc_id, "lpc_asset", timestamp, json.dumps(metadata), embedding_blob)
    )
    conn.commit()
    print(f"Indexed {asset_path} -> {doc_id}")

def main():
    args = parse_args()
    if not os.path.exists(args.asset_dir):
        print(f"Asset directory not found: {args.asset_dir}")
        return
        
    conn = init_db(args.db_path)
    
    prompt = "Describe this 2D sprite asset concisely. Focus on what it is (e.g. an orc, a tree, a UI element, a tile, a weapon, a character body, environment prop). Be brief and use keywords to define its category and traits."
    
    count = 0
    for root, dirs, files in os.walk(args.asset_dir):
        for file_name in files:
            if not file_name.endswith('.png'): continue
            if file_name.startswith('._') or '__MACOSX' in root: continue
            
            file_path = os.path.join(root, file_name)
            rel_path = os.path.relpath(file_path, args.asset_dir).replace('\\', '/')
            
            print(f"Analyzing {rel_path}...")
            vision_desc = ollama_generate_vision(args.ollama_url, args.vlm_model, prompt, file_path)
            
            # Use path keywords as fallback/supplement
            path_keywords = rel_path.replace('/', ' ').replace('.png', '').replace('_', ' ')
            combined_text = f"Path: {path_keywords}. Visuals: {vision_desc}"
            
            metadata = {
                "path": rel_path,
                "keywords": path_keywords,
                "visual_description": vision_desc
            }
            
            embedding = ollama_embed(args.ollama_url, args.embed_model, combined_text)
            insert_asset_metadata(conn, rel_path, metadata, embedding)
            
            count += 1
            if args.limit > 0 and count >= args.limit:
                print(f"Reached limit of {args.limit} files.")
                return

    conn.close()
    print("Asset indexing complete.")

if __name__ == "__main__":
    main()
