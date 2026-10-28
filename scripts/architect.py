#!/usr/bin/env python3
"""
Architectural Auditor - Autonomous Filesystem Crawler & Vector Store Engine.

Scans text files within target directories and generates Foundational Architecture Nodes
via Ollama, persisting float vector embeddings into SQLite for the Orchestrator to detect.
"""

import argparse
import datetime
import hashlib
import json
import os
import sqlite3
import struct
import sys
import urllib.error
import urllib.request
import uuid

SKIP_DIRS = {".git", "node_modules", "__pycache__", ".venv", ".agents", "dist", "build"}


def parse_args():
    parser = argparse.ArgumentParser(
        description="Architectural Auditor - Filesystem Crawler & Reflection Engine"
    )
    parser.add_argument(
        "--target-dir",
        type=str,
        default=None,
        help="Path to directory for scanning text files."
    )
    parser.add_argument(
        "--db-path",
        type=str,
        default="data/myos_vector_store.db",
        help="Path to SQLite database file."
    )
    parser.add_argument(
        "--ollama-url",
        type=str,
        default="http://localhost:11434",
        help="Base URL for local Ollama API."
    )
    parser.add_argument(
        "--model",
        type=str,
        default="gemma4:latest",
        help="Ollama model for node generation."
    )
    parser.add_argument(
        "--embed-model",
        type=str,
        default="mxbai-embed-large:latest",
        help="Ollama model for generating text embeddings."
    )
    return parser.parse_args()


def generate_fallback_embedding(text, dimension=1024):
    seed_hash = hashlib.md5(text.encode("utf-8")).hexdigest()
    seed = int(seed_hash, 16)
    vec = [
        ((((seed + i * 1013) % 10007) / 10007.0) * 2.0 - 1.0) * 0.05
        for i in range(dimension)
    ]
    return vec


def ollama_generate(ollama_url, model, system_prompt, user_prompt):
    endpoint = f"{ollama_url.rstrip('/')}/api/generate"
    payload = {
        "model": model,
        "system": system_prompt,
        "prompt": user_prompt,
        "stream": False
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        endpoint, data=data, headers={"Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            res_json = json.loads(resp.read().decode("utf-8"))
            return res_json.get("response", "").strip()
    except Exception as e:
        print(f"[Architectural Auditor] Warning: Ollama generate endpoint unreachable ({e}).")
        return f"[Foundational Architecture Node (Offline)] System scan of {user_prompt[:50]} logged without AI distillation."


def ollama_embed(ollama_url, embed_model, text):
    endpoint = f"{ollama_url.rstrip('/')}/api/embeddings"
    payload = {
        "model": embed_model,
        "prompt": text
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        endpoint, data=data, headers={"Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            res_json = json.loads(resp.read().decode("utf-8"))
            embedding = res_json.get("embedding", [])
            if embedding and isinstance(embedding, list):
                return embedding
    except Exception as e:
        print(f"[Architectural Auditor] Warning: Ollama embed endpoint unreachable ({e}).")
    return generate_fallback_embedding(text)


def crawl_text_files(target_dir):
    text_files = []
    if not os.path.exists(target_dir):
        return text_files

    for root, dirs, files in os.walk(target_dir):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS and not d.startswith('.')]
        for file_name in files:
            file_path = os.path.join(root, file_name)
            try:
                if os.path.getsize(file_path) > 1 * 1024 * 1024:
                    continue
                with open(file_path, "rb") as f:
                    sample = f.read(1024)
                if b"\x00" in sample:
                    continue
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()
                text_files.append((file_path, content))
            except Exception:
                continue
    return text_files


def init_db(db_path):
    db_dir = os.path.dirname(os.path.abspath(db_path))
    if db_dir and not os.path.exists(db_dir):
        os.makedirs(db_dir, exist_ok=True)
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


def insert_architecture_node(conn, node_text, embedding_floats):
    cursor = conn.cursor()
    doc_id = f"arch_{uuid.uuid4().hex[:12]}"
    timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat()
    type_name = "architecture_node"
    
    embedding_blob = struct.pack(f"{len(embedding_floats)}f", *embedding_floats)
    cursor.execute(
        "INSERT INTO vectors (id, type, timestamp, text, embedding) VALUES (?, ?, ?, ?, ?)",
        (doc_id, type_name, timestamp, node_text, embedding_blob)
    )
    conn.commit()
    print(f"[Architectural Auditor] Recorded Architecture Node ID: {doc_id}")
    return doc_id


def main():
    args = parse_args()
    if not args.target_dir:
        print("[Architectural Auditor] No target-dir specified.")
        sys.exit(0)

    conn = init_db(args.db_path)

    system_prompt = (
        "You are a master systems architect analyzing the MyOS (React/TypeScript/Python) codebase. "
        "Distill the following source code into a 'Foundational Architecture Node'. "
        "Describe its exact purpose, what it connects to, and reveal any latent variables or ambiguities "
        "as specifically requested by the Orchestrator. Keep it highly technical, precise, and concise."
    )

    print(f"[Architectural Auditor] Scanning target directory: {args.target_dir}")
    text_files = crawl_text_files(args.target_dir)
    print(f"[Architectural Auditor] Found {len(text_files)} readable text file(s).")

    for file_path, content in text_files:
        if not file_path.endswith(('.ts', '.tsx', '.py', '.js')):
            continue # only audit core code files for this run to save time
            
        user_prompt = (
            f"File: {file_path}\n"
            f"Code Snippet:\n---\n{content[:2500]}\n---\n"
            f"Generate Foundational Architecture Node:"
        )
        print(f"Auditing {file_path}...")
        node = ollama_generate(args.ollama_url, args.model, system_prompt, user_prompt)
        embedding = ollama_embed(args.ollama_url, args.embed_model, node)
        insert_architecture_node(conn, node, embedding)

    conn.close()
    print("[Architectural Auditor] System audit complete. Orchestrator nodes injected.")


if __name__ == "__main__":
    main()
