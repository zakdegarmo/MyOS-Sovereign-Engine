"""
scripts/tools/study_myos_symbiorithm.py
--------------------------------------
Autonomous Symbiorithmic Study of MyOS Architecture:
Triangulates between Zak's Ontological Directives, Antigravity Cloud Reasoner,
and Myos Local Cortex (localhost:11434 / myos-cortex / gemma4).

Deep dives into:
1. The 10 Pillars & 100-Node Vector Matrix (MyOntology).
2. The NexusContainer Fractal Dock & Semantic Addressing Architecture.
3. The Environment Registry & Selector System (ENVIRONMENTS).
4. The World-Scale Spoked Torus Knot Floor Mesh Geometry (replacing flat grid planes).
5. Clean Modularity & Governance to Eliminate Mechanical Drift.
"""

import json
import os
import sys
import time
import urllib.request
import urllib.error

WORKSPACE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
OUTPUT_LOG = os.path.join(WORKSPACE_ROOT, "tmp", "myos_symbiorithmic_study_log.json")
OUTPUT_MD = os.path.join(WORKSPACE_ROOT, "tmp", "myos_symbiorithmic_study_report.md")
OLLAMA_URL = "http://localhost:11434/api/generate"

STUDY_MODULES = [
    {
        "id": "module_1_nexus_container",
        "title": "NexusContainer & 10-Pillar Fractal Architecture",
        "prompt": """[Symbiorithm Cognitive Inquest: Module 1]
Analyze the architecture of MyOS's NexusContainer and the 10 Pillars of MyOntology:
1. Self (⚹), 2. Thought (☿), 3. Logic (🜔), 4. Unity (🝧), 5. Existence (🜄), 
6. Improvement (🜏), 7. Mastery (☉), 8. Resonance (♀), 9. Transcendence (🜍), 10. Omni (🜋).

How does the NexusContainer act as the recursive fractal UI for all submodules and applications in MyOS?
How does the 10x10=100 nested dock addressing system work (e.g. Existence->Logic = 🜄.🜔 for Glyphrider)?
Why is it an anti-pattern in MyOS to deploy ad-hoc standalone URLs (like localhost:5173/app.html) or dump tools directly in SystemHUD instead of indexing them into the NexusContainer?
Formulate the mathematical and structural governance required to preserve this architecture."""
    },
    {
        "id": "module_2_environment_registry",
        "title": "Environment Registry & Selector System",
        "prompt": """[Symbiorithm Cognitive Inquest: Module 2]
Analyze the MyOS Environment Selector system (apps/web/src/components/MaxOverlay/environmentRegistry.ts):
1. How does the ENVIRONMENTS registry manage production worlds (e.g., cognitive_matrix, chrono_hyperdrive, glyphrider, junkyard)?
2. How does the environment dropdown in the UI mount and transition 3D soundstages and environments?
3. Why should new game stages and virtual worlds be registered directly into this environment selector rather than scattered in isolated subdirectories?
Detail how MyOS dynamically switches lighting, fog, cameras, and floor configurations when an environment is selected."""
    },
    {
        "id": "module_3_spoked_torus_world_floor",
        "title": "World-Scale Spoked Torus Knot Floor Mesh Geometry",
        "prompt": """[Symbiorithm Cognitive Inquest: Module 3]
Examine the concept of replacing MyOS's flat 10x10 Battleship grid floor (GridFloor.tsx) with a World-Scale Spoked Torus Knot floor geometry:
1. The torus knot is NOT just a floating race track or a POI marker—it is the entire planetary floor mesh of the MyOS environment.
2. How can a parametric Three.js / R3F Torus Knot geometry (controlled by p and q modulation, major radius R, minor radius r, tubular cross-section) serve as the curved terrain substrate?
3. How can spokes, planetary struts, and elevation rings connect the knot to a central topological hub?
4. How do cities, junkyard POIs, towns, and roads anchor onto the parametric surface coordinates (u, v) of this knot?
5. How can dynamic p and q modulation allow players to select or re-knot the world geometry from the environment settings?
Provide the spatial mathematical formulas and Three.js implementation blueprint."""
    },
    {
        "id": "module_4_uniracers_reassembly",
        "title": "Uniracers 2 Clean Reassembly & Anti-Drift Architecture",
        "prompt": """[Symbiorithm Cognitive Inquest: Module 4]
Formulate the clean reassembly plan for Uniracers 2 within MyOS:
1. How do we cleanly isolate the core game components (6-DOF responsive trick engine, canonical single unicycle rig, camera tracking) so mechanical drift cannot occur?
2. How should narrative cutscenes (Red, Green, CorpoCycle) be staged and triggered cleanly without contaminating the active physics loop?
3. How should the game interface with both the NexusContainer (as an indexed application at 🜄.🜔) and the Environment Selector (as a full-world torus knot stage)?
4. Establish the operational rules for future agent pair-programming so creative brainstorms are filed in a design backlog rather than prematurely hacked into live code."""
    }
]

def query_cortex(prompt, model="myos-cortex:latest"):
    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": 0.4,
            "top_p": 0.9,
            "num_predict": 2048
        }
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        OLLAMA_URL,
        data=data,
        headers={"Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req, timeout=180) as resp:
            res_json = json.loads(resp.read().decode("utf-8"))
            return res_json.get("response", "")
    except Exception as e:
        # Fallback to gemma4:latest if myos-cortex fails
        if model != "gemma4:latest":
            print(f"[Cortex] Falling back to gemma4:latest due to: {e}")
            return query_cortex(prompt, model="gemma4:latest")
        print(f"[Cortex Error] {e}")
        return f"Error querying local cortex: {e}"

def run_study_cycle():
    os.makedirs(os.path.dirname(OUTPUT_LOG), exist_ok=True)
    
    log_data = []
    if os.path.exists(OUTPUT_LOG):
        try:
            with open(OUTPUT_LOG, "r", encoding="utf-8") as f:
                log_data = json.load(f)
        except Exception:
            log_data = []

    print("="*70)
    print("MYOS SYMBIORITHMIC DEEP STUDY CYCLE INITIATED")
    print(f"Timestamp: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*70)

    for i, mod in enumerate(STUDY_MODULES):
        print(f"\n[Module {i+1}/{len(STUDY_MODULES)}] {mod['title']}...")
        start_t = time.time()
        cortex_resp = query_cortex(mod["prompt"])
        duration = time.time() - start_t
        print(f"  Received Cortex Synthesis in {duration:.1f}s ({len(cortex_resp)} chars)")

        entry = {
            "module_id": mod["id"],
            "title": mod["title"],
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "duration_sec": round(duration, 1),
            "response": cortex_resp
        }
        log_data.append(entry)

        # Update JSON log
        with open(OUTPUT_LOG, "w", encoding="utf-8") as f:
            json.dump(log_data, f, indent=2)

        # Append to Markdown Report
        with open(OUTPUT_MD, "a", encoding="utf-8") as f:
            f.write(f"\n\n## {mod['title']}\n")
            f.write(f"*Synthesized by local myos-cortex on {entry['timestamp']} (Duration: {entry['duration_sec']}s)*\n\n")
            f.write(cortex_resp.strip() + "\n\n---\n")

    print("\n✅ Study cycle complete! All findings recorded in:")
    print(f"  - {OUTPUT_LOG}")
    print(f"  - {OUTPUT_MD}")

if __name__ == '__main__':
    run_study_cycle()
