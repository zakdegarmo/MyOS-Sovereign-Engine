import os
import glob
import json
import time
import google.generativeai as genai

def get_markdown_files(base_dir):
    files = []
    for root, _, filenames in os.walk(base_dir):
        for filename in filenames:
            if filename.endswith(".md"):
                files.append(os.path.join(root, filename))
    return files

def parse_markdown(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Extract the pillar and verb from the path
    parts = os.path.normpath(file_path).split(os.sep)
    pillar = parts[-2]
    verb = parts[-1].replace(".md", "")
    return pillar, verb, content

def seek_parents_for_panel(pillar, verb, content, model):
    print(f"Seeking Parents for Panel: {pillar} -> {verb}")
    
    prompt = f"""You are the Master UI Architect of the Mystra Nexus.
We are building a massive nested application framework in React.
We need to find an existing, open-source React-based "Parent Application" or "Dashboard Template" on GitHub that we can clone to scaffold a specific UI panel.

Here is the exact conceptual, semantic definition of what this panel must be:
### PANEL: {pillar} -> {verb}
### SEMANTIC DEFINITION:
{content}

Based entirely on this semantic definition, search your knowledge base of open-source React applications, dashboards, or complex frontend libraries. 
Suggest the 3 BEST open-source repositories that functionally and visually embody this concept. We are looking for FULL applications or substantial UI scaffolds, NOT tiny backend utilities.

Return ONLY a valid JSON object in this exact format, with no markdown formatting:
{{
    "panel": "{pillar}->{verb}",
    "candidates": [
        {{
            "repo": "organization/repo_name",
            "description": "Short description of what the repo is.",
            "reasoning": "Why this specific UI repo perfectly matches the philosophical definition above."
        }},
        ... (2 more)
    ]
}}
"""
    try:
        response = model.generate_content(prompt)
        text = response.text.strip()
        if text.startswith('```json'): text = text[7:]
        if text.endswith('```'): text = text[:-3]
        return json.loads(text.strip())
    except Exception as e:
        print(f"Error calling API for {pillar}->{verb}: {e}")
        return None

if __name__ == "__main__":
    if "GEMINI_API_KEY" not in os.environ:
        from dotenv import load_dotenv
        load_dotenv('.env.local')
        
    api_key = os.environ.get("GEMINI_API_KEY")
    if api_key:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(
            model_name='gemini-2.5-pro',
            generation_config={"response_mime_type": "application/json"}
        )
    else:
        print("[seek_parents] GEMINI_API_KEY missing. Falling back to local Ollama (gemma4:26b)...")
        class OllamaModel:
            def __init__(self, model_name="gemma4:26b"):
                self.model_name = model_name
            def generate_content(self, prompt):
                import requests
                url = "http://localhost:11434/api/generate"
                payload = {
                    "model": self.model_name,
                    "prompt": prompt,
                    "stream": False,
                    "format": "json"
                }
                res = requests.post(url, json=payload, timeout=120)
                text = res.json().get("response", "")
                class MockResponse:
                    def __init__(self, text):
                        self.text = text
                return MockResponse(text)
        model = OllamaModel()
    
    base_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "packages", "library")
    md_files = get_markdown_files(base_dir)
    
    # Define Ontological Order to avoid alphabetical default
    PILLAR_ORDER = [
        "Self", "Thought", "Logic", "Unity", "Existence", 
        "Improvement", "Mastery", "Resonance", "Transcendence", "Omni"
    ]
    
    # Map the "Verbs" to their Target Pillars to facilitate chronological sorting
    RELATIONSHIP_MAP = {
        "Identity": "Self", "Subject Of": "Thought", "SubjectOf": "Thought", "Applies": "Logic", "Seeks": "Unity", "Affirms": "Existence", 
        "Undergoes": "Improvement", "Pursues": "Mastery", "Experiences": "Resonance", "Aspires To": "Transcendence", "AspiresTo": "Transcendence", "Is Realized by": "Omni", "IsRealizedBy": "Omni", "Is Realized By": "Omni", "IsRealized": "Omni",
        "Informs": "Self", "Recursion": "Thought", "Utilizes": "Logic", "Synthesizes": "Unity", "Represents": "Existence", "Drives": "Improvement", "Develops": "Mastery", "Articulates": "Resonance", "Enables": "Transcendence", "Transcends": "Omni",
        "Structures": "Self", "Governs": "Thought", "Foundation": "Logic", "Ensures": "Unity", "Describes": "Existence", "Validates": "Improvement", "Underpins": "Mastery", "Contradicts": "Resonance", "Grounds": "Transcendence", "Is the Foundation Of": "Omni",
        "Integrates": "Self", "Harmonizes": "Thought", "Requires": "Logic", "Essence": "Unity", "Binds": "Existence", "Fosters": "Improvement", "Culminates In": "Mastery", "Amplifies": "Resonance", "Achieves": "Transcendence", "Is the Ultimate Expression Of": "Omni",
        "Manifests In": "Self", "Is Pondered By": "Thought", "Obeys": "Logic", "Comprises": "Unity", "Is": "Existence", "Evolves Through": "Improvement", "Is Domain Of": "Mastery", "Vibrates In": "Resonance", "Is Surpassed By": "Transcendence", "Gives Rise To": "Omni",
        "Refines": "Self", "Optimizes": "Thought", "Systematizes": "Logic", "Strengthens": "Unity", "Enhances": "Existence", "Process": "Improvement", "Leads To": "Mastery", "Fine-tunes": "Resonance", "Is Path To": "Transcendence", "Is the Cycle Of": "Omni",
        "Actualizes": "Self", "Requires Deep": "Thought", "Applies Perfected": "Logic", "Embodies": "Unity", "Commands": "Existence", "Is Goal Of": "Improvement", "Pinnacle": "Mastery", "Generates": "Resonance", "Approaches": "Transcendence", "Is the Totality Of": "Omni",
        "Is Felt By": "Self", "Is Evoked By": "Thought", "Eludes": "Logic", "Creates": "Unity", "Echoes Through": "Existence", "Aligns With": "Improvement", "Radiates From": "Mastery", "Sympathy": "Resonance", "Facilitates": "Transcendence", "Is the Ground Of": "Omni",
        "Elevates": "Self", "Goes Beyond": "Thought", "Is Not Bound By": "Logic", "Is A State Of": "Unity", "Rises Above": "Existence", "Is Aim Of": "Improvement", "Is Pinnacle Of": "Mastery", "Induces": "Resonance", "Action": "Transcendence", "Is the Nature Of": "Omni",
        "Merges With": "Self", "Contemplates": "Thought", "Is a Subset Of": "Logic", "Is an Aspect Of": "Unity", "Emerges From": "Existence", "Occurs Within": "Improvement", "Seeks to Understand": "Mastery", "Harmonizes With": "Resonance", "Aspires To": "Transcendence", "is": "Omni"
    }

    def sort_key(file_path):
        parts = os.path.normpath(file_path).split(os.sep)
        pillar = parts[-2]
        verb = parts[-1].replace(".md", "")
        
        target_pillar = RELATIONSHIP_MAP.get(verb, "Omni")
        
        try:
            pillar_idx = PILLAR_ORDER.index(pillar)
        except ValueError:
            pillar_idx = 10
            
        try:
            target_idx = PILLAR_ORDER.index(target_pillar)
        except ValueError:
            target_idx = 10
            
        return (pillar_idx, target_idx, parts[-1])

    md_files.sort(key=sort_key)
    print(f"Found {len(md_files)} Semantic Panel Definitions in {base_dir}")
    
    output_file = "parent_candidates.json"
    candidates_db = []
    
    if os.path.exists(output_file):
        with open(output_file, "r", encoding="utf-8") as f:
            try:
                candidates_db = json.load(f)
            except:
                pass
                
    # Process all semantic panels
    for file_path in md_files:
        pillar, verb, content = parse_markdown(file_path)
        
        # Check if already processed
        if any(item.get("panel") == f"{pillar}->{verb}" for item in candidates_db):
            print(f"Already found candidates for {pillar}->{verb}, skipping.")
            continue
            
        result = seek_parents_for_panel(pillar, verb, content, model)
        if result:
            print(" -> Success.")
            candidates_db.append(result)
            with open(output_file, "w", encoding="utf-8") as f:
                json.dump(candidates_db, f, indent=4)
        
        time.sleep(3) # Rate limit protection

    print("\n[COMPLETE] Parent mapping test finished. Check parent_candidates.json")
