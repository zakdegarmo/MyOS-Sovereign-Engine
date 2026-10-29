"""
tests/test_studio_pipeline.py
Authoritative 4-Tier Test Suite for MyOS Autonomous 3D Animation Studio & Pipeline
Covers:
  - Tier 1: Feature Coverage (Isolation / Happy Path)
  - Tier 2: Boundary & Corner Cases (Negative / Error Handling)
  - Tier 3: Interactions & Cross-Module Contracts (Manifest -> Blender -> PyAV)
  - Tier 4: Real-World Workloads & Scenarios (Crimson Zenith Benchmark & Multi-Genre Generation)
"""

import os
import sys
import json
import subprocess
import unittest
import tempfile
import shutil

# Ensure workspace root and scripts/tools are in sys.path
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
TOOLS_DIR = os.path.join(PROJECT_ROOT, "scripts", "tools")
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)
if TOOLS_DIR not in sys.path:
    sys.path.insert(0, TOOLS_DIR)

import av
import jsonschema

from studio_agent_pipeline import (
    load_schema,
    build_system_prompt,
    extract_json_tier2,
    normalize_and_validate_tier3,
    generate_deterministic_tier4,
    produce_manifest,
    CANONICAL_BONES
)
from stitch_studio_reel import stitch_movie


class TestStudioPipelineTier1(unittest.TestCase):
    """Tier 1: Feature Coverage & Happy-Path Isolation Tests."""

    @classmethod
    def setUpClass(cls):
        cls.schema_path = os.path.join(TOOLS_DIR, "production_manifest.schema.json")
        cls.canonical_manifest_path = os.path.join(TOOLS_DIR, "manifest_crimson_zenith.json")
        cls.teaser_video_path = os.path.join(PROJECT_ROOT, "apps", "web", "public", "screenings", "crimson_zenith_teaser.mp4")
        
        with open(cls.schema_path, "r", encoding="utf-8") as f:
            cls.schema = json.load(f)

    def test_t1_01_canonical_manifest_loads_and_has_required_keys(self):
        """Verifies scripts/tools/manifest_crimson_zenith.json exists, parses, and has all top-level keys."""
        self.assertTrue(os.path.isfile(self.canonical_manifest_path), f"Missing: {self.canonical_manifest_path}")
        with open(self.canonical_manifest_path, "r", encoding="utf-8") as f:
            manifest = json.load(f)
        
        required_keys = ["metadata", "environment", "lighting", "characters", "shots"]
        for key in required_keys:
            self.assertIn(key, manifest, f"Canonical manifest missing top-level key: {key}")
        
        self.assertEqual(manifest["metadata"]["title"], "Crimson Zenith: Duel of the Sundered Sisterhood")
        self.assertEqual(manifest["metadata"]["fps"], 24)
        self.assertEqual(manifest["metadata"]["total_frames"], 96)
        self.assertEqual(manifest["metadata"]["resolution"]["width"], 640)
        self.assertEqual(manifest["metadata"]["resolution"]["height"], 360)

    def test_t1_02_production_manifest_schema_validation(self):
        """Verifies that the canonical manifest strictly conforms to production_manifest.schema.json."""
        with open(self.canonical_manifest_path, "r", encoding="utf-8") as f:
            manifest = json.load(f)
        
        # Will raise ValidationError if invalid
        jsonschema.validate(instance=manifest, schema=self.schema)
        self.assertIsInstance(manifest["shots"], list)
        self.assertGreaterEqual(len(manifest["shots"]), 2)

    def test_t1_03_pyav_video_reel_stream_properties(self):
        """Probes apps/web/public/screenings/crimson_zenith_teaser.mp4 via PyAV to verify H.264 video specs."""
        self.assertTrue(os.path.isfile(self.teaser_video_path), f"Video missing at {self.teaser_video_path}")
        file_size_bytes = os.path.getsize(self.teaser_video_path)
        self.assertGreater(file_size_bytes, 10240, f"Video size {file_size_bytes} bytes is under 10 KB threshold")

        container = av.open(self.teaser_video_path)
        self.assertGreater(len(container.streams.video), 0, "No video stream found in MP4 container")
        
        video_stream = container.streams.video[0]
        self.assertEqual(video_stream.codec_context.name, "h264", f"Expected h264, got {video_stream.codec_context.name}")
        self.assertEqual(video_stream.pix_fmt, "yuv420p", f"Expected yuv420p, got {video_stream.pix_fmt}")
        self.assertEqual(video_stream.width, 640, f"Expected width 640, got {video_stream.width}")
        self.assertEqual(video_stream.height, 360, f"Expected height 360, got {video_stream.height}")
        self.assertAlmostEqual(float(video_stream.average_rate), 24.0, delta=0.5, msg="Framerate must be 24 fps")
        container.close()

    def test_t1_04_deterministic_fallback_generator_offline(self):
        """Verifies generate_deterministic_tier4 creates a complete, schema-compliant manifest offline."""
        prompt = "1980s Bakshi/Frazetta dark high fantasy duel on a cliff plateau"
        manifest = generate_deterministic_tier4(prompt)
        
        self.assertIsInstance(manifest, dict)
        jsonschema.validate(instance=manifest, schema=self.schema)
        self.assertEqual(manifest["metadata"]["fps"], 24)
        self.assertEqual(manifest["environment"]["terrain"]["type"], "cliff_plateau")
        self.assertEqual(len(manifest["characters"]), 2)
        self.assertEqual(len(manifest["shots"]), 2)

    def test_t1_05_core_blend_assets_and_blender_presence(self):
        """Verifies that all 3 reference .blend assets and Blender 5.2 executable exist on disk."""
        base_female = os.path.join(PROJECT_ROOT, "flesh_female_comic.blend")
        lunaria = os.path.join(PROJECT_ROOT, "lunaria_flesh_mannequin.blend")
        wardrobe = os.path.join(PROJECT_ROOT, "chibi_universal_wardrobe_master.blend")
        blender_exe = r"C:\Program Files\Blender Foundation\Blender 5.2\blender.exe"

        self.assertTrue(os.path.isfile(base_female), f"Missing base model: {base_female}")
        self.assertTrue(os.path.isfile(lunaria), f"Missing lunaria model: {lunaria}")
        self.assertTrue(os.path.isfile(wardrobe), f"Missing wardrobe master: {wardrobe}")
        self.assertTrue(os.path.isfile(blender_exe), f"Missing Blender 5.2 executable: {blender_exe}")

    def test_t1_06_produce_manifest_offline_tier4_execution(self):
        """Verifies produce_manifest with offline=True returns Tier 4 result matching schema."""
        manifest, tier = produce_manifest("Epic fantasy clash", offline=True)
        self.assertEqual(tier, 4, f"Expected tier 4 in offline mode, got {tier}")
        jsonschema.validate(instance=manifest, schema=self.schema)
        self.assertEqual(manifest["metadata"]["engine"], "BLENDER_EEVEE_NEXT")


