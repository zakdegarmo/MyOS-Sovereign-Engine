#!/usr/bin/env python3
"""
Digital Detective - Autonomous Film-Noir Filesystem Crawler & Vector Store Engine.

Scans text files within target directories or queries existing detective notes
from a local SQLite vector store, generating film-noir case notes via Ollama
and persisting float vector embeddings into SQLite.
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
        description="Digital Detective - Film-Noir Filesystem Crawler & Reflection Engine"
    )
    parser.add_argument(
        "--target-dir",
        type=str,
        default=None,
        help="Path to directory for scanning text files."
    )
    parser.add_argument(
        "--read-db",
        action="store_true",
        default=False,
        help="Query existing detective notes from database and generate reflection summary."
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
        help="Ollama model for film-noir case note generation."
    )
    parser.add_argument(
        "--embed-model",
        type=str,
        default="mxbai-embed-large:latest",
        help="Ollama model for generating text embeddings."
    )
    return parser.parse_args()


def generate_fallback_embedding(text, dimension=1024):
    """Generates a deterministic pseudo-random float vector when offline."""
    seed_hash = hashlib.md5(text.encode("utf-8")).hexdigest()
    seed = int(seed_hash, 16)
    vec = [
        ((((seed + i * 1013) % 10007) / 10007.0) * 2.0 - 1.0) * 0.05
        for i in range(dimension)
    ]
    return vec


def ollama_generate(ollama_url, model, system_prompt, user_prompt):
    """Call Ollama /api/generate endpoint with film-noir persona or fallback if offline."""
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
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, Exception) as e:
        print(f"[Digital Detective] Warning: Ollama generate endpoint unreachable ({e}). Using offline fallback response.")
        snippet = user_prompt[:120].replace("\n", " ")
        return (
            f"[Noir Case Note (Offline Fallback)] Rain beats against the cracked window pane. "
            f"The network endpoint at {ollama_url} went cold, but the evidence remains. "
            f"Subject trace: '{snippet}'..."
        )


def ollama_embed(ollama_url, embed_model, text):
    """Call Ollama /api/embeddings endpoint to extract vector or fallback if offline."""
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
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, Exception) as e:
        print(f"[Digital Detective] Warning: Ollama embed endpoint unreachable ({e}). Using offline fallback vector.")

    return generate_fallback_embedding(text)


def crawl_text_files(target_dir):
    """Recursively scan target_dir for text files, skipping binary and unreadable files."""
    text_files = []
    if not os.path.exists(target_dir):
        print(f"[Digital Detective] Warning: target directory '{target_dir}' does not exist.")
        return text_files

    for root, dirs, files in os.walk(target_dir):
        # Filter out blacklisted directories in-place
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS and not d.startswith('.')]

        for file_name in files:
            file_path = os.path.join(root, file_name)

            # Skip large files (> 2 MB)
            try:
                if os.path.getsize(file_path) > 2 * 1024 * 1024:
                    print(f"[Digital Detective] Skipping large file (>2MB): {file_path}")
                    continue
            except OSError:
                continue

            # Binary detection: check for null bytes in initial sample
            try:
                with open(file_path, "rb") as f:
                    sample = f.read(1024)
                if b"\x00" in sample:
                    print(f"[Digital Detective] Skipping binary file (null byte detected): {file_path}")
                    continue

                # Read as UTF-8 text
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()

                text_files.append((file_path, content))
            except (UnicodeDecodeError, PermissionError, OSError) as e:
                print(f"[Digital Detective] Skipping unreadable file ({type(e).__name__}): {file_path}")
                continue

    return text_files


def init_db(db_path):
    """Ensure SQLite database and vectors table exist with indexes."""
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
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_timestamp ON vectors(timestamp);")
    conn.commit()
    return conn


def insert_detective_note(conn, note_text, embedding_floats):
    """Insert a detective case note and packed binary float embedding blob into SQLite."""
    cursor = conn.cursor()
    doc_id = f"det_{uuid.uuid4().hex[:12]}"
    timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat()
    type_name = "detective_note"

    # Pack vector of floats into binary IEEE 754 float BLOB (4 bytes per float)
    embedding_blob = struct.pack(f"{len(embedding_floats)}f", *embedding_floats)

    cursor.execute(
        "INSERT INTO vectors (id, type, timestamp, text, embedding) VALUES (?, ?, ?, ?, ?)",
        (doc_id, type_name, timestamp, note_text, embedding_blob)
    )
    conn.commit()
    print(f"[Digital Detective] Recorded case note ID: {doc_id} ({len(embedding_floats)} dimensions)")
    return doc_id


def read_db_notes(conn):
    """Query all existing detective notes from database."""
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, timestamp, text FROM vectors WHERE type = 'detective_note' ORDER BY timestamp ASC"
    )
    return cursor.fetchall()


def main():
    args = parse_args()

    if not args.target_dir and not args.read_db:
        print("[Digital Detective] No action specified. Use --target-dir <path> or --read-db.")
        print("Run with --help for detailed usage options.")
        sys.exit(0)

    conn = init_db(args.db_path)

    system_prompt = (
        "You are a cynical, hard-boiled 1940s film-noir detective investigating digital clues "
        "in a neon-lit, rain-soaked cyber metropolis. Narrate your analysis of files and case notes "
        "with sharp metaphors, gritty internal monologues, and dramatic observation. "
        "Keep your case notes concise (1 to 3 paragraphs)."
    )

    if args.target_dir:
        print(f"[Digital Detective] Scanning target directory: {args.target_dir}")
        text_files = crawl_text_files(args.target_dir)
        print(f"[Digital Detective] Found {len(text_files)} readable text file(s).")

        for file_path, content in text_files:
            user_prompt = (
                f"Case File: {file_path}\n"
                f"File Content Snippet:\n---\n{content[:2000]}\n---\n"
                f"Detective Case Note:"
            )
            case_note = ollama_generate(args.ollama_url, args.model, system_prompt, user_prompt)
            embedding = ollama_embed(args.ollama_url, args.embed_model, case_note)
            insert_detective_note(conn, case_note, embedding)

    if args.read_db:
        print("[Digital Detective] Querying existing detective notes for reflection...")
        notes = read_db_notes(conn)
        if not notes:
            print("[Digital Detective] No existing detective notes found in database to reflect upon.")
        else:
            combined_notes = "\n---\n".join([f"[{ts}] {txt}" for _, ts, txt in notes])
            user_prompt = (
                "Subject: Reviewing Past Case Notes\n"
                "Accumulated Case Files:\n---\n"
                f"{combined_notes[:4000]}\n---\n"
                "Detective Synthesis & Master Case Reflection:"
            )
            reflection_note = ollama_generate(args.ollama_url, args.model, system_prompt, user_prompt)
            embedding = ollama_embed(args.ollama_url, args.embed_model, reflection_note)
            insert_detective_note(conn, reflection_note, embedding)

    conn.close()
    print("[Digital Detective] Case investigation complete.")


if __name__ == "__main__":
    main()
