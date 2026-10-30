"""
<myos:node>
  <id>node_88b7c06e39df</id>
  <pillar>Self ◉</pillar>
  <file>scripts/tools/semantic_node_injector.py</file>
  <sha256>88b7c06e39dffbe93c871cdf47a248e6b31f9108c51ddcd85be9b1d9b27c47d2</sha256>
  <summary>Core functional substrate module for MyOS Sovereign Engine.</summary>
  <exports>get_embedding, detect_pillar, extract_symbols, extract_summary, generate_inode_banner, process_file</exports>
</myos:node>
"""

#!/usr/bin/env python3
"""
semantic_node_injector.py — MyOS Self-Describing Semantic Inode Generator

Generates cryptographically anchored, self-describing XML metadata banners for source files,
pairs them to primary vector nodes in data/myos_vector_store.db, and enables cross-substrate
file identification without relative path confusion.
"""

import os
import sys
import json
import time
import hashlib
import sqlite3
import re
import urllib.request
import numpy as np

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
DB_PATH = os.path.join(PROJECT_ROOT, "data", "myos_vector_store.db")
OLLAMA_EMBED_URL = "http://localhost:11434/api/embeddings"

PILLAR_MAP = {
    "cortex": "Self ◉",
    "persona": "Self ◉",
    "identity": "Self ◉",
    "bridge": "Logic ∴",
    "engine": "Logic ∴",
    "compiler": "Logic ∴",
    "system": "Logic ∴",
    "sys": "Logic ∴",
    "math": "Logic ∴",
    "soundstage": "Existence ⬡",
    "scene": "Existence ⬡",
    "avatar": "Existence ⬡",
    "sprite": "Existence ⬡",
    "asset": "Existence ⬡",
    "flesh": "Existence ⬡",
    "chibi": "Existence ⬡",
    "golem": "Existence ⬡",
    "journal": "Thought ✧",
    "rag": "Thought ✧",
    "weaver": "Thought ✧",
    "memory": "Thought ✧",
    "docstring": "Improvement ⇈",
    "optimize": "Improvement ⇈",
    "clean": "Improvement ⇈",
    "refactor": "Improvement ⇈",
    "observer": "Mastery ❂",
    "detective": "Mastery ❂",
    "vision": "Mastery ❂",
    "critic": "Mastery ❂",
    "rigger": "Mastery ❂",
    "matrix": "Resonance ∿",
    "vector": "Resonance ∿",
    "embed": "Resonance ∿",
    "telemetry": "Resonance ∿",
    "symbiorithm": "Transcendence ⍟",
    "hypervisor": "Transcendence ⍟",
    "prismos": "Transcendence ⍟",
    "omni": "Omniscience ۞",
    "genome": "Omniscience ۞",
    "nexus": "Omniscience ۞",
    "unity": "Unity ⚭",
    "council": "Unity ⚭",
    "network": "Unity ⚭",
    "swarm": "Unity ⚭",
}

