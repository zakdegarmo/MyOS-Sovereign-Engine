import os
import json
import time
import glob
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env.local')
api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    print("❌ Error: GEMINI_API_KEY not found in .env.local")
    exit(1)

genai.configure(api_key=api_key)

DATA_DIR = "apps/web/public/data"
OUTPUT_FILE = "apps/web/public/data/archive_vectors.json"
MODEL_NAME = "models/gemini-embedding-001"

def load_archive_parts():
    print(f"📖 Scanning {DATA_DIR} for archive parts...")
    files = glob.glob(os.path.join(DATA_DIR, "archive_part_*.json"))
    all_items = []
    
    for f in files:
        try:
            with open(f, "r", encoding="utf-8") as json_file:
                items = json.load(json_file)
                all_items.extend(items)
                print(f"   Loaded {len(items)} items from {os.path.basename(f)}")
        except Exception as e:
            print(f"❌ Error loading {f}: {e}")
            
    print(f"✅ Total Archive Items: {len(all_items)}")
    return all_items

def generate_archive_embeddings(items):
    print(f"🧠 Generating Embeddings for Archive using {MODEL_NAME}...")
    vectors = []
    batch_size = 50 
    
    for i in range(0, len(items), batch_size):
        batch = items[i:i+batch_size]
        
        # Prepare content for embedding
        # Strategy: Use Title + Tags + Content Summary (first 1000 chars)
        # This keeps the vector focused on the "concept" rather than noisy full text.
        texts = []
        for item in batch:
            snippet = item.get('content', '')[:1000]
            tags = " ".join(item.get('tags', []))
            text = f"{item['title']} {tags} {snippet}"
            texts.append(text)
        
        try:
            print(f"   Processing batch {i} to {i+len(batch)}...")
            result = genai.embed_content(
                model=MODEL_NAME,
                content=texts,
                task_type="retrieval_document"
            )
            
            embeddings = result['embedding']
            
            for j, emb in enumerate(embeddings):
                item = batch[j]
                vectors.append({
                    "id": item['id'],
                    "title": item['title'],
                    "deweyCode": item.get('deweyCode'),
                    "vector": emb
                })
                
            time.sleep(1.5) # Gentle rate limit
            
        except Exception as e:
            print(f"❌ Error embedding batch: {e}")
            
    return vectors

if __name__ == "__main__":
    items = load_archive_parts()
    if items:
        vectors = generate_archive_embeddings(items)
        
        with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
            json.dump(vectors, f)
            
        print(f"💾 Saved {len(vectors)} archive vectors to {OUTPUT_FILE}")
