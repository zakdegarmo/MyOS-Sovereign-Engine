"""
Procedural Character Engine Orchestrator
Bridges Natural Language / D&D 5e Statblocks -> Local Ollama (Gemma4/Mistral)
-> Vector Embedding Matching (mxbai-embed-large) -> Headless Blender 5.2 Modular Assembly
-> Kinematic Action Classification -> 512px Super-Sampled Filming -> 128px True HD Master LPC Spritesheet
-> Dynamic Manifest Registration.
"""

import os
import sys
import json
import re
import time
import argparse
import subprocess
import urllib.request
import shutil
import numpy as np

TOOLS_DIR = os.path.abspath(os.path.dirname(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(TOOLS_DIR, "..", ".."))
if TOOLS_DIR not in sys.path:
    sys.path.insert(0, TOOLS_DIR)
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from lpc_master_compiler import compile_lpc_master_sheet
from register_character import register_in_mephit_manifest

BLENDER_EXE = r"C:\Program Files\Blender Foundation\Blender 5.2\blender.exe"
OLLAMA_URL = "http://127.0.0.1:11434"

PARTS_CATALOG = {
    "base_archetypes": {
        "male": "male base humanoid adventurer standard proportions",
        "female": "female base humanoid adventurer standard proportions",
        "armored_knight": "heavy plate armor knight paladin warrior iron steel shield",
        "mage": "mystic wizard mage sorcerer arcane robe magic spellcaster hooded",
        "paladin": "holy radiant knight crusader golden plate warrior righteous",
        "huntsman": "dark hooded shadow rogue ranger archer hunter assassin stealth leather cloak",
        "scout": "wilderness explorer leather light armor ranger nimble scout",
        "valor": "valiant brave warrior soldier adventurer sword fighter",
        "azure": "azure blue magic knight spellblade traveler"
    },
    "hairstyles": {
        "Hair_Long": "long flowing hair elven majestic mane",
        "Hair_Buns": "double hair buns stylized female neat topknot",
        "Hair_Beard": "rugged facial hair beard warrior dwarf dwarf styled",
        "Hair_Buzzed": "short buzzed military crop hair",
        "Hair_BuzzedFemale": "short female buzz cut athletic hair",
        "Hair_SimpleParted": "simple parted clean hair adventurer normal"
    },
    "modular_outfits": {
        "Male_Ranger_Head_Hood": "male ranger hood dark assassin cowl hooded cloak",
        "Male_Ranger_Body": "male ranger leather armor tunic dark stealth rogue body",
        "Male_Ranger_Acc_Pauldron": "male ranger shoulder pad pauldron leather armor guard",
        "Male_Ranger_Arms": "male ranger leather vambraces gloves arms",
        "Male_Ranger_Legs": "male ranger dark pants leather trousers legs",
        "Male_Ranger_Feet_Boots": "male ranger traveling leather boots footwear",
        "Female_Ranger_Head_Hood": "female ranger hood dark assassin cowl cloak",
        "Female_Ranger_Body": "female ranger leather tunic vest body",
        "Female_Ranger_Acc_Pauldrons": "female ranger shoulder pauldrons leather guards",
        "Female_Ranger_Arms": "female ranger sleeves vambraces gloves",
        "Female_Ranger_Legs": "female ranger trousers pants legs",
        "Female_Ranger_Feet": "female ranger boots leather footwear",
        "Male_Peasant_Body": "male peasant cloth shirt tunic body",
        "Male_Peasant_Arms": "male peasant rolled cloth sleeves arms",
        "Male_Peasant_Legs": "male peasant simple linen pants legs",
        "Male_Peasant_Feet": "male peasant cloth shoes feet",
        "Female_Peasant_Body": "female peasant dress apron bodice body",
        "Female_Peasant_Arms": "female peasant sleeves arms",
        "Female_Peasant_Legs": "female peasant skirt dress legs",
        "Female_Peasant_Feet": "female peasant shoes slippers feet"
    }
}

def query_ollama_generate(prompt, model="gemma4:latest", timeout_s=4):
    try:
        payload = {
            "model": model,
            "prompt": prompt,
            "stream": False,
            "options": {"temperature": 0.1, "num_predict": 128}
        }
        req = urllib.request.Request(
            f"{OLLAMA_URL}/api/generate",
            data=json.dumps(payload).encode('utf-8'),
            headers={'Content-Type': 'application/json'}
        )
        with urllib.request.urlopen(req, timeout=timeout_s) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            return data.get("response", "")
    except Exception as e:
        return None

def get_embedding(text, model="mxbai-embed-large:latest", timeout_s=3):
    try:
        payload = {"model": model, "prompt": text}
        req = urllib.request.Request(
            f"{OLLAMA_URL}/api/embeddings",
            data=json.dumps(payload).encode('utf-8'),
            headers={'Content-Type': 'application/json'}
        )
        with urllib.request.urlopen(req, timeout=timeout_s) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            return np.array(data.get("embedding", []), dtype=np.float32)
    except Exception:
        return None

def cosine_sim(a, b):
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0: return 0.0
    return float(np.dot(a, b) / (norm_a * norm_b))

def match_parts_semantically(description, gender="male"):
    desc_emb = get_embedding(description)
    selected_base = "male" if gender == "male" else "female"
    selected_hair = "Hair_Long" if "elf" in description.lower() or "long" in description.lower() else "Hair_SimpleParted"
    
    # Base Archetype Matching
    best_arch_score = -1.0
    for arch_key, arch_desc in PARTS_CATALOG["base_archetypes"].items():
        if desc_emb is not None:
            arch_emb = get_embedding(arch_desc)
            if arch_emb is not None:
                score = cosine_sim(desc_emb, arch_emb)
                if score > best_arch_score:
                    best_arch_score = score
                    selected_base = arch_key
        else:
            for word in arch_desc.split():
                if len(word) > 3 and word in description.lower():
                    selected_base = arch_key
                    break

    # Modular Parts Matching
    prefix = "Male_Ranger" if gender == "male" else "Female_Ranger"
    if "peasant" in description.lower() or "civilian" in description.lower() or "cloth" in description.lower():
        prefix = "Male_Peasant" if gender == "male" else "Female_Peasant"

    if any(k in description.lower() for k in ["hood", "rogue", "cloak", "shadow", "ranger", "assassin", "dagger"]):
        selected_modular_parts = [
            f"{prefix}_Head_Hood",
            f"{prefix}_Body",
            f"{prefix}_Acc_Pauldron" if "Male" in prefix else f"{prefix}_Acc_Pauldrons",
            f"{prefix}_Arms",
            f"{prefix}_Legs",
            f"{prefix}_Feet_Boots" if "Male" in prefix else f"{prefix}_Feet"
        ]
    else:
        selected_modular_parts = [
            f"{prefix}_Body",
            f"{prefix}_Arms",
            f"{prefix}_Legs",
            f"{prefix}_Feet_Boots" if "Male" in prefix else f"{prefix}_Feet"
        ]

    # Color tint inference
    tint = [0.4, 0.45, 0.6] if "shadow" in description.lower() or "dark" in description.lower() else [1.0, 1.0, 1.0]
    if "flame" in description.lower() or "fire" in description.lower() or "red" in description.lower():
        tint = [1.2, 0.4, 0.3]
    elif "emerald" in description.lower() or "green" in description.lower():
        tint = [0.4, 1.1, 0.5]
    elif "holy" in description.lower() or "gold" in description.lower() or "paladin" in description.lower():
        tint = [1.2, 1.1, 0.6]

    return {
        "base_archetype": selected_base,
        "hair": selected_hair,
        "modular_parts": selected_modular_parts,
        "tint": tint
    }

def parse_character_concept(prompt_or_statblock):
    print(f"[Concept Parser] Analyzing: '{prompt_or_statblock[:100]}...'")
    lower_text = prompt_or_statblock.lower()
    
    # Extract gender
    gender = "female" if any(w in lower_text for w in ["female", "woman", "girl", "maiden", "sorceress", "priestess"]) else "male"
    
    # Extract slug name
    words = [w for w in re.findall(r'\b[a-zA-Z]{3,}\b', lower_text) if w not in ['the', 'and', 'with', 'for', 'statblock', 'armor', 'character', 'male', 'female', 'class', 'race']]
    name_clean = "_".join(words[:3]) if words else "procedural_hero"
    name_clean = re.sub(r'[^a-zA-Z0-9_]', '_', name_clean).strip('_').lower()
    
    semantic_parts = match_parts_semantically(prompt_or_statblock, gender=gender)
    
    spec = {
        "character_name": name_clean,
        "gender": gender,
        "base_archetype": semantic_parts["base_archetype"],
        "hair": semantic_parts["hair"],
        "modular_parts": semantic_parts["modular_parts"],
        "tint": semantic_parts["tint"],
        "chibi": True
    }
    
    print(f"[Concept Parser] Structured Spec: {json.dumps(spec, indent=2)}")
    return spec

def run_pipeline(prompt_or_statblock, output_dir=r"apps/web/public/assets/lpc/body/bodies"):
    t_start = time.time()
    output_dir = os.path.abspath(output_dir)
    os.makedirs(output_dir, exist_ok=True)
    
    spec = parse_character_concept(prompt_or_statblock)
    char_name = spec["character_name"]
    
    work_dir = os.path.abspath(os.path.join(PROJECT_ROOT, "tmp", "procedural_chargen", char_name))
    os.makedirs(work_dir, exist_ok=True)
    
    spec_file = os.path.abspath(os.path.join(work_dir, f"{char_name}_spec.json"))
    with open(spec_file, 'w') as f:
        json.dump(spec, f, indent=2)
        
    filming_dir = os.path.abspath(os.path.join(work_dir, "filming"))
    os.makedirs(filming_dir, exist_ok=True)
    
    # 1. Kinematic Classification & 512px Super-Sampled Filming
    print(f"\n>>> [1/3] Blender 5.2 Kinematic Classification & 512px Filming...")
    filming_script = os.path.abspath(r"scripts/tools/blender_kinematic_filmer.py")
    cmd_film = [
        BLENDER_EXE, "--background", "--python", filming_script, "--",
        spec_file, filming_dir, char_name
    ]
    res_film = subprocess.run(cmd_film, capture_output=True, text=True)
    print(res_film.stdout)
    if res_film.returncode != 0:
        print(f"[Filming Error]: {res_film.stderr}")

    # 2. 128px True HD LPC Master Spritesheet Compilation
    print(f"\n>>> [2/3] Compiling 128px True HD Master LPC Spritesheet with Crevice Shading...")
    master_png_dest = os.path.join(output_dir, f"{char_name}.png")
    compile_lpc_master_sheet(filming_dir, master_png_dest, wash=True)
    
    # Mirror to /textures/avatars/lpc/body/bodies
    mirror_png = os.path.join(r"apps/web/public/textures/avatars/lpc/body/bodies", f"{char_name}.png")
    os.makedirs(os.path.dirname(mirror_png), exist_ok=True)
    shutil.copy2(master_png_dest, mirror_png)

    # 3. Dynamic Manifest Registration
    print(f"\n>>> [3/3] Registering Archetype into Mephit Manifests...")
    register_in_mephit_manifest(char_name, "body/bodies")
    
    elapsed = time.time() - t_start
    print(f"\n========================================================")
    print(f"[SUCCESS] Procedural Character '{char_name}' manifested in {elapsed:.2f}s!")
    print(f"LPC Master Sheet: {master_png_dest}")
    print(f"========================================================\n")
    
    return {
        "status": "success",
        "character_name": char_name,
        "spritesheet_path": master_png_dest,
        "elapsed_seconds": elapsed,
        "spec": spec
    }

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Autonomous Procedural 2.5D Character Engine")
    parser.add_argument("prompt", help="Natural language description or D&D statblock")
    parser.add_argument("--out_dir", default=r"apps/web/public/assets/lpc/body/bodies", help="Output directory")
    args = parser.parse_args()
    
    run_pipeline(args.prompt, args.out_dir)