def get_embedding(text):
    try:
        payload = {"model": "mxbai-embed-large:latest", "prompt": text}
        req = urllib.request.Request(
            OLLAMA_EMBED_URL,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return np.array(data["embedding"], dtype=np.float32)
    except Exception:
        # Deterministic fallback vector
        h = hashlib.sha256(text.encode("utf-8")).digest()
        vec = [float((h[i % len(h)] / 127.5) - 1.0) * 0.1 for i in range(1024)]
        return np.array(vec, dtype=np.float32)

def detect_pillar(file_path, content):
    lower_path = file_path.lower().replace("\\", "/")
    for key, pillar in PILLAR_MAP.items():
        if key in lower_path:
            return pillar
    lower_content = content[:1500].lower()
    for key, pillar in PILLAR_MAP.items():
        if key in lower_content:
            return pillar
    return "Logic ∴"

def extract_symbols(content, ext):
    exports = []
    if ext in (".ts", ".tsx", ".js", ".jsx"):
        matches = re.findall(r"export\s+(?:default\s+)?(?:const|class|function|type|interface)\s+([a-zA-Z0-9_]+)", content)
        exports.extend(matches)
    elif ext == ".py":
        matches = re.findall(r"^(?:def|class)\s+([a-zA-Z0-9_]+)", content, re.MULTILINE)
        exports.extend([m for m in matches if not m.startswith("_")])
    return exports[:8]

def extract_summary(content, ext):
    # Check if docstring or top comment already exists
    if ext == ".py":
        doc_match = re.search(r'^[ \t]*"""([\s\S]*?)"""', content.strip())
        if doc_match:
            lines = [l.strip() for l in doc_match.group(1).splitlines() if l.strip() and not l.strip().startswith("<")]
            if lines:
                return " ".join(lines[:2])
    elif ext in (".ts", ".tsx", ".js", ".jsx"):
        doc_match = re.search(r'/\*\*([\s\S]*?)\*/', content[:1000])
        if doc_match:
            lines = [l.strip().lstrip("*").strip() for l in doc_match.group(1).splitlines() if l.strip() and not l.strip().startswith("<")]
            if lines:
                return " ".join(lines[:2])
    return "Core functional substrate module for MyOS Sovereign Engine."

def generate_inode_banner(file_path, content, node_id, pillar, sha256_hash, summary, exports, ext):
    rel_path = os.path.relpath(file_path, PROJECT_ROOT).replace("\\", "/")
    exports_str = ", ".join(exports) if exports else "None"
    
    xml_block = (
        f"<myos:node>\n"
        f"  <id>{node_id}</id>\n"
        f"  <pillar>{pillar}</pillar>\n"
        f"  <file>{rel_path}</file>\n"
        f"  <sha256>{sha256_hash}</sha256>\n"
        f"  <summary>{summary}</summary>\n"
        f"  <exports>{exports_str}</exports>\n"
        f"</myos:node>"
    )

    if ext in (".ts", ".tsx", ".js", ".jsx"):
        return f"/**\n * {xml_block.replace(chr(10), chr(10) + ' * ')}\n */\n"
    elif ext == ".py":
        return f'"""\n{xml_block}\n"""\n'
    return ""

def process_file(file_path, stamp=False):
    if not os.path.exists(file_path):
        print(f"[-] File not found: {file_path}")
        return None

    ext = os.path.splitext(file_path)[1].lower()
    if ext not in (".py", ".ts", ".tsx", ".js", ".jsx"):
        print(f"[-] Unsupported extension: {ext}")
        return None

    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        raw_content = f.read()

    # Strip existing banner if present to avoid nesting
    clean_content = re.sub(r'/\*\*\s*\*\s*<myos:node>[\s\S]*?</myos:node>\s*\*/\n?', '', raw_content)
    clean_content = re.sub(r'"""\s*<myos:node>[\s\S]*?</myos:node>\s*"""\n?', '', clean_content)

    content_bytes = clean_content.encode("utf-8")
    sha256_hash = hashlib.sha256(content_bytes).hexdigest()
    node_id = f"node_{sha256_hash[:12]}"
    
    pillar = detect_pillar(file_path, clean_content)
    exports = extract_symbols(clean_content, ext)
    summary = extract_summary(clean_content, ext)
    
    rel_path = os.path.relpath(file_path, PROJECT_ROOT).replace("\\", "/")

    # Generate Vector Embedding for Semantic Knowledge Base
    combined_semantic_text = (
        f"[SEMANTIC INODE: {node_id}]\n"
        f"File: {rel_path}\n"
        f"Pillar: {pillar}\n"
        f"Summary: {summary}\n"
        f"Exports: {', '.join(exports)}\n"
        f"SHA-256: {sha256_hash}\n"
    )
    
    print(f"[*] Embedding semantic node {node_id} for {rel_path}...")
    emb = get_embedding(combined_semantic_text)
    
    # Store into SQLite Vector Store
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        now_str = time.strftime("%Y-%m-%d %H:%M:%S")
        c.execute("""
            INSERT OR REPLACE INTO vectors (id, type, timestamp, text, embedding)
            VALUES (?, 'file_inode', ?, ?, ?);
        """, (node_id, now_str, combined_semantic_text, emb.tobytes()))
        conn.commit()
        conn.close()
        print(f"[+] Synced {node_id} into data/myos_vector_store.db (type='file_inode')")
    except Exception as e:
        print(f"[-] SQLite insertion error: {e}")

    # Stamp banner onto physical file if requested
    banner = generate_inode_banner(file_path, clean_content, node_id, pillar, sha256_hash, summary, exports, ext)
    if stamp:
        final_file_content = banner + "\n" + clean_content.lstrip()
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(final_file_content)
        print(f"[+] Stamped living <myos:node> XML banner into {rel_path}")

    return {
        "node_id": node_id,
        "pillar": pillar,
        "file": rel_path,
        "sha256": sha256_hash,
        "exports": exports,
        "summary": summary
    }

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="MyOS Semantic Inode Generator")
    parser.add_argument("file", help="Path to source file")
    parser.add_argument("--stamp", action="store_true", help="Stamp banner directly onto file header")
    args = parser.parse_args()

    res = process_file(args.file, stamp=args.stamp)
    if res:
        print("\nResult:")
        print(json.dumps(res, indent=2))
