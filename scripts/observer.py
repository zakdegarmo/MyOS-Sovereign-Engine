import os
import sys
import time
import json
import base64
import struct
import sqlite3
import urllib.request

# Configuration
DB_PATH = "data/myos_vector_store.db"
FRAMES_DIR = "temp_frames"
OLLAMA_URL = "http://localhost:11434"
VISION_MODEL = "llava:latest"
EMBED_MODEL = "mxbai-embed-large:latest"

def ensure_directories():
    os.makedirs("data", exist_ok=True)
    os.makedirs(FRAMES_DIR, exist_ok=True)

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS vectors (
            id TEXT PRIMARY KEY,
            type TEXT NOT NULL,
            timestamp REAL NOT NULL,
            content TEXT NOT NULL,
            embedding BLOB NOT NULL
        )
    """)
    conn.commit()
    return conn

def capture_screen_keyframe() -> tuple[str, str]:
    """
    Captures screen using mss if available, falling back to PIL.ImageGrab.
    Saves frame to temp_frames and returns (filepath, base64_str).
    """
    ensure_directories()
    timestamp_str = time.strftime("%Y%m%d_%H%M%S")
    filepath = os.path.join(FRAMES_DIR, f"frame_{timestamp_str}.jpg")
    
    try:
        from mss import mss
        with mss() as sct:
            monitor = sct.monitors[1] # Primary monitor
            sct_img = sct.grab(monitor)
            from PIL import Image
            img = Image.frombytes("RGB", sct_img.size, sct_img.bgra, "raw", "BGRX")
            img.thumbnail((1280, 720)) # Resize for fast VLM inference
            img.save(filepath, "JPEG", quality=85)
    except Exception:
        from PIL import ImageGrab
        img = ImageGrab.grab()
        img.thumbnail((1280, 720))
        img.save(filepath, "JPEG", quality=85)

    with open(filepath, "rb") as f:
        base64_bytes = base64.b64encode(f.read())
        base64_str = base64_bytes.decode('utf-8')

    return filepath, base64_str

MYOS_VISION_PREPROMPT = """You are the Optic Subconscious for MyOS (an AI-Native Operating System featuring a 3D WebGL Canvas, 10 Ontological Pillars [Self, Thought, Logic, Unity, Existence, Improvement, Mastery, Resonance, Transcendence, Omni], a System HUD, Code Editors, and Terminal Logs).

Analyze this desktop keyframe and return a structured domain report:
DOMAIN_FOCUS: [MyOS 3D Canvas | MyOS Council Panel | Code Editor / IDE | Terminal / Build | Browser / Web]
ACTIVE_COMPONENT: [Specific panel e.g. self.self, thought.thought, Stagecraft, Sprite Laboratory, Telemetry Log, or Code File]
VISUAL_STATE: [Concise description of open windows, 3D biomes, visual elements, or active user actions]
ANOMALIES_AND_ERRORS: [None | Red build errors | Exception tracebacks | UI misalignment]
SEMANTIC_TAGS: [comma-separated tags e.g. myos_3d, self.self, code_edit, error, telemetry]"""

def query_vision_llm(base64_image: str, prompt: str = None) -> str:
    """
    Calls Ollama vision API at http://localhost:11434/api/generate with base64 image and MyOS Domain Pre-Prompt.
    """
    final_prompt = prompt or MYOS_VISION_PREPROMPT
    url = f"{OLLAMA_URL}/api/generate"
    payload = {
        "model": VISION_MODEL,
        "prompt": final_prompt,
        "images": [base64_image],
        "stream": False
    }
    
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            res_data = json.loads(response.read().decode('utf-8'))
            return res_data.get("response", "").strip()
    except Exception as e:
        print(f"[Observer Error] Vision LLM Query failed: {e}")
        return ""

def get_text_embedding(text: str) -> list[float]:
    """
    Calls Ollama embeddings API at http://localhost:11434/api/embeddings.
    """
    url = f"{OLLAMA_URL}/api/embeddings"
    payload = {
        "model": EMBED_MODEL,
        "prompt": text
    }
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    try:
        with urllib.request.urlopen(req) as response:
            res_data = json.loads(response.read().decode('utf-8'))
            return res_data.get("embedding", [])
    except Exception as e:
        print(f"[Observer Error] Embedding generation failed: {e}")
        return []

def store_visual_vector(conn: sqlite3.Connection, image_path: str, summary: str, embedding: list[float]):
    if not summary or not embedding:
        print("[Observer Warning] Empty summary or embedding. Skipping vector storage.")
        return

    node_id = f"visual_{os.path.basename(image_path)}"
    now = time.time()
    
    full_content = f"[VISUAL MEMORY {time.strftime('%Y-%m-%d %H:%M:%S')}]\nImage: {image_path}\nSummary: {summary}"
    blob = struct.pack(f'{len(embedding)}f', *embedding)
    
    cursor = conn.cursor()
    cursor.execute("""
        INSERT OR REPLACE INTO vectors (id, type, timestamp, text, embedding)
        VALUES (?, 'visual_context', ?, ?, ?)
    """, (node_id, str(now), full_content, blob))
    conn.commit()
    print(f"[Observer] Successfully stored visual context node: {node_id}")

def observe_screen(last_base64_hash: str = "") -> tuple[bool, str]:
    """
    Executes one visual observation cycle.
    Returns (did_change, new_hash).
    """
    import hashlib
    conn = init_db()
    try:
        image_path, base64_str = capture_screen_keyframe()
        current_hash = hashlib.md5(base64_str.encode('utf-8')).hexdigest()

        # Frame Delta Filter: Skip heavy VLM inference if screen hasn't changed
        if current_hash == last_base64_hash:
            print(f"[Observer Daemon {time.strftime('%H:%M:%S')}] Screen static. Skipping VLM inference.")
            return False, current_hash

        print(f"\n[Observer Daemon {time.strftime('%H:%M:%S')}] Visual Delta Detected! Synthesizing via {VISION_MODEL}...")
        
        summary = query_vision_llm(base64_str)
        if not summary:
            print("[Observer] Could not generate visual summary.")
            return False, current_hash

        print(f"\n[Visual Summary - {time.strftime('%H:%M:%S')}]:\n{summary}\n")
        print(f"[Observer] Generating vector embedding via {EMBED_MODEL}...")
        embedding = get_text_embedding(summary)
        
        if embedding:
            store_visual_vector(conn, image_path, summary, embedding)
            print(f"[Observer Daemon] Visual memory node recorded on Z-axis temporal timeline.")
            return True, current_hash
        return False, current_hash
    finally:
        conn.close()

def start_loop(interval: int = 5):
    print(f"[Observer Daemon] Starting Persistent Temporal Loop (Heartbeat: {interval}s)... Press Ctrl+C to stop.")
    last_hash = ""
    try:
        while True:
            did_change, last_hash = observe_screen(last_hash)
            time.sleep(interval)
    except KeyboardInterrupt:
        print("\n[Observer Daemon] Persistent Temporal Loop stopped.")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="MyOS Visual Perception Observer Daemon")
    parser.add_argument("--loop", action="store_true", help="Run in persistent continuous observation loop mode")
    parser.add_argument("--interval", type=int, default=5, help="Loop heartbeat interval in seconds (default: 5)")
    args = parser.parse_args()

    if args.loop:
        start_loop(interval=args.interval)
    else:
        observe_screen()
