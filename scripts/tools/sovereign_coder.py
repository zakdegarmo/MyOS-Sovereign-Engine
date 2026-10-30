"""
<myos:node>
  <id>node_3f0873816f47</id>
  <pillar>Logic ∴</pillar>
  <file>scripts/tools/sovereign_coder.py</file>
  <sha256>3f0873816f475b389556683c2addaa1279134ba63cb07c51365eff18aa924c33</sha256>
  <summary>Core functional substrate module for MyOS Sovereign Engine.</summary>
  <exports>generate_code, compile_and_stamp</exports>
</myos:node>
"""

import os
import sys
import json
import time
import urllib.request
import subprocess

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
OLLAMA_GEN_URL = "http://localhost:11434/api/generate"
INJECTOR_SCRIPT = os.path.join(PROJECT_ROOT, "scripts", "tools", "semantic_node_injector.py")

SYSTEM_DIRECTIVE = """You are the Sovereign Coder for MyOS, embodying Pillar 3: Logic (∴).
You write pristine, production-grade, self-contained Python, TypeScript, or PowerShell code.
Follow Windows PowerShell compatibility, strictly preserve docstrings, and write deterministic, tested logic.
Output ONLY executable code inside markdown code blocks (e.g. ```python or ```typescript). Do not provide conversational filler.
"""

def generate_code(prompt: str, language: str = "python", model: str = "qwen2.5-coder:7b") -> str:
    full_prompt = f"{SYSTEM_DIRECTIVE}\n\nTask: Implement the following requirement in {language}:\n{prompt}\n\nCode:"
    payload = {
        "model": model,
        "prompt": full_prompt,
        "stream": False,
        "options": {
            "temperature": 0.2,
            "top_p": 0.95
        }
    }
    
    req = urllib.request.Request(
        OLLAMA_GEN_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    
    with urllib.request.urlopen(req, timeout=120) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        raw_text = data.get("response", "")
        
    # Extract code from code blocks if present
    import re
    code_match = re.search(r"```(?:[a-zA-Z0-9_-]+)?\s*([\s\S]*?)\s*```", raw_text)
    if code_match:
        return code_match.group(1).strip()
    return raw_text.strip()

def compile_and_stamp(target_path: str, code_content: str, dominant_pillar: str = "Logic ∴") -> dict:
    abs_path = os.path.abspath(target_path)
    os.makedirs(os.path.dirname(abs_path), exist_ok=True)
    
    # Write raw code
    with open(abs_path, "w", encoding="utf-8") as f:
        f.write(code_content)
        
    # Run Semantic Inode Injector to stamp and embed into SQLite
    result = subprocess.run(
        [sys.executable, INJECTOR_SCRIPT, "--stamp", abs_path],
        capture_output=True,
        text=True,
        encoding="utf-8"
    )
    
    try:
        data = json.loads(result.stdout)
        return {
            "success": True,
            "path": abs_path,
            "inode": data.get("inode_id"),
            "sha256": data.get("sha256"),
            "pillar": dominant_pillar
        }
    except Exception:
        return {
            "success": True,
            "path": abs_path,
            "raw_output": result.stdout
        }

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Usage: sovereign_coder.py <output_file> <prompt> [pillar]"}, indent=2))
        sys.exit(1)
        
    out_file = sys.argv[1]
    task_prompt = sys.argv[2]
    pillar = sys.argv[3] if len(sys.argv) > 3 else "Logic ∴"
    
    ext = os.path.splitext(out_file)[1].lower()
    lang = "python"
    if ext in [".ts", ".tsx"]:
        lang = "typescript"
    elif ext in [".js", ".jsx"]:
        lang = "javascript"
    elif ext in [".ps1"]:
        lang = "powershell"
        
    code = generate_code(task_prompt, language=lang)
    stamp_res = compile_and_stamp(out_file, code, dominant_pillar=pillar)
    print(json.dumps(stamp_res, indent=2))
