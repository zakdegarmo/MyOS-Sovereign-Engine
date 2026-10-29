import os
import json
import base64
import requests
import time
import re

OLLAMA_URL = "http://localhost:11434/api/generate"
IMAGE_DIR = "apps/web/public/integrations/5e spell cards individual/sliced_grid/"
OUTPUT_FILE = "apps/web/public/spell_database.json"

def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

def extract_spell_info(image_base64, filename):
    prompt = """
    Analyze this Dungeons & Dragons spell card image.
    Extract the following information:
    1. The name of the spell (usually large text at the top).
    2. The level of the spell (e.g., Cantrip, 1st-level, 2nd-level). Convert this strictly to one of: 'Cantrip', 'Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5', 'Level 6', 'Level 7', 'Level 8', 'Level 9'.
    3. The school of magic (e.g., Evocation, Abjuration, Conjuration).

    Output the result ONLY in strict valid JSON format, with no extra text or markdown formatting.
    Example output format:
    {"name": "Fireball", "level": "Level 3", "school": "Evocation"}
    """
    
    payload = {
        "model": "llava:latest",
        "prompt": prompt,
        "images": [image_base64],
        "stream": False,
        "format": "json"
    }

    try:
        response = requests.post(OLLAMA_URL, json=payload, timeout=60)
        response.raise_for_status()
        result = response.json()
        
        # Parse the JSON response
        text_resp = result.get("response", "").strip()
        data = json.loads(text_resp)
        
        # Clean up keys and ensure proper casing
        name = data.get("name", "Unknown Spell").title()
        level = data.get("level", "Unknown Level").title()
        school = data.get("school", "Unknown School").title()

        # Sanitize level to match our UI
        if "1" in level or "First" in level: level = "Level 1"
        elif "2" in level or "Second" in level: level = "Level 2"
        elif "3" in level or "Third" in level: level = "Level 3"
        elif "4" in level or "Fourth" in level: level = "Level 4"
        elif "5" in level or "Fifth" in level: level = "Level 5"
        elif "6" in level or "Sixth" in level: level = "Level 6"
        elif "7" in level or "Seventh" in level: level = "Level 7"
        elif "8" in level or "Eighth" in level: level = "Level 8"
        elif "9" in level or "Ninth" in level: level = "Level 9"
        elif "Cantrip" in level: level = "Cantrip"

        # Sanitize school
        valid_schools = ['Abjuration', 'Conjuration', 'Divination', 'Enchantment', 'Evocation', 'Illusion', 'Necromancy', 'Transmutation']
        matched_school = "Unknown"
        for s in valid_schools:
            if s.lower() in school.lower():
                matched_school = s
                break

        return {
            "id": re.sub(r'[^a-z0-9]', '_', name.lower()),
            "name": name,
            "level": level,
            "school": matched_school,
            "file": filename
        }
    except Exception as e:
        print(f"Error processing {filename}: {e}")
        return None

def main():
    print(f"Starting local LLM extraction pipeline using LLaVA...")
    if not os.path.exists(IMAGE_DIR):
        print(f"Error: Directory not found: {IMAGE_DIR}")
        return

    # Load existing database if resuming
    database = []
    processed_files = set()
    if os.path.exists(OUTPUT_FILE):
        with open(OUTPUT_FILE, 'r') as f:
            try:
                database = json.load(f)
                processed_files = {entry["file"] for entry in database}
                print(f"Resuming from {len(database)} existing entries.")
            except:
                pass

    files = [f for f in os.listdir(IMAGE_DIR) if f.endswith('.png')]
    total = len(files)
    
    print(f"Found {total} spell cards to process.")

    for i, filename in enumerate(files):
        if filename in processed_files:
            continue

        print(f"[{i+1}/{total}] Processing {filename}...")
        image_path = os.path.join(IMAGE_DIR, filename)
        base64_img = encode_image(image_path)
        
        info = extract_spell_info(base64_img, filename)
        if info:
            database.append(info)
            # Save incrementally
            with open(OUTPUT_FILE, 'w') as f:
                json.dump(database, f, indent=4)
            print(f"  -> Extracted: {info['name']} ({info['school']} {info['level']})")
        
        # Small delay to keep GPU temps reasonable
        time.sleep(0.5)

    print("Pipeline complete! All spells extracted to spell_database.json.")

if __name__ == "__main__":
    main()
