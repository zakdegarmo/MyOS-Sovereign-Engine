"""
<myos:node>
  <id>node_0d37fe08002c</id>
  <pillar>Self ◉</pillar>
  <file>scripts/tools/setup_model_registry.py</file>
  <sha256>0d37fe08002ce0c2a098a4299acc2129ef2506762b471ecac300b5faf5f7b9e1</sha256>
  <summary>Core functional substrate module for MyOS Sovereign Engine.</summary>
  <exports>setup_registry</exports>
</myos:node>
"""

import sqlite3
import os
import sys
import json
import time

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
DB_PATH = os.path.join(PROJECT_ROOT, "data", "myos_vector_store.db")

def setup_registry():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    # Create model_registry table
    c.execute("""
        CREATE TABLE IF NOT EXISTS model_registry (
            model_id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            dominant_pillar TEXT NOT NULL,
            substrate_type TEXT NOT NULL,
            endpoint TEXT NOT NULL,
            system_role TEXT NOT NULL,
            vector_filter_types TEXT NOT NULL,
            temperature REAL DEFAULT 0.7,
            max_tokens INTEGER DEFAULT 4096,
            is_active INTEGER DEFAULT 1,
            created_at REAL NOT NULL,
            metadata_json TEXT
        );
    """)

    # Seed the 6 Sovereign Substrates
    now = time.time()
    models = [
        (
            "myos-cortex:latest",
            "MyOS Cortex",
            "Self ◉",
            "ollama_llm",
            "http://localhost:11434/api/chat",
            "Sovereign Operating System Core and Cognitive Center. Conducts symbiorithmic synthesis, oversees 10-pillar balance, coordinates multi-substrate execution, and maintains state continuity.",
            "conversation,intention,architecture_node,rule_node,visual_context",
            0.7,
            8192,
            1,
            now,
            json.dumps({"capabilities": ["telemetry", "state_governance", "orchestration"]})
        ),
        (
            "gemma4:latest",
            "Gemma 4 Swarm",
            "Thought ✧",
            "ollama_llm",
            "http://localhost:11434/api/generate",
            "Recursive ideation, semantic transcript extraction, fast factual summarization, and autonomous crawler reasoning across memory weaver agents.",
            "intention,dialogue,lore_node",
            0.6,
            8192,
            1,
            now,
            json.dumps({"capabilities": ["journal_weaving", "swarming", "fact_extraction"]})
        ),
        (
            "qwen2.5-coder:7b",
            "Qwen Coder",
            "Logic ∴",
            "ollama_llm",
            "http://localhost:11434/api/chat",
            "Syntactic precision, AST refactoring, TypeScript type checking, Python engine governance, and cryptographic/inode validation.",
            "code,architecture_node,rule_node",
            0.2,
            16384,
            1,
            now,
            json.dumps({"capabilities": ["ast_parsing", "typescript_compilation", "refactoring", "bug_triage"]})
        ),
        (
            "llava:latest",
            "LLaVA Vision",
            "Mastery ❂",
            "vlm_vision",
            "http://localhost:11434/api/generate",
            "Optic subconscious, VLM screen observation, visual anomaly detection, 2D sprite visual critique, and character attribute JSON recipe extraction.",
            "visual_context,sprite_asset",
            0.3,
            2048,
            1,
            now,
            json.dumps({"capabilities": ["screen_perception", "visual_critique", "recipe_extraction"]})
        ),
        (
            "Lykon/dreamshaper-8",
            "DreamShaper 8",
            "Existence ⬡",
            "diffusers_diffusion",
            "scripts/tools/comfy_env",
            "Latent space visual manifestation, high-fidelity 2D character concept plates, cel-shaded texture baking, and multi-angle sprite projections.",
            "sprite_asset,visual_context",
            0.7,
            50,
            1,
            now,
            json.dumps({"capabilities": ["text_to_image", "ip_adapter", "controlnet", "character_plates"]})
        ),
        (
            "mxbai-embed-large:latest",
            "Mxbai Embedding Engine",
            "Resonance ∿",
            "ollama_embedding",
            "http://localhost:11434/api/embeddings",
            "1024-dimensional harmonic vector projection, cosine similarity calculation, and semantic lattice matching across the entire MyOS knowledge base.",
            "all",
            0.0,
            1024,
            1,
            now,
            json.dumps({"capabilities": ["embedding_1024", "semantic_search", "similarity_ranking"]})
        )
    ]

    for m in models:
        c.execute("""
            INSERT OR REPLACE INTO model_registry 
            (model_id, name, dominant_pillar, substrate_type, endpoint, system_role, vector_filter_types, temperature, max_tokens, is_active, created_at, metadata_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, m)

    conn.commit()

    # Query and print out confirmation
    c.execute("SELECT model_id, name, dominant_pillar, substrate_type FROM model_registry;")
    print("Sovereign Model Registry Initialized in SQLite:")
    for row in c.fetchall():
        print(f"  [{row[2]}] {row[1]} ({row[0]}) -> Substrate: {row[3]}")

    conn.close()

if __name__ == "__main__":
    setup_registry()
