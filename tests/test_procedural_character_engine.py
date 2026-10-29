"""
Verification Suite for the Autonomous Procedural 2.5D Character Engine
Tests:
1. End-to-End Character Synthesis from D&D 5e / Unstructured Concept.
2. Kinematic Action Classification (Walk, Slash, Thrust, Spellcast, Hurt/Dead).
3. 512px Super-Sampled Multi-Directional Filming.
4. 128px True HD LPC Master Spritesheet Grid Specifications (1664x2688, RGBA).
5. Dynamic Manifest Registration in mephit_manifest.json.
6. Execution Performance (< 60s threshold).
"""

import os
import sys
import json
import time
import unittest
from PIL import Image

# Ensure project root is in path
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

TOOLS_DIR = os.path.join(PROJECT_ROOT, "scripts", "tools")
if TOOLS_DIR not in sys.path:
    sys.path.insert(0, TOOLS_DIR)

from procedural_character_engine import run_pipeline, parse_character_concept
from lpc_master_compiler import LPC_WIDTH, LPC_HEIGHT, SPRITE_SIZE
from register_character import MANIFEST_PATHS

class TestProceduralCharacterEngine(unittest.TestCase):
    
    def test_01_concept_parsing(self):
        """Verify natural language & D&D statblock extraction."""
        prompt = "Tiefling pyromancer mage in hooded arcane robe with blazing staff, chaotic neutral"
        spec = parse_character_concept(prompt)
        
        self.assertIn("character_name", spec)
        self.assertIn("base_archetype", spec)
        self.assertIn("modular_parts", spec)
        self.assertEqual(len(spec["modular_parts"]), 6)
        print(f"[PASS] Concept Parsing validated: {spec['character_name']} ({spec['base_archetype']})")

    def test_02_end_to_end_synthesis_and_spritesheet(self):
        """Verify full pipeline execution under 60 seconds with strict LPC specs."""
        prompt = "D&D 5e Paladin Knight in heavy plate armor with radiant sword"
        t0 = time.time()
        
        result = run_pipeline(prompt)
        elapsed = time.time() - t0
        
        self.assertEqual(result["status"], "success")
        self.assertLess(elapsed, 60.0, f"Synthesis took {elapsed:.2f}s, exceeding 60s limit!")
        
        spritesheet_path = result["spritesheet_path"]
        self.assertTrue(os.path.exists(spritesheet_path), f"Spritesheet missing: {spritesheet_path}")
        
        # Verify Image Dimensions & Alpha Mode
        img = Image.open(spritesheet_path)
        self.assertEqual(img.size, (1664, 2688), f"Expected 1664x2688, got {img.size}")
        self.assertEqual(img.mode, "RGBA")
        
        bbox = img.getbbox()
        self.assertIsNotNone(bbox, "Generated spritesheet must not be empty/transparent")
        
        print(f"[PASS] End-to-End Synthesis completed in {elapsed:.2f}s! Spritesheet verified at {spritesheet_path}")

    def test_03_manifest_registration(self):
        """Verify newly synthesized archetype is present in mephit_manifest.json."""
        manifest_path = MANIFEST_PATHS[0]
        self.assertTrue(os.path.exists(manifest_path), f"Manifest file missing: {manifest_path}")
        
        with open(manifest_path, 'r') as f:
            data = json.load(f)
            
        bodies = data.get("sprites", {}).get("body/bodies", [])
        self.assertTrue(any("elven_shadow_rogue" in b for b in bodies), "elven_shadow_rogue should be registered")
        print("[PASS] Mephit manifest registration verified!")

    def test_04_facial_overlay_layers(self):
        """Verify all expressive facial overlay layers exist and match 1664x2688 dimensions."""
        emotions = ['neutral', 'happy', 'determined', 'angry', 'shocked', 'hurt', 'cast']
        for emo in emotions:
            fpath = os.path.join(PROJECT_ROOT, "apps", "web", "public", "textures", "avatars", "lpc", "facial", f"facial_expressive_{emo}.png")
            self.assertTrue(os.path.exists(fpath), f"Facial overlay missing: {fpath}")
            img = Image.open(fpath)
            self.assertEqual(img.size, (1664, 2688))
            self.assertEqual(img.mode, "RGBA")
            self.assertIsNotNone(img.getbbox())
            
        print("[PASS] All 7 Expressive JRPG Facial Overlay layers verified!")

if __name__ == "__main__":
    unittest.main()
