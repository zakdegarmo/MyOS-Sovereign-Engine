import os
import re
import json
import time
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env.local')
api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    print("❌ Error: GEMINI_API_KEY not found in .env.local")
    exit(1)

genai.configure(api_key=api_key)

GENOME_FILE = "apps/web/src/Omni/data/FractalGenomeData.ts"
OUTPUT_FILE = "apps/web/public/data/genome_vectors.json"
MODEL_NAME = "models/gemini-embedding-001"

def parse_genome_data(file_path):
    print(f"📖 Reading {file_path}...")
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
            
        # Regex to capture content inside { ... } blocks
        # Looking for "id": "...", "name": "...", "rationale": "..."
        pattern = r'\{\s*\"id\":\s*\"(.*?)\",\s*\"name\":\s*\"(.*?)\",\s*\"rationale\":\s*\"(.*?)\"\s*\}'
        matches = re.findall(pattern, content, re.DOTALL)
        
        nodes = []
        for match in matches:
            nodes.append({
                "id": match[0],
                "name": match[1],
                "rationale": match[2]
            })
            
        print(f"✅ Extracted {len(nodes)} nodes from Genome file.")
        return nodes
    except Exception as e:
        print(f"❌ Error parsing file: {e}")
        return []

def generate_embeddings(nodes):
    print(f"🧠 Generating Embeddings using {MODEL_NAME}...")
    vectors = []
    batch_size = 100 # Gemini allows batching
    
    for i in range(0, len(nodes), batch_size):
        batch = nodes[i:i+batch_size]
        texts = [f"{n['name']}: {n['rationale']}" for n in batch]
        
        try:
            print(f"   Processing batch {i} to {i+len(batch)}...")
            result = genai.embed_content(
                model=MODEL_NAME,
                content=texts,
                task_type="retrieval_document"
            )
            
            # The result['embedding'] is a list of embeddings
            embeddings = result['embedding']
            
            for j, emb in enumerate(embeddings):
                node = batch[j]
                vectors.append({
                    "id": node['id'],
                    "name": node['name'],
                    "rationale": node['rationale'],
                    "vector": emb
                })
                
            # Rate limit pause
            time.sleep(1)
            
        except Exception as e:
            print(f"❌ Error embedding batch: {e}")
            
    return vectors

if __name__ == "__main__":
    nodes = parse_genome_data(GENOME_FILE)
    if nodes:
        vectors = generate_embeddings(nodes)
        
        # Save output
        os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
        with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
            json.dump(vectors, f)
            
        print(f"💾 Saved {len(vectors)} vectors to {OUTPUT_FILE}")