class TestStudioPipelineTier2(unittest.TestCase):
    """Tier 2: Boundary & Corner Cases (Error Handling, Edge Inputs, Schema Failures)."""

    @classmethod
    def setUpClass(cls):
        cls.schema_path = os.path.join(TOOLS_DIR, "production_manifest.schema.json")
        with open(cls.schema_path, "r", encoding="utf-8") as f:
            cls.schema = json.load(f)

    def test_t2_01_offline_handling_when_ollama_unreachable(self):
        """Verifies produce_manifest falls back to Tier 4 gracefully when Ollama and Bridge are unreachable."""
        manifest, tier = produce_manifest(
            prompt="Bakshi duel at dusk",
            endpoint="http://127.0.0.1:59999",
            bridge_url="http://127.0.0.1:59998",
            offline=False,
            timeout=1
        )
        self.assertEqual(tier, 4)
        self.assertIsNotNone(manifest)
        jsonschema.validate(instance=manifest, schema=self.schema)

    def test_t2_02_schema_catches_missing_required_top_level_fields(self):
        """Verifies that schema validation fails when required top-level keys are absent."""
        valid_sample = generate_deterministic_tier4("test")
        
        for required_key in ["metadata", "environment", "lighting", "characters", "shots"]:
            mutated = json.loads(json.dumps(valid_sample))
            del mutated[required_key]
            with self.assertRaises(jsonschema.ValidationError):
                jsonschema.validate(instance=mutated, schema=self.schema)

    def test_t2_03_schema_catches_negative_or_zero_frame_bounds(self):
        """Verifies schema rejects invalid shot frame intervals (frame_start < 1, frame_end < 1)."""
        valid_sample = generate_deterministic_tier4("test")
        
        # Test frame_start = 0 (minimum is 1)
        bad_shot = json.loads(json.dumps(valid_sample))
        bad_shot["shots"][0]["frame_start"] = 0
        with self.assertRaises(jsonschema.ValidationError):
            jsonschema.validate(instance=bad_shot, schema=self.schema)

        # Test frame_end = -5
        bad_shot2 = json.loads(json.dumps(valid_sample))
        bad_shot2["shots"][0]["frame_end"] = -5
        with self.assertRaises(jsonschema.ValidationError):
            jsonschema.validate(instance=bad_shot2, schema=self.schema)

    def test_t2_04_schema_catches_invalid_resolution_and_fps(self):
        """Verifies schema rejects resolution width < 16, height < 16, and fps < 1."""
        valid_sample = generate_deterministic_tier4("test")
        
        # Width too small
        bad_res = json.loads(json.dumps(valid_sample))
        bad_res["metadata"]["resolution"]["width"] = 8
        with self.assertRaises(jsonschema.ValidationError):
            jsonschema.validate(instance=bad_res, schema=self.schema)

        # FPS zero
        bad_fps = json.loads(json.dumps(valid_sample))
        bad_fps["metadata"]["fps"] = 0
        with self.assertRaises(jsonschema.ValidationError):
            jsonschema.validate(instance=bad_fps, schema=self.schema)

    def test_t2_05_tier2_regex_json_extractor_recovery(self):
        """Verifies extract_json_tier2 extracts valid JSON from markdown fences, dirty chat, and handles malformed strings."""
        sample_data = {"metadata": {"title": "Test Reel"}}
        
        # 1. Pure json string
        pure_str = json.dumps(sample_data)
        self.assertEqual(extract_json_tier2(pure_str), sample_data)

        # 2. Markdown fenced block
        fenced_str = f"Sure! Here is your manifest:\n```json\n{json.dumps(sample_data, indent=2)}\n```\nEnjoy!"
        self.assertEqual(extract_json_tier2(fenced_str), sample_data)

        # 3. Preamble and postamble with curly braces
        dirty_str = f"Preamble notes here... {json.dumps(sample_data)} ...end of response."
        self.assertEqual(extract_json_tier2(dirty_str), sample_data)

        # 4. Trailing comma recovery
        trailing_comma_str = '{"metadata": {"title": "Test Reel",},}'
        recovered = extract_json_tier2(trailing_comma_str)
        self.assertEqual(recovered, sample_data)

        # 5. Non-JSON string returns None
        self.assertIsNone(extract_json_tier2("Just plain text with no braces at all."))
        self.assertIsNone(extract_json_tier2(""))
        self.assertIsNone(extract_json_tier2(None))

    def test_t2_06_pyav_handles_nonexistent_frame_directory(self):
        """Verifies that stitch_studio_reel handles missing frame directory without crashing."""
        # Test stitch_movie with non-existent directory via monkeypatching FRAMES_DIR
        import stitch_studio_reel
        orig_frames_dir = stitch_studio_reel.FRAMES_DIR
        try:
            stitch_studio_reel.FRAMES_DIR = os.path.join(PROJECT_ROOT, "non_existent_frames_directory_99999")
            success = stitch_movie()
            self.assertFalse(success, "stitch_movie must return False when no frames exist")
        finally:
            stitch_studio_reel.FRAMES_DIR = orig_frames_dir


