#!/usr/bin/env python3
"""
Lore Scraper - Forgotten Realms MediaWiki API to Vector DB
Downloads canonical lore from forgottenrealms.fandom.com and embeds it into the MyOS Vector Store.
"""

import argparse
import datetime
import hashlib
import json
import os
import sqlite3
import struct
import urllib.error
import urllib.parse
import urllib.request
import uuid

def parse_args():
    parser = argparse.ArgumentParser(description="Fetch Forgotten Realms lore and embed it.")
    parser.add_argument("--pages", type=str, nargs='+', required=True, help="Wiki page titles to scrape (e.g., Neverwinter Phandalin)")
    parser.add_argument("--db-path", type=str, default="data/myos_vector_store.db", help="Path to SQLite database file.")
    parser.add_argument("--ollama-url", type=str, default="http://localhost:11434", help="Base URL for local Ollama API.")
    parser.add_argument("--embed-model", type=str, default="mxbai-embed-large:latest", help="Ollama model for generating embeddings.")
    return parser.parse_args()

def fetch_wiki_text(page_title):
    """Hits the Fandom MediaWiki API to get the plain text extract of a page."""
    base_url = "https://forgottenrealms.fandom.com/api.php"
    params = {
        "action": "query",
        "prop": "revisions",
        "rvprop": "content",
        "rvslots": "main",
        "titles": page_title,
        "format": "json",
        "redirects": "1"
    }
    url = f"{base_url}?{urllib.parse.urlencode(params)}"
    
    print(f"Fetching lore for: {page_title}...")
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 MyOS/1.0'})
    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            data = json.loads(response.read().decode('utf-8'))
            pages = data.get("query", {}).get("pages", {})
            for page_id, page_data in pages.items():
                if page_id == "-1":
                    print(f"  [!] Page '{page_title}' not found on the wiki.")
                    return None
                
                # Extract the wikitext
                revisions = page_data.get("revisions", [])
                if revisions:
                    slots = revisions[0].get("slots", {})
                    main_slot = slots.get("main", {})
                    # For older wikis, it might just be directly under revisions[0]["*"]
                    return main_slot.get("*", revisions[0].get("*", ""))
                return None
    except Exception as e:
        print(f"  [!] Error fetching wiki page: {e}")
    return None

def ollama_embed(ollama_url, embed_model, text):
    """Call Ollama /api/embeddings endpoint."""
    endpoint = f"{ollama_url.rstrip('/')}/api/embeddings"
    payload = {"model": embed_model, "prompt": text}
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(endpoint, data=data, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            res_json = json.loads(resp.read().decode("utf-8"))
            return res_json.get("embedding", [])
    except Exception as e:
        print(f"  [!] Ollama embed endpoint unreachable ({e}). Using fallback.")
        return generate_fallback_embedding(text)

def generate_fallback_embedding(text, dimension=1024):
    seed_hash = hashlib.md5(text.encode("utf-8")).hexdigest()
    seed = int(seed_hash, 16)
    return [((((seed + i * 1013) % 10007) / 10007.0) * 2.0 - 1.0) * 0.05 for i in range(dimension)]

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
    conn.commit()
    return conn

def insert_lore_node(conn, title, text, embedding_floats):
    cursor = conn.cursor()
    doc_id = f"lore_{uuid.uuid4().hex[:12]}"
    timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat()
    type_name = "lore_node"
    
    # Prepend the title so the LLM context has the location name
    full_text = f"LOCATION: {title}\nLORE: {text}"
    
    embedding_blob = struct.pack(f"{len(embedding_floats)}f", *embedding_floats)
    cursor.execute(
        "INSERT INTO vectors (id, type, timestamp, text, embedding) VALUES (?, ?, ?, ?, ?)",
        (doc_id, type_name, timestamp, full_text, embedding_blob)
    )
    conn.commit()
    print(f"  [+] Inserted lore node {doc_id} for '{title}'.")

def main():
    args = parse_args()
    conn = init_db(args.db_path)

    for page in args.pages:
        text = fetch_wiki_text(page)
        if text:
            # If the text is massive, we might want to chunk it, but for a proof of concept,
            # we'll just embed the first 4000 characters to ensure it fits in context.
            snippet = text[:4000] 
            print(f"  Downloaded {len(text)} chars. Embedding first 4000...")
            embedding = ollama_embed(args.ollama_url, args.embed_model, snippet)
            if embedding:
                insert_lore_node(conn, page, snippet, embedding)

    conn.close()
    print("Scraping complete.")

if __name__ == "__main__":
    main()
