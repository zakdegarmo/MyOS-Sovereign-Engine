"""
query_kinematic_lexicon.py
Queries data/myos_kinematic_lexicon.db using local Ollama semantic embeddings
to find the best matching embodied action for an AI agent's conversational intent.
Optionally auto-bakes the clip to modular .glb using Blender if not already baked!
"""

import os
import sys
import json
import sqlite3
import struct
import urllib.request
import numpy as np
import subprocess

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

OLLAMA_URL = "http://localhost:11434/api/embeddings"
EMBED_MODEL = "mxbai-embed-large"

def get_query_embedding(prompt):
    payload = json.dumps({"model": EMBED_MODEL, "prompt": f"search_query: {prompt}"}).encode('utf-8')
    req = urllib.request.Request(OLLAMA_URL, data=payload, headers={'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            return np.array(data.get("embedding", []), dtype=np.float32)
    except Exception as e:
        print(f"[ERROR] Ollama embedding failed: {e}", file=sys.stderr)
        return None

def query_actions(prompt, body_mask_filter=None, top_k=5):
    root_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    db_path = os.path.join(root_dir, "data", "myos_kinematic_lexicon.db")
    
    if not os.path.exists(db_path):
        print(f"[ERROR] Kinematic database not found: {db_path}", file=sys.stderr)
        return []

    q_vec = get_query_embedding(prompt)
    if q_vec is None or len(q_vec) == 0:
        return []
    q_norm = np.linalg.norm(q_vec)
    if q_norm > 0:
        q_vec /= q_norm

    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    sql = """
        SELECT a.id, a.clean_title, a.body_mask, a.category, a.raw_fbx_path, a.baked_glb_path, a.intent_description, e.embedding
        FROM kinematic_actions a
        JOIN action_embeddings e ON a.id = e.action_id
    """
    params = []
    if body_mask_filter:
        sql += " WHERE a.body_mask = ? OR a.upper_body_compatible = 1"
        params.append(body_mask_filter)

    cur.execute(sql, params)
    rows = cur.fetchall()
    conn.close()

    if not rows:
        return []

    results = []
    for r in rows:
        action_id, clean_title, body_mask, category, raw_fbx, baked_glb, intent_desc, blob = r
        dim = len(blob) // 4
        vec = np.frombuffer(blob, dtype=np.float32)
        v_norm = np.linalg.norm(vec)
        if v_norm > 0:
            vec = vec / v_norm
        score = float(np.dot(q_vec, vec))
        baked_blend = f"assets/motion_library/baked/{action_id}.blend"
        sheet_filename = f"mannequin_{action_id.lower()}_loop.png"
        sheet_url = f"/actions/{sheet_filename}"
        results.append({
            "id": action_id,
            "title": clean_title,
            "score": round(score, 4),
            "body_mask": body_mask,
            "category": category,
            "raw_fbx": raw_fbx,
            "baked_blend": baked_blend,
            "spritesheet_url": sheet_url,
            "description": intent_desc
        })

    results.sort(key=lambda x: x["score"], reverse=True)
    return results[:top_k]

def ensure_baked_clip(match_item):
    root_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    action_id = match_item["id"]
    baked_blend = os.path.join(root_dir, "assets", "motion_library", "baked", f"{action_id}.blend")
    raw_full = os.path.join(root_dir, match_item["raw_fbx"])
    base_blend = os.path.join(root_dir, "flesh_base_mannequin.blend")
    blender_exe = r"C:\Program Files\Blender Foundation\Blender 5.2\blender.exe"
    script = os.path.join(root_dir, "scripts", "tools", "retarget_and_bake_clips.py")

    if os.path.exists(baked_blend):
        return baked_blend

    if not os.path.exists(raw_full):
        print(f"[WARN] Raw FBX not found: {raw_full}", file=sys.stderr)
        return None

    print(f">> On-demand baking {action_id} to .blend (for 2D filming)...", file=sys.stderr)
    cmd = [
        blender_exe, "-b", base_blend, "-P", script, "--",
        "--fbx", raw_full,
        "--out", baked_blend,
        "--name", action_id
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode == 0 and os.path.exists(baked_blend):
        print(f"[OK] Successfully baked {action_id}.blend!", file=sys.stderr)
        return baked_blend
    else:
        print(f"[ERROR] Baking failed: {res.stderr}", file=sys.stderr)
        return None

def ensure_filmed_spritesheet(match_item, resolution=256):
    root_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    action_id = match_item["id"]
    sheet_rel = os.path.join("apps", "web", "public", "actions", f"mannequin_{action_id.lower()}_loop.png")
    sheet_path = os.path.join(root_dir, sheet_rel)

    if os.path.exists(sheet_path):
        return sheet_path

    baked_blend = ensure_baked_clip(match_item)
    if not baked_blend or not os.path.exists(baked_blend):
        return None

    print(f">> On-demand filming {action_id} to 2D spritesheet ({sheet_rel})...", file=sys.stderr)
    blender_exe = r"C:\Program Files\Blender Foundation\Blender 5.2\blender.exe"
    filmer_script = os.path.join(root_dir, "scripts", "tools", "film_kinematic_spritesheet.py")

    cmd = [
        blender_exe, "-b", baked_blend, "-P", filmer_script, "--",
        "--blend", baked_blend,
        "--out", sheet_path,
        "--res", str(resolution)
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode == 0 and os.path.exists(sheet_path):
        print(f"[OK] Successfully filmed {sheet_rel}!", file=sys.stderr)
        return sheet_path
    else:
        print(f"[ERROR] Filming failed: {res.stderr}", file=sys.stderr)
        return None

if __name__ == "__main__":
    prompt = " ".join(sys.argv[1:]) if len(sys.argv) > 1 else "nodding in agreement"
    print(f"Querying Kinematic Lexicon for: '{prompt}'...")
    matches = query_actions(prompt, top_k=5)
    for i, m in enumerate(matches, 1):
        print(f"{i}. [{m['score']:.4f}] {m['title']} ({m['body_mask']} / {m['category']})")
        print(f"   Desc:        {m['description']}")
        print(f"   Studio:      {m['baked_blend']}")
        print(f"   Spritesheet: {m['spritesheet_url']}")
