
import json
import sys
import os
import numpy as np
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env.local')

# Configuration
API_KEY = os.environ.get("GEMINI_API_KEY")
ARCHIVE_FILE = "apps/web/public/data/archive_vectors.json"
GENOME_FILE = "apps/web/public/data/genome_vectors.json"

def cosine_similarity(v1, v2):
    dot_product = np.dot(v1, v2)
    norm_v1 = np.linalg.norm(v1)
    norm_v2 = np.linalg.norm(v2)
    return dot_product / (norm_v1 * norm_v2)

def main():
    if len(sys.argv) < 2:
        print("Usage: python query_nexus.py <query_string>")
        return

    query_text = " ".join(sys.argv[1:])
    print(f"🔮 Antigravity connecting to Nexus... Query: '{query_text}'")

    # 1. Init Client
    if not API_KEY:
        print("❌ Error: GEMINI_API_KEY not set.")
        return
    
    genai.configure(api_key=API_KEY)

    # 2. Generate Embedding
    try:
        # Use the sturdy embedding-001 model
        response = genai.embed_content(
            model="models/gemini-embedding-001",
            content=query_text,
            task_type="retrieval_query"
        )
        query_vector = response['embedding']
    except Exception as e:
        print(f"❌ Embedding Error: {e}")
        return

    # 3. Load Vectors
    candidates = []
    
    try:
        with open(ARCHIVE_FILE, 'r', encoding='utf-8') as f:
            archive = json.load(f)
            for item in archive:
                item['type'] = 'archive'
                candidates.append(item)
    except Exception as e:
        print(f"⚠️ Could not load archive: {e}")

    try:
        with open(GENOME_FILE, 'r', encoding='utf-8') as f:
            genome = json.load(f)
            for item in genome:
                item['type'] = 'genome'
                candidates.append(item)
    except Exception as e:
        print(f"⚠️ Could not load genome: {e}")

    if not candidates:
        print("❌ No memory vectors found.")
        return

    print(f"🧠 Searching {len(candidates)} neural pathways...")

    # 4. Search
    results = []
    for item in candidates:
        score = cosine_similarity(query_vector, item['vector'])
        results.append({**item, 'score': score})

    # 5. Sort and Display
    results.sort(key=lambda x: x['score'], reverse=True)
    top_results = results[:5]

    print("\n--- 🌌 NEXUS MEMORY RETRIEVAL ---")
    for i, res in enumerate(top_results):
        print(f"\n[{i+1}] {res.get('title', res.get('name'))} ({res['type'].upper()})")
        print(f"    Relevance: {res['score']:.4f}")
        print(f"    ID: {res.get('id')}")
        
        # Snippet
        if res['type'] == 'genome':
            print(f"    Rationale: {res.get('rationale', '')[:200]}...")
        else:
            print(f"    Dewey: {res.get('deweyCode')}")

    print("\n---------------------------------")

if __name__ == "__main__":
    main()
