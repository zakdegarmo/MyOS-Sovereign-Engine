"""
Batch Generator for D&D 5e 'A' Monsters
Executes the procedural 2.5D character engine across all iconic 'A' monsters from D&D 5e SRD statblocks.
Generates 3D modular meshes, films 512px cardinal actions, compiles 128px True HD LPC sheets with crevice shading,
and registers them dynamically into the Sprite Lab / Mephit ecosystem.
"""

import os
import sys
import json
import time

TOOLS_DIR = os.path.abspath(os.path.dirname(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(TOOLS_DIR, "..", ".."))
if TOOLS_DIR not in sys.path:
    sys.path.insert(0, TOOLS_DIR)

from procedural_character_engine import run_pipeline

DND_5E_A_MONSTERS = [
    {
        "name": "animated_armor",
        "title": "Animated Armor",
        "cr": "1",
        "type": "Medium Construct",
        "description": "Animated Armor: Medium construct, heavy enchanted iron plate armor suit with polished steel helm, wielding a broadsword and shield, clanking footsteps and glowing hollow visor."
    },
    {
        "name": "archmage",
        "title": "Archmage",
        "cr": "12",
        "type": "Medium Humanoid",
        "description": "Archmage: Medium humanoid wizard master wearing ornate mystic azure and gold trimmed robes, carrying an arcane crystal staff, casting radiant magic flares."
    },
    {
        "name": "assassin",
        "title": "Assassin",
        "cr": "8",
        "type": "Medium Humanoid",
        "description": "Assassin: Medium humanoid shadow rogue clad in dark traveling leather armor and a deep stealth hooded cowl, wielding twin poisoned daggers."
    },
    {
        "name": "azer",
        "title": "Azer",
        "cr": "2",
        "type": "Medium Elemental",
        "description": "Azer: Medium elemental dwarven warrior with glowing molten bronze skin, a fiery flaming beard, wielding a forged bronze warhammer and iron shield."
    },
    {
        "name": "air_elemental",
        "title": "Air Elemental",
        "cr": "5",
        "type": "Large Elemental",
        "description": "Air Elemental: Large swirling vortex elemental composed of living howling wind, storm clouds, and azure gale currents."
    },
    {
        "name": "ankheg",
        "title": "Ankheg",
        "cr": "2",
        "type": "Large Monstrosity",
        "description": "Ankheg: Large burrowing insectoid monstrosity with thick chitinous brown carapaces, segmented legs, and sharp acidic crushing mandibles."
    },
    {
        "name": "ape",
        "title": "Ape",
        "cr": "1/2",
        "type": "Medium Beast",
        "description": "Ape: Medium beast primate with muscular brown fur, heavy broad shoulders, powerful arms for slamming and primal roar."
    }
]

def batch_generate(monsters=None):
    if monsters is None:
        monsters = DND_5E_A_MONSTERS
        
    total = len(monsters)
    print(f"\n==================================================================")
    print(f"  STARTING BATCH GENERATION OF 'A' D&D 5E MONSTERS ({total} TOTAL)")
    print(f"==================================================================\n")
    
    results = []
    t_start_all = time.time()
    
    for idx, monster in enumerate(monsters, 1):
        print(f"\n[{idx}/{total}] >>> Manifesting: {monster['title']} (CR {monster['cr']} {monster['type']})")
        print(f"      Statblock Concept: \"{monster['description']}\"")
        try:
            res = run_pipeline(monster['description'])
            results.append({
                "monster": monster,
                "result": res,
                "status": "SUCCESS"
            })
        except Exception as e:
            print(f"[ERROR] Failed to manifest {monster['title']}: {e}")
            results.append({
                "monster": monster,
                "error": str(e),
                "status": "FAILED"
            })
            
    t_total = time.time() - t_start_all
    print(f"\n==================================================================")
    print(f"  BATCH GENERATION COMPLETE!")
    print(f"  Total Processed: {len(results)} in {t_total:.2f}s ({t_total/max(1, len(results)):.1f}s avg per asset)")
    print(f"==================================================================")
    for r in results:
        status_icon = "[OK]" if r["status"] == "SUCCESS" else "[FAIL]"
        print(f" {status_icon} {r['monster']['title']:<20} | Status: {r['status']}")
    print(f"==================================================================\n")

if __name__ == "__main__":
    batch_generate()
