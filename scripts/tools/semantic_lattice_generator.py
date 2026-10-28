import os
import json
import re
import math

LIBRARY_PATH = r"C:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\library"
OUTPUT_PATH = r"C:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\backend\myos_ontology_lattice.json"

# We use 768 dimensions so the procedural vectors can natively mix with standard 
# local embedding models (like nomic-embed-text) in the Vector DB.
EMBEDDING_DIM = 768

def create_base_vector(pillar_index):
    # Distribute the 10 pillars evenly across the 768 dimensions
    vec = [0.0] * EMBEDDING_DIM
    # 768 / 10 = 76.8 -> step by 76
    idx = int(pillar_index * 76)
    vec[idx] = 1.0
    return vec

def combine_vectors(v1, w1, v2, w2):
    return [(a * w1) + (b * w2) for a, b in zip(v1, v2)]

def normalize_vector(v):
    mag = math.sqrt(sum(x*x for x in v))
    if mag == 0:
        return v
    return [x/mag for x in v]

def parse_ontology():
    files = [f for f in os.listdir(LIBRARY_PATH) if f.endswith("_Genes.md")]
    
    # 1. Map Pillar Names to an Index (0-9)
    pillars = sorted([f.replace("_Genes.md", "") for f in files])
    pillar_indices = {name: idx for idx, name in enumerate(pillars)}
    
    lattice = {
        "Root": {
            "type": "Root",
            "vector": normalize_vector([1.0] * EMBEDDING_DIM), # The omni-point
            "children": []
        }
    }
    
    node_count = 1 # Root
    
    for file in files:
        pillar_name = file.replace("_Genes.md", "")
        pillar_idx = pillar_indices[pillar_name]
        
        pillar_vec = create_base_vector(pillar_idx)
        
        lattice[pillar_name] = {
            "type": "Pillar",
            "name": pillar_name,
            "vector": pillar_vec,
            "relationships": {}
        }
        lattice["Root"]["children"].append(pillar_name)
        node_count += 1
        
        with open(os.path.join(LIBRARY_PATH, file), "r", encoding="utf-8") as f:
            content = f.read()
            
        # Parse Relationships (e.g. ## 🜄.⚹ Is (Self))
        # We look for "##" blocks
        rel_blocks = re.split(r'\n##\s+', content)[1:] # Skip the preamble
        
        for block in rel_blocks:
            lines = block.split("\n")
            header = lines[0].strip()
            
            # Extract target pillar if available in parentheses e.g. (Self)
            target_match = re.search(r'\((.*?)\)', header)
            target_pillar = target_match.group(1) if target_match else pillar_name
            
            rel_name = header.split(" ")[1] if len(header.split(" ")) > 1 else "Unknown"
            rel_name = rel_name.split("(")[0].strip() # Clean it up
            
            # Calculate Relationship Vector (Blend of Origin Pillar and Target Pillar)
            if target_pillar in pillar_indices:
                target_vec = create_base_vector(pillar_indices[target_pillar])
                rel_vec = normalize_vector(combine_vectors(pillar_vec, 0.7, target_vec, 0.3))
            else:
                rel_vec = pillar_vec
                
            lattice[pillar_name]["relationships"][rel_name] = {
                "type": "Relationship",
                "name": rel_name,
                "target": target_pillar,
                "vector": rel_vec,
                "genes": {}
            }
            node_count += 1
            
            # Parse Genes (e.g. 1. **Being** - The raw...)
            gene_lines = [l for l in lines if re.match(r'^\d+\.\s+\*\*', l)]
            
            for g_idx, g_line in enumerate(gene_lines):
                # Extract Gene Name
                g_match = re.search(r'\*\*(.*?)\*\*', g_line)
                if not g_match:
                    continue
                gene_name = g_match.group(1)
                
                # Extract Description
                g_desc = g_line.split("-")[-1].strip() if "-" in g_line else g_line
                
                # Calculate Gene Vector (Relationship Vector + Small offset based on index)
                # To keep it deterministic, we perturb dimensions adjacent to the main pillar
                gene_vec = rel_vec.copy()
                offset_idx = (pillar_idx * 76 + g_idx + 1) % EMBEDDING_DIM
                gene_vec[offset_idx] += 0.2
                gene_vec = normalize_vector(gene_vec)
                
                lattice[pillar_name]["relationships"][rel_name]["genes"][gene_name] = {
                    "type": "Gene",
                    "id": g_idx + 1,
                    "name": gene_name,
                    "description": g_desc,
                    "vector": gene_vec
                }
                node_count += 1
                
    with open(OUTPUT_PATH, "w", encoding="utf-8") as out:
        json.dump(lattice, out, indent=2)
        
    print(f"Generated Semantic Lattice at {OUTPUT_PATH}")
    print(f"Total Nodes Instanced: {node_count} (Expected: ~1111)")

if __name__ == "__main__":
    parse_ontology()