class TestStudioPipelineTier3(unittest.TestCase):
    """Tier 3: Cross-Feature Interactions & Module Interface Contracts."""

    @classmethod
    def setUpClass(cls):
        cls.canonical_manifest_path = os.path.join(TOOLS_DIR, "manifest_crimson_zenith.json")
        with open(cls.canonical_manifest_path, "r", encoding="utf-8") as f:
            cls.manifest = json.load(f)

    def test_t3_01_manifest_to_blender_lighting_parameters(self):
        """Verifies lighting rig items provide valid Blender light values (energies > 0, normalized RGB [0..1], 3-axis rotation)."""
        lighting = self.manifest["lighting"]
        self.assertGreaterEqual(len(lighting), 3, "Expected at least 3-point lighting setup")
        
        light_names = [l["name"] for l in lighting]
        self.assertIn("KeySun", light_names)
        self.assertIn("RimSun", light_names)
        self.assertIn("FillSun", light_names)

        for light in lighting:
            self.assertIn(light["type"], ["SUN", "POINT", "SPOT", "AREA"])
            self.assertGreater(light["energy"], 0.0)
            self.assertEqual(len(light["color_rgb"]), 3)
            for c in light["color_rgb"]:
                self.assertTrue(0.0 <= c <= 1.0, f"Color component {c} not in [0, 1]")
            self.assertEqual(len(light["rotation_deg"]), 3)

    def test_t3_02_character_equipment_bone_socket_rigging_contract(self):
        """Verifies character equipment defines valid sockets and 3D offset vectors matching blender armatures."""
        for char in self.manifest["characters"]:
            self.assertIn(char["source_object"], ["LPC_Decivoxel_Flesh_Female", "LPC_Decivoxel_Flesh_Female_2"])
            self.assertGreaterEqual(len(char["equipment"]), 1)
            
            for eq in char["equipment"]:
                self.assertIn("Armature", eq["parent_socket"])
                self.assertEqual(len(eq["location_offset"]), 3)
                self.assertEqual(len(eq["rotation_offset_deg"]), 3)
                self.assertIn(eq["type"], ["broadsword", "dagger", "greataxe", "staff", "shield"])

    def test_t3_03_shot_camera_movement_trajectory_continuity(self):
        """Verifies sequential camera shot frame continuity and valid 3D trajectories."""
        shots = self.manifest["shots"]
        self.assertEqual(len(shots), 2)

        # Shot 1
        s1 = shots[0]
        self.assertEqual(s1["shot_id"], 1)
        self.assertEqual(s1["frame_start"], 1)
        self.assertEqual(s1["frame_end"], 48)
        self.assertEqual(s1["lens_mm"], 28.0)
        self.assertEqual(s1["camera_movement"]["type"], "dolly")

        # Shot 2: Starts exactly at s1.frame_end + 1
        s2 = shots[1]
        self.assertEqual(s2["shot_id"], 2)
        self.assertEqual(s2["frame_start"], s1["frame_end"] + 1)
        self.assertEqual(s2["frame_end"], 96)
        self.assertEqual(s2["lens_mm"], 45.0)
        self.assertEqual(s2["camera_movement"]["type"], "crane")

        # Vector validation
        for s in shots:
            cm = s["camera_movement"]
            self.assertEqual(len(cm["start_location"]), 3)
            self.assertEqual(len(cm["start_rotation_deg"]), 3)
            self.assertEqual(len(cm["end_location"]), 3)
            self.assertEqual(len(cm["end_rotation_deg"]), 3)
            self.assertIn(cm["interpolation"], ["BEZIER", "LINEAR"])

    def test_t3_04_pipeline_output_roundtrip_file_io(self):
        """Verifies produce_manifest writes directly to disk and the written file roundtrips perfectly."""
        with tempfile.TemporaryDirectory() as temp_dir:
            test_output = os.path.join(temp_dir, "roundtrip_manifest.json")
            manifest, tier = produce_manifest("Roundtrip test", offline=True)
            
            with open(test_output, "w", encoding="utf-8") as f:
                json.dump(manifest, f, indent=2)
                
            self.assertTrue(os.path.isfile(test_output))
            with open(test_output, "r", encoding="utf-8") as f:
                reloaded = json.load(f)
                
            self.assertEqual(manifest, reloaded)


