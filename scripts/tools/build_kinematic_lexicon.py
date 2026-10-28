"""
build_kinematic_lexicon.py
Scans downloaded Mixamo motion clips in assets/motion_library/raw_fbx/animation_motion/,
classifies them with body_mask (full_body vs upper_only) and categories,
generates semantic intent descriptions, computes 1024-dim local embeddings via Ollama,
and stores them into data/myos_kinematic_lexicon.db.
"""

import os
import sys
import re
import json
import sqlite3
import struct
import urllib.request
import time

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

OLLAMA_URL = "http://localhost:11434/api/embeddings"
EMBED_MODEL = "mxbai-embed-large"

UPPER_ONLY_KEYWORDS = {
    "nod", "shrug", "wave", "cheer", "clap", "pointing", "point", "scratch", "phone",
    "aim", "shoot", "reload", "cast", "drink", "eat", "laugh", "sigh", "yawn",
    "salute", "taunt", "beckon", "talk", "talking", "look", "looking", "head",
    "acknowledge", "acknowledging", "agree", "agreeing", "disagree", "refuse",
    "threaten", "facepalm", "pray", "praying", "applause", "whisper", "cough",
    "blow_kiss", "thumb", "thumbs_up", "yell", "shout", "beg", "begging"
}

CATEGORY_RULES = [
    ("conversational_emote", [
        "agree", "acknowledg", "talk", "laugh", "cheer", "shrug", "wave", "clap",
        "nod", "sigh", "yawn", "salute", "taunt", "facepalm", "point", "bow",
        "cry", "mourn", "plead", "beg", "angry", "screaming", "disagree"
    ]),
    ("combat_melee", [
        "punch", "kick", "sword", "slash", "attack", "block", "parry", "stab",
        "swing", "combo", "jab", "cross", "hook", "uppercut", "strike", "smash",
        "brawl", "fight", "guard", "evade", "dodge"
    ]),
    ("combat_ranged_magic", [
        "shoot", "aim", "reload", "cast", "spell", "bow", "arrow", "gun", "pistol",
        "rifle", "grenade", "throw", "magic", "blast", "channel"
    ]),
    ("utility_interaction", [
        "cpr", "fixing", "pickup", "pick_up", "drop", "carry", "typing", "type",
        "phone", "driving", "drive", "push", "pull", "inspect", "open", "close",
        "lever", "button", "operate", "craft", "drink", "eat"
    ]),
    ("locomotion", [
        "walk", "run", "jog", "sprint", "turn", "strafe", "crawl", "sneak",
        "stumble", "climb", "fall", "jump", "leap", "hop", "roll", "flip",
        "swim", "slide", "tumble", "step"
    ]),
    ("posture_state", [
        "sit", "sitting", "stand", "standing", "kneel", "kneeling", "lay", "laying",
        "idle", "rest", "sleep", "pose", "tpose"
    ])
]

def clean_name(filename):
    base = os.path.splitext(filename)[0]
    # Replace underscores, hyphens with spaces
    words = re.sub(r'[-_.]', ' ', base)
    words = re.sub(r'\s+', ' ', words).strip()
    return base, words

def classify_motion(filename, clean_title):
    lower = clean_title.lower()
    
    # Classify body mask
    is_upper = any(re.search(r'\b' + re.escape(kw) + r'\b', lower) for kw in UPPER_ONLY_KEYWORDS)
    # If the action has explicit movement like "running while talking", check locomotion words
    has_locomotion = any(kw in lower for kw in ["walk", "run", "jog", "sprint", "jump", "kick", "fall", "crawl", "climb"])
    
    if is_upper and not has_locomotion:
        body_mask = "upper_only"
        upper_compatible = 1
    elif is_upper and has_locomotion:
        body_mask = "full_body"
        upper_compatible = 1
    else:
        body_mask = "full_body"
        upper_compatible = 0
        
    # Classify category
    matched_cat = "general_expression"
    for cat, kws in CATEGORY_RULES:
        if any(kw in lower for kw in kws):
            matched_cat = cat
            break
            
    # Formulate semantic intent description
    intent_desc = f"{clean_title}: Character expresses {matched_cat.replace('_', ' ')}. Physical action involving {body_mask.replace('_', ' ')} kinematics."
    if "agree" in lower or "nod" in lower:
        intent_desc += " Conveying affirmation, agreement, or confirmation."
    elif "shrug" in lower or "dismiss" in lower:
        intent_desc += " Conveying indifference, skepticism, casual unconcern, or lack of knowledge."
    elif "cheer" in lower or "clap" in lower or "celebrat" in lower:
        intent_desc += " Conveying excitement, joy, triumph, and victory."
    elif "point" in lower:
        intent_desc += " Drawing visual attention to a specific direction, object, or person."
    elif "fix" in lower or "type" in lower or "inspect" in lower:
        intent_desc += " Engaged in focused technological work, repair, or data operation."
        
    return body_mask, upper_compatible, matched_cat, intent_desc

