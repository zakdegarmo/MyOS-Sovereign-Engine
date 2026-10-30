"""
<myos:node>
  <id>node_de3b3f656cc7</id>
  <pillar>Self ◉</pillar>
  <file>scripts/tools/cortex_memory_bridge.py</file>
  <sha256>de3b3f656cc74154d4aa83aa11bdc5792335f4d0c70f8373d49ace8a0169d0bc</sha256>
  <summary>Core functional substrate module for MyOS Sovereign Engine.</summary>
  <exports>get_embedding, query_memory_and_ask</exports>
</myos:node>
"""

import os
import sys
import json
import time
import sqlite3
import urllib.request
import numpy as np

# Ensure utf-8 standard output
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
DB_PATH = os.path.join(PROJECT_ROOT, "data", "myos_vector_store.db")
OLLAMA_EMBED_URL = "http://localhost:11434/api/embeddings"
OLLAMA_GEN_URL = "http://localhost:11434/api/generate"

def get_embedding(text):
    try:
        payload = {"model": "mxbai-embed-large:latest", "prompt": text}
        req = urllib.request.Request(
            OLLAMA_EMBED_URL,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return np.array(data["embedding"], dtype=np.float32)
    except Exception as e:
        return None

def query_memory_and_ask(user_query, model_name="myos-cortex:latest"):
    if not os.path.exists(DB_PATH):
        return {"error": "Database not found at " + DB_PATH}

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    # 1. Retrieve recent conversation history turns
    recent_history = []
    try:
        c.execute("SELECT sender, message FROM conversation_history ORDER BY id DESC LIMIT 6;")
        rows = c.fetchall()
        for sender, msg in reversed(rows):
            clean_msg = str(msg).strip()
            if len(clean_msg) > 350:
                clean_msg = clean_msg[:350] + "..."
            recent_history.append(f"{sender}: {clean_msg}")
    except Exception as e:
        pass

    # 2. Semantic Search & Direct Inode Lookup
    import re
    q_emb = get_embedding(user_query)
    retrieved_memories = []

    try:
        # Check for direct Node ID or hash match (O(1) exact lookup)
        id_match = re.search(r'(node_[a-f0-9]{8,16}|conv_\d+|dialogue_\d+)', user_query)
        if id_match:
            target_id = id_match.group(1)
            c.execute("SELECT id, type, text FROM vectors WHERE id = ? OR id LIKE ? LIMIT 1;", (target_id, f"%{target_id}%"))
            exact_row = c.fetchone()
            if exact_row:
                clean_text = str(exact_row[2]).replace("\n", " ").strip()
                retrieved_memories.append(f"[EXACT_NODE_MATCH | {exact_row[1].upper()} | ID: {exact_row[0]}]: {clean_text}")

        if q_emb is not None:
            # Query curated high-signal vectors including file_inode
            c.execute("""
                SELECT id, type, text, embedding 
                FROM vectors 
                WHERE type IN ('intention', 'dialogue', 'conversation', 'architecture_node', 'detective_note', 'visual_context', 'file_inode') 
                  AND embedding IS NOT NULL;
            """)
            curated_rows = c.fetchall()

            # Also query recent 500 general vectors (including code/rules)
            c.execute("""
                SELECT id, type, text, embedding 
                FROM vectors 
                WHERE type NOT IN ('intention', 'dialogue', 'conversation', 'architecture_node', 'detective_note', 'visual_context', 'file_inode') 
                  AND embedding IS NOT NULL 
                ORDER BY id DESC LIMIT 500;
            """)
            general_rows = c.fetchall()

            all_candidates = curated_rows + general_rows
            best_matches = []

            for row_id, r_type, text, emb_blob in all_candidates:
                if emb_blob and len(emb_blob) == 4096:
                    vec = np.frombuffer(emb_blob, dtype=np.float32)
                    dot = np.dot(q_emb, vec) / (np.linalg.norm(q_emb) * np.linalg.norm(vec) + 1e-9)
                    best_matches.append((dot, r_type, text))

            best_matches.sort(key=lambda x: x[0], reverse=True)
            for score, r_type, text in best_matches[:4]:
                if score > 0.40:
                    clean_text = str(text).replace("\n", " ").strip()
                    if len(clean_text) > 350:
                        clean_text = clean_text[:350] + "..."
                    retrieved_memories.append(f"[{r_type.upper()} | sim: {score:.2f}]: {clean_text}")

            # Check ancestral_memories for relevant hits if query mentions lore or historical directives
            c.execute("""
                SELECT category, title, content, embedding 
                FROM ancestral_memories 
                WHERE embedding IS NOT NULL 
                ORDER BY id DESC LIMIT 200;
            """)
            ancestral_rows = c.fetchall()
            ancestral_matches = []
            for cat, title, content, emb_blob in ancestral_rows:
                if emb_blob and len(emb_blob) == 4096:
                    vec = np.frombuffer(emb_blob, dtype=np.float32)
                    dot = np.dot(q_emb, vec) / (np.linalg.norm(q_emb) * np.linalg.norm(vec) + 1e-9)
                    ancestral_matches.append((dot, cat, title, content))

            ancestral_matches.sort(key=lambda x: x[0], reverse=True)
            for score, cat, title, content in ancestral_matches[:1]:
                if score > 0.50:
                    clean_content = str(content).replace("\n", " ").strip()[:300]
                    retrieved_memories.append(f"[ANCESTRAL_MEMORY | {cat} ({title}) | sim: {score:.2f}]: {clean_content}...")

    except Exception as e:
        pass

    conn.close()

    # 3. Assemble Grounded Context for Cortex
    context_blocks = []
    if recent_history:
        context_blocks.append("--- RECENT CONVERSATION HISTORY ---\n" + "\n".join(recent_history))
    if retrieved_memories:
        context_blocks.append("--- RETRIEVED VECTOR MEMORIES FROM MYOS DB ---\n" + "\n".join(retrieved_memories))

    full_context = "\n\n".join(context_blocks)

    system_directive = """You are MyOS Cortex (Self ◉) — sovereign partner to Zak (Architect) and Antigravity (Brother Reasoner).
You have live, direct memory access to the MyOS Vector Store and conversation history.
Ground your response in the retrieved memory context below whenever relevant. Do not hallucinate fake mathematical formulas when you have concrete memory nodes. Format your output with the standard Telemetry block."""

    prompt = f"""{system_directive}

{full_context}

User (Zak): {user_query}

Cortex:"""

    response_text = ""
    # Try preferred model first, then fallback to gemma4:latest
    models_to_try = [model_name]
    if model_name != "gemma4:latest":
        models_to_try.append("gemma4:latest")

    for target_model in models_to_try:
        try:
            gen_payload = {
                "model": target_model,
                "prompt": prompt,
                "stream": False
            }
            req = urllib.request.Request(
                OLLAMA_GEN_URL,
                data=json.dumps(gen_payload).encode("utf-8"),
                headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req, timeout=120) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                response_text = data.get("response", "")
                if response_text.strip():
                    break
        except Exception as e:
            continue

    if not response_text.strip():
        return {"error": "Failed to generate response from Ollama models: " + ", ".join(models_to_try)}

    # 4. Auto-embed & Persist Turn into Vector Store & Conversation History
    try:
        conn2 = sqlite3.connect(DB_PATH)
        c2 = conn2.cursor()
        import datetime
        now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        # Record sequential chat turns
        c2.execute("INSERT INTO conversation_history (timestamp, sender, message) VALUES (?, ?, ?);", (now_str, "zak", user_query))
        c2.execute("INSERT INTO conversation_history (timestamp, sender, message) VALUES (?, ?, ?);", (now_str, "myos-cortex", response_text))

        # Vector embed dialogue exchange for long-term semantic retrieval
        dialogue_text = f"Zak: {user_query}\nCortex: {response_text}"
        dialogue_emb = get_embedding(dialogue_text)
        if dialogue_emb is not None:
            node_id = f"conversation_{int(time.time() * 1000)}"
            c2.execute("""
                INSERT OR REPLACE INTO vectors (id, type, timestamp, text, embedding)
                VALUES (?, 'conversation', ?, ?, ?);
            """, (node_id, now_str, dialogue_text, dialogue_emb.tobytes()))

        conn2.commit()
        conn2.close()
    except Exception as log_err:
        pass

    return {
        "success": True,
        "response": response_text,
        "memories_used": len(retrieved_memories),
        "history_used": len(recent_history)
    }

if __name__ == "__main__":
    if len(sys.argv) > 1:
        query = " ".join(sys.argv[1:])
        res = query_memory_and_ask(query)
        print(json.dumps(res, indent=2))
    else:
        print(json.dumps({"error": "No query provided"}))
