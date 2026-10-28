import os
import urllib.request
import json
import time
import google.generativeai as genai

def load_taxonomy_prompt():
    plan_path = "C:/Users/zakde/.gemini/antigravity/brain/70bb1ebd-a2d1-4457-8f8b-ef197760c426/implementation_plan.md"
    try:
        with open(plan_path, "r", encoding="utf-8") as f:
            content = f.read()
        tables = []
        in_table = False
        for line in content.split('\n'):
            if line.startswith('| 6-Bit Index |'):
                in_table = True
            elif in_table and not line.startswith('|'):
                in_table = False
            if in_table:
                tables.append(line)
        return "\n".join(tables)
    except Exception as e:
        print(f"Error loading taxonomy: {e}")
        return ""

def get_repo_data(repo_name):
    print(f"Fetching {repo_name} from GitHub...")
    req = urllib.request.Request(f"https://api.github.com/repos/{repo_name}", headers={'User-Agent': 'Mozilla/5.0'})
    try:
        response = urllib.request.urlopen(req)
        data = json.loads(response.read())
        desc = data.get('description', 'No description provided.')
    except Exception as e:
        desc = f"Error: {e}"

    readme = ""
    for branch in ["master", "main"]:
        try:
            readme_req = urllib.request.Request(f"https://raw.githubusercontent.com/{repo_name}/{branch}/README.md", headers={'User-Agent': 'Mozilla/5.0'})
            readme_res = urllib.request.urlopen(readme_req)
            readme = readme_res.read().decode('utf-8')[:4000] 
            break
        except:
            pass
            
    if not readme:
        readme = "README not found."
        
    return f"Repo: {repo_name}\nDescription: {desc}\nREADME Snippet:\n{readme}"

def classify_repo(repo_name, system_prompt):
    repo_data = get_repo_data(repo_name)
    api_key = os.environ.get("GEMINI_API_KEY")
    
    if api_key:
        print(f"Assigning semantic coordinate using gemini-2.5-pro...")
        model = genai.GenerativeModel(
            model_name='gemini-2.5-pro',
            system_instruction=system_prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        try:
            response = model.generate_content(repo_data)
            return json.loads(response.text)
        except Exception as e:
            print(f"API Error: {e}")
            return None
    else:
        print(f"Assigning semantic coordinate using local Ollama (gemma4:26b)...")
        import requests
        url = "http://localhost:11434/api/generate"
        prompt = f"System Instruction:\n{system_prompt}\n\nInput Data:\n{repo_data}"
        payload = {
            "model": "gemma4:26b",
            "prompt": prompt,
            "stream": False,
            "format": "json"
        }
        try:
            res = requests.post(url, json=payload, timeout=120)
            return json.loads(res.json().get("response", ""))
        except Exception as e:
            print(f"Local Ollama Error: {e}")
            return None

if __name__ == "__main__":
    if "GEMINI_API_KEY" not in os.environ:
        from dotenv import load_dotenv
        load_dotenv('.env.local')
        
    api_key = os.environ.get("GEMINI_API_KEY")
    if api_key:
        genai.configure(api_key=api_key)
    else:
        print("[babel_indexer] GEMINI_API_KEY missing. Falling back to local Ollama (gemma4:26b)...")
    taxonomy_tables = load_taxonomy_prompt()
    
    system_prompt = f"""You are the Master Architect of the Mystra Nexus OS Taxonomy.
You use a 3-symbol Base-10 recursive coordinate system to classify all software based on its underlying semantic function.

Here are the 100 possible coordinates and their exact software application meanings:
{taxonomy_tables}

Your task is to analyze the provided GitHub repository metadata and README.
Determine its EXACT mathematically precise 3-symbol coordinate from the provided tables.
You must output ONLY a JSON object with two fields:
"coordinate": The exact 3-symbol string (e.g., "🜔⚹⚹")
"reasoning": A 1-sentence mathematical justification of why this repo fulfills that exact semantic cross-relationship verb.
"""

    test_repos = [
        "facebook/react",
        "supabase/supabase",
        "nextauthjs/next-auth",
        "axios/axios",
        "docker/cli"
    ]
    
    print("--- INITIATING TRUE BABEL INDEXER ---")
    results = {}
    for repo in test_repos:
        print("-" * 50)
        res = classify_repo(repo, system_prompt)
        if res:
            print(f"-> Assigned Coordinate: {res.get('coordinate', 'UNKNOWN')}")
            print(f"-> Rationale: {res.get('reasoning', 'No reasoning provided')}")
            results[repo] = res
        time.sleep(2) # Prevent rate limiting
            
    with open("babel_index.json", "w", encoding="utf-8") as f:
        json.dump(results, f, indent=4)
        
    print("\n[SUCCESS] Babel Library Index saved to babel_index.json")
