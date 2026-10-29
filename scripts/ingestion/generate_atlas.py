import os
import json
import numpy as np
from sklearn.preprocessing import MinMaxScaler
import umap
import matplotlib.pyplot as plt

# Configuration
GENOME_FILE = "apps/web/public/data/genome_vectors.json"
ARCHIVE_FILE = "apps/web/public/data/archive_vectors.json"
OUTPUT_FILE = "apps/web/public/data/memory_atlas.json"

def load_vectors():
    data = []
    
    # Load Genome
    if os.path.exists(GENOME_FILE):
        with open(GENOME_FILE, 'r', encoding='utf-8') as f:
            genome = json.load(f)
            for item in genome:
                data.append({
                    "id": item['id'],
                    "label": item['name'],
                    "type": "genome",
                    "vector": item['vector'],
                    "metadata": {"rationale": item['rationale']}
                })
    else:
        print(f"⚠️ Warning: {GENOME_FILE} not found.")

    # Load Archive
    if os.path.exists(ARCHIVE_FILE):
        with open(ARCHIVE_FILE, 'r', encoding='utf-8') as f:
            archive = json.load(f)
            for item in archive:
                data.append({
                    "id": item['id'],
                    "label": item['title'],
                    "type": "archive",
                    "vector": item['vector'],
                    "metadata": {"dewey": item.get('deweyCode')}
                })
    else:
        print(f"⚠️ Warning: {ARCHIVE_FILE} not found.")
        
    return data

def generate_atlas():
    print("🌍 Loading Vectors...")
    all_items = load_vectors()
    
    if not all_items:
        print("❌ No data found.")
        return

    vectors = np.array([item['vector'] for item in all_items])
    print(f"🔮 Reducing {len(vectors)} vectors (Dimensions: {vectors.shape[1]}) to 3D...")

    # UMAP Reduction
    reducer = umap.UMAP(
        n_components=3, 
        n_neighbors=15, 
        min_dist=0.1, 
        metric='cosine',
        random_state=42
    )
    embedding = reducer.fit_transform(vectors)

    # Normalize to -500 to 500 range for 3D Scene
    scaler = MinMaxScaler(feature_range=(-500, 500))
    embedding_scaled = scaler.fit_transform(embedding)

    # Combine back with metadata
    atlas = []
    for i, item in enumerate(all_items):
        item_data = {
            "id": item['id'],
            "label": item['label'],
            "type": item['type'],
            "x": float(embedding_scaled[i][0]),
            "y": float(embedding_scaled[i][1]),
            "z": float(embedding_scaled[i][2]),
            # "color": Assign based on type/pillar later
        }
        atlas.append(item_data)

    # Save
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(atlas, f)
        
    print(f"✅ Atlas Generated: {len(atlas)} nodes saved to {OUTPUT_FILE}")

if __name__ == "__main__":
    # Note: Requires pip install umap-learn scikit-learn numpy
    generate_atlas()
