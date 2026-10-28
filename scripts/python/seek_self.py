import os
import glob
import json
import time
import google.generativeai as genai

def get_markdown_files(base_dir):
    files = []
    # Only the canonical 10
    canonical_files = [
        "Identity.md",
        "SubjectOf.md",
        "Applies.md",
        "Seeks.md",
        "Affirms.md",
        "Undergoes.md",
        "Pursues.md",
        "Experiences.md",
        "AspiresTo.md",
        "IsRealizedBy.md"
    ]
    for filename in canonical_files:
        path = os.path.join(base_dir, filename)
        if os.path.exists(path):
            files.append(path)
    return files

def parse_markdown(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    
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
        print("[seek_self] GEMINI_API_KEY missing. Falling back to local Ollama (gemma4:26b)...")
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
    
    base_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "packages", "library", "Self")
    md_files = get_markdown_files(base_dir)
    print(f"Found {len(md_files)} Semantic Panel Definitions in {base_dir}")
    
    output_file = "self_parent_candidates.json"
    candidates_db = []
    
    if os.path.exists(output_file):
        with open(output_file, "r", encoding="utf-8") as f:
            try:
                candidates_db = json.load(f)
            except:
                pass
                
    for file_path in md_files:
        pillar, verb, content = parse_markdown(file_path)
        
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

    print(f"\\n[COMPLETE] Parent mapping for Self Pillar finished. Check {output_file}")