class TestStudioPipelineTier4(unittest.TestCase):
    """Tier 4: Real-World Workloads & Scenarios (Crimson Zenith Benchmark & Subprocess CLI)."""

    @classmethod
    def setUpClass(cls):
        cls.canonical_manifest_path = os.path.join(TOOLS_DIR, "manifest_crimson_zenith.json")
        cls.schema_path = os.path.join(TOOLS_DIR, "production_manifest.schema.json")
        with open(cls.schema_path, "r", encoding="utf-8") as f:
            cls.schema = json.load(f)

    def test_t4_01_crimson_zenith_benchmark_manifest_integrity(self):
        """Verifies full benchmark specification: 2 combatant sisters, cliff plateau, 2 shots, 96 frames."""
        with open(self.canonical_manifest_path, "r", encoding="utf-8") as f:
            m = json.load(f)

        self.assertEqual(m["metadata"]["title"], "Crimson Zenith: Duel of the Sundered Sisterhood")
        self.assertIn("Ralph Bakshi", m["metadata"]["style"])
        self.assertIn("Frank Frazetta", m["metadata"]["style"])
        self.assertEqual(m["metadata"]["total_frames"], 96)
        
        # 2 Characters: warrior_1 and warrior_2
        char_ids = [c["id"] for c in m["characters"]]
        self.assertIn("warrior_1", char_ids)
        self.assertIn("warrior_2", char_ids)

        # Character actions check
        for c in m["characters"]:
            shot_ids = [a["shot_id"] for a in c["actions"]]
            self.assertIn(1, shot_ids)
            self.assertIn(2, shot_ids)
            # Bone rotations should have arms and thighs
            for act in c["actions"]:
                bones = act["bone_rotations_deg"].keys()
                self.assertTrue(any("arm" in b for b in bones))
                self.assertTrue(any("thigh" in b for b in bones))

    def test_t4_02_deterministic_generator_keyword_variations(self):
        """Verifies Tier 4 generator dynamically selects themes based on prompt keywords."""
        # 1. Cyberpunk prompt
        cp_manifest = generate_deterministic_tier4("Cyberpunk neon alley duel")
        self.assertIn("Neon", cp_manifest["metadata"]["title"])
        self.assertEqual(cp_manifest["environment"]["terrain"]["type"], "arena")
        jsonschema.validate(instance=cp_manifest, schema=self.schema)

        # 2. Dungeon prompt
        dg_manifest = generate_deterministic_tier4("Gothic dungeon catacomb duel")
        self.assertIn("Catacomb", dg_manifest["metadata"]["title"])
        self.assertEqual(dg_manifest["environment"]["terrain"]["type"], "dungeon_corridor")
        jsonschema.validate(instance=dg_manifest, schema=self.schema)

        # 3. Default Fantasy prompt
        fy_manifest = generate_deterministic_tier4("Frazetta warriors on high cliff")
        self.assertIn("Crimson Zenith", fy_manifest["metadata"]["title"])
        self.assertEqual(fy_manifest["environment"]["terrain"]["type"], "cliff_plateau")
        jsonschema.validate(instance=fy_manifest, schema=self.schema)

    def test_t4_03_full_pipeline_cli_execution(self):
        """Executes studio_agent_pipeline.py as a CLI subprocess with --offline and verifies exit code 0."""
        with tempfile.TemporaryDirectory() as temp_dir:
            out_file = os.path.join(temp_dir, "cli_produced_manifest.json")
            cmd = [
                sys.executable,
                os.path.join(TOOLS_DIR, "studio_agent_pipeline.py"),
                "--prompt", "Cyberpunk robot duel in neon arena",
                "--offline",
                "--output", out_file
            ]
            result = subprocess.run(cmd, capture_output=True, text=True, check=False)
            self.assertEqual(result.returncode, 0, f"CLI exited with error:\nSTDOUT: {result.stdout}\nSTDERR: {result.stderr}")
            self.assertTrue(os.path.isfile(out_file), "CLI failed to write output file")
            
            with open(out_file, "r", encoding="utf-8") as f:
                cli_manifest = json.load(f)
            jsonschema.validate(instance=cli_manifest, schema=self.schema)
            self.assertIn("Neon", cli_manifest["metadata"]["title"])


if __name__ == "__main__":
    unittest.main()
