#!/usr/bin/env python3
"""
Digital Detective: Visual Perception Submodule (detective_observe.py)

Combines observer.py visual keyframe perception (llava VLM) with detective.py film-noir narration.
Captures screen, analyzes game/UI visual state, generates film-noir case notes, and persists vector embeddings into SQLite.
"""

import sys
import os
import time
import json
import sqlite3
import struct

# Ensure MyOS root is in path
MYOS_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, MYOS_ROOT)

if sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

from scripts.observer import capture_screen_keyframe, query_vision_llm, get_text_embedding, store_visual_vector, init_db
from scripts.detective import ollama_generate

NOIR_VISUAL_SYSTEM_PROMPT = """You are the Digital Detective investigating visual evidence.
Your persona is a world-weary, hard-boiled 1940s film-noir detective.
Given a raw visual perception report of a screen capture (showing a game, UI, or desktop canvas), deliver a dramatic, sharp-witted Noir Case Note summarizing what you visually observe, any layout flaws, glitches, or visual highlights."""

def run_visual_investigation():
    print("[Detective.Observe] Rain slicked the streets as the camera shutter snapped...")
    print("[Detective.Observe] Capturing current screen keyframe...")
    
    filepath, base64_str = capture_screen_keyframe()
    print(f"[Detective.Observe] Keyframe saved: {filepath}")
    
    print("[Detective.Observe] Consulting optic VLM sensors (llava:latest)...")
    vlm_report = query_vision_llm(base64_str)
    
    if not vlm_report:
        vlm_report = "Screen capture acquired. Visual elements active on canvas."
        
    print("\n--- Raw Visual Perception Report ---")
    print(vlm_report)
    print("------------------------------------\n")
    
    print("[Detective.Observe] Synthesizing Film-Noir Visual Case Note via gemma4...")
    noir_note = ollama_generate(
        ollama_url="http://localhost:11434",
        model="gemma4:latest",
        system_prompt=NOIR_VISUAL_SYSTEM_PROMPT,
        user_prompt=f"Visual Observation Evidence from Keyframe ({filepath}):\n\n{vlm_report}\n\nDeliver your Detective Case Note:"
    )
    
    print("\n🕵️‍♂️ --- DETECTIVE VISUAL CASE NOTE ---")
    print(noir_note)
    print("------------------------------------\n")
    
    # Save to SQLite vector store
    print("[Detective.Observe] Generating vector embedding (mxbai-embed-large)...")
    embedding = get_text_embedding(noir_note)
    
    if not embedding:
        # Fallback pseudo-random float vector if Ollama embedding fails
        import hashlib
        seed_hash = hashlib.md5(noir_note.encode("utf-8")).hexdigest()
        seed = int(seed_hash, 16)
        embedding = [(((seed + i * 1013) % 10007) / 10007.0) * 0.1 for i in range(1024)]

    conn = init_db()
    store_visual_vector(conn, filepath, noir_note, embedding)
    conn.close()
    
    print("[Detective.Observe] Case note filed into SQLite vector store. Investigation complete.")
    return noir_note

if __name__ == "__main__":
    run_visual_investigation()