def get_embedding(text):
    payload = json.dumps({"model": EMBED_MODEL, "prompt": text}).encode('utf-8')
    req = urllib.request.Request(OLLAMA_URL, data=payload, headers={'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            return data.get("embedding", [])
    except Exception as e:
        print(f"[WARN] Failed to get embedding for '{text[:30]}': {e}", file=sys.stderr)
        return []

def init_db(db_path):
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS kinematic_actions (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            clean_title TEXT NOT NULL,
            raw_fbx_path TEXT,
            baked_glb_path TEXT,
            body_mask TEXT NOT NULL,
            upper_body_compatible INTEGER NOT NULL,
            category TEXT NOT NULL,
            intent_description TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS action_embeddings (
            action_id TEXT PRIMARY KEY,
            embedding BLOB NOT NULL,
            dimension INTEGER DEFAULT 1024,
            model TEXT DEFAULT 'mxbai-embed-large',
            FOREIGN KEY(action_id) REFERENCES kinematic_actions(id)
        )
    """)
    conn.commit()
    return conn

def main():
    root_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    motion_dir = os.path.join(root_dir, "assets", "motion_library", "raw_fbx", "animation_motion")
    baked_dir = os.path.join(root_dir, "assets", "motion_library", "baked")
    db_path = os.path.join(root_dir, "data", "myos_kinematic_lexicon.db")
    os.makedirs(baked_dir, exist_ok=True)

    if not os.path.exists(motion_dir):
        print(f"[ERROR] Motion directory not found: {motion_dir}", file=sys.stderr)
        sys.exit(1)

    fbx_files = [f for f in os.listdir(motion_dir) if f.endswith(".fbx")]
    print("=" * 60)
    print(">> MyOS Kinematic Lexicon Builder & Vector Indexer")
    print(f">> Discovered Raw Motion Files: {len(fbx_files)}")
    print(f">> Database: {db_path}")
    print("=" * 60)

    conn = init_db(db_path)
    cur = conn.cursor()

    # Query already indexed actions
    cur.execute("SELECT id FROM kinematic_actions")
    indexed_ids = set(row[0] for row in cur.fetchall())
    print(f"[INFO] Already indexed in database: {len(indexed_ids)}")

    new_records = 0
    start_time = time.time()

    for idx, fname in enumerate(fbx_files, 1):
        action_id, clean_title = clean_name(fname)
        if action_id in indexed_ids:
            continue

        raw_path = os.path.join("assets", "motion_library", "raw_fbx", "animation_motion", fname)
        baked_path = os.path.join("assets", "motion_library", "baked", f"{action_id}.glb")
        
        body_mask, upper_compat, category, intent_desc = classify_motion(fname, clean_title)

        # Get local embedding via Ollama
        vec = get_embedding(f"intent: {intent_desc}")
        if vec:
            blob = struct.pack(f"{len(vec)}f", *vec)
            cur.execute("""
                INSERT OR REPLACE INTO kinematic_actions 
                (id, name, clean_title, raw_fbx_path, baked_glb_path, body_mask, upper_body_compatible, category, intent_description)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (action_id, fname, clean_title, raw_path, baked_path, body_mask, upper_compat, category, intent_desc))

            cur.execute("""
                INSERT OR REPLACE INTO action_embeddings (action_id, embedding, dimension, model)
                VALUES (?, ?, ?, ?)
            """, (action_id, blob, len(vec), EMBED_MODEL))
            
            new_records += 1
            if new_records % 50 == 0:
                conn.commit()
                elapsed = time.time() - start_time
                print(f"[{idx}/{len(fbx_files)}] Indexed {new_records} new actions ({new_records/elapsed:.1f} clips/sec)...")

    conn.commit()
    conn.close()
    print("\n" + "=" * 60)
    print(f"[OK] Kinematic Lexicon indexing complete! Total newly indexed: {new_records}")
    print("=" * 60)

if __name__ == "__main__":
    main()
