#!/usr/bin/env python3
"""
Unit and Integration Test Suite for MyOS 3D Animation Studio Milestone 1:
- Production Manifest JSON Schema Validation
- Canonical Crimson Zenith Manifest Compliance
- 4-Tier Agent Pipeline (offline deterministic, regex extraction, tier 3 normalization)
- CLI execution and Agent Bridge endpoint verification
"""

import os
import sys
import json
import unittest
import subprocess
import urllib.request
import urllib.error

WORKSPACE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SCHEMA_PATH = os.path.join(WORKSPACE_ROOT, "scripts", "tools", "production_manifest.schema.json")
CANONICAL_MANIFEST_PATH = os.path.join(WORKSPACE_ROOT, "scripts", "tools", "manifest_crimson_zenith.json")
PIPELINE_SCRIPT = os.path.join(WORKSPACE_ROOT, "scripts", "tools", "studio_agent_pipeline.py")

# Add scripts/tools to path for direct import
sys.path.insert(0, os.path.join(WORKSPACE_ROOT, "scripts", "tools"))
import studio_agent_pipeline as pipeline

try:
    import jsonschema
    HAS_JSONSCHEMA = True
except ImportError:
    HAS_JSONSCHEMA = False


class TestStudioManifestSchema(unittest.TestCase):
    def setUp(self):
        self.assertTrue(os.path.exists(SCHEMA_PATH), f"Schema not found: {SCHEMA_PATH}")
        with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
            self.schema = json.load(f)

    def test_schema_valid_draft07(self):
        """Schema must be valid JSON Schema Draft-07."""
        self.assertEqual(self.schema.get("$schema"), "http://json-schema.org/draft-07/schema#")
        self.assertIn("metadata", self.schema["properties"])
        self.assertIn("environment", self.schema["properties"])
        self.assertIn("lighting", self.schema["properties"])
        self.assertIn("characters", self.schema["properties"])
        self.assertIn("shots", self.schema["properties"])
        if HAS_JSONSCHEMA:
            # Validate the schema itself against Draft-7 metaschema
            jsonschema.Draft7Validator.check_schema(self.schema)

    def test_canonical_manifest_crimson_zenith(self):
        """Canonical Crimson Zenith benchmark manifest must pass schema validation and match film script."""
        self.assertTrue(os.path.exists(CANONICAL_MANIFEST_PATH), f"Canonical manifest not found: {CANONICAL_MANIFEST_PATH}")
        with open(CANONICAL_MANIFEST_PATH, "r", encoding="utf-8") as f:
            manifest = json.load(f)

        if HAS_JSONSCHEMA:
            jsonschema.validate(instance=manifest, schema=self.schema)

        # Verify metadata
        meta = manifest["metadata"]
        self.assertEqual(meta["title"], "Crimson Zenith: Duel of the Sundered Sisterhood")
        self.assertEqual(meta["fps"], 24)
        self.assertEqual(meta["resolution"]["width"], 640)
        self.assertEqual(meta["resolution"]["height"], 360)
        self.assertEqual(meta["total_frames"], 96)
        self.assertEqual(meta["engine"], "BLENDER_EEVEE_NEXT")

        # Verify environment
        env = manifest["environment"]
        self.assertEqual(env["base_blend"], "flesh_female_comic.blend")
        self.assertEqual(env["terrain"]["type"], "cliff_plateau")
        self.assertEqual(env["backdrop"]["type"], "cyclorama_gradient")
        self.assertEqual(len(env["backdrop"]["gradient_stops"]), 3)

        # Verify lighting
        lights = {l["name"]: l for l in manifest["lighting"]}
        self.assertIn("KeySun", lights)
        self.assertIn("RimSun", lights)
        self.assertIn("FillSun", lights)
        self.assertEqual(lights["KeySun"]["energy"], 5.5)
        self.assertEqual(lights["RimSun"]["energy"], 8.0)
        self.assertEqual(lights["FillSun"]["energy"], 1.2)

        # Verify characters
        self.assertEqual(len(manifest["characters"]), 2)
        c1, c2 = manifest["characters"][0], manifest["characters"][1]
        self.assertEqual(c1["id"], "warrior_1")
        self.assertEqual(c2["id"], "warrior_2")
        self.assertEqual(len(c1["equipment"]), 1)
        self.assertEqual(c1["equipment"][0]["type"], "broadsword")
        self.assertEqual(len(c2["equipment"]), 1)
        self.assertEqual(c2["equipment"][0]["type"], "broadsword")

        # Verify poses and bones
        self.assertIn("arm.R", c1["actions"][0]["bone_rotations_deg"])
        self.assertIn("forearm.R", c1["actions"][0]["bone_rotations_deg"])
        self.assertIn("thigh.L", c1["actions"][0]["bone_rotations_deg"])

        # Verify shots
        shots = manifest["shots"]
        self.assertEqual(len(shots), 2)
        self.assertEqual(shots[0]["shot_id"], 1)
        self.assertEqual(shots[0]["frame_start"], 1)
        self.assertEqual(shots[0]["frame_end"], 48)
        self.assertEqual(shots[0]["lens_mm"], 28.0)
        self.assertEqual(shots[0]["camera_movement"]["type"], "dolly")

        self.assertEqual(shots[1]["shot_id"], 2)
        self.assertEqual(shots[1]["frame_start"], 49)
        self.assertEqual(shots[1]["frame_end"], 96)
        self.assertEqual(shots[1]["lens_mm"], 45.0)
        self.assertEqual(shots[1]["camera_movement"]["type"], "crane")


class TestStudioAgentPipelineTiers(unittest.TestCase):
    def setUp(self):
        self.schema = pipeline.load_schema()

    def test_tier4_deterministic_crimson_zenith(self):
        """Tier 4 deterministic generator for Crimson Zenith must be valid."""
        manifest, tier = pipeline.produce_manifest("1980s Bakshi/Frazetta dark fantasy duel on a cliff plateau", offline=True)
        self.assertEqual(tier, 4)
        if HAS_JSONSCHEMA:
            jsonschema.validate(instance=manifest, schema=self.schema)
        self.assertIn("Crimson Zenith", manifest["metadata"]["title"])
        self.assertEqual(manifest["metadata"]["total_frames"], 96)
        self.assertEqual(len(manifest["shots"]), 2)
        self.assertEqual(len(manifest["characters"]), 2)

    def test_tier4_deterministic_cyberpunk(self):
        """Tier 4 deterministic generator for Cyberpunk prompt."""
        manifest, tier = pipeline.produce_manifest("Cyberpunk neon combat in a high-tech arena", offline=True)
        self.assertEqual(tier, 4)
        if HAS_JSONSCHEMA:
            jsonschema.validate(instance=manifest, schema=self.schema)
        self.assertIn("Neon", manifest["metadata"]["title"])
        self.assertEqual(manifest["environment"]["terrain"]["type"], "arena")

    def test_tier4_deterministic_dungeon(self):
        """Tier 4 deterministic generator for Dungeon prompt."""
        manifest, tier = pipeline.produce_manifest("Gothic dark fantasy dungeon catacomb battle", offline=True)
        self.assertEqual(tier, 4)
        if HAS_JSONSCHEMA:
            jsonschema.validate(instance=manifest, schema=self.schema)
        self.assertEqual(manifest["environment"]["terrain"]["type"], "dungeon_corridor")

    def test_tier2_regex_extraction(self):
        """Tier 2 extracts JSON correctly from code blocks and surrounding text."""
        sample_json = {
            "metadata": {"title": "Test", "fps": 24, "resolution": {"width": 640, "height": 360}, "total_frames": 96, "engine": "BLENDER_EEVEE_NEXT"}
        }
        # Wrapped in markdown
        wrapped = f"Here is the manifest you requested:\n```json\n{json.dumps(sample_json, indent=2)}\n```\nEnjoy filming!"
        extracted = pipeline.extract_json_tier2(wrapped)
        self.assertIsNotNone(extracted)
        self.assertEqual(extracted["metadata"]["title"], "Test")

        # Surrounding conversational text without markdown
        raw_surrounded = f"Director thoughts: Awesome!\n{json.dumps(sample_json)}\nEnd of message."
        extracted2 = pipeline.extract_json_tier2(raw_surrounded)
        self.assertIsNotNone(extracted2)
        self.assertEqual(extracted2["metadata"]["title"], "Test")

        # Trailing commas recovery
        bad_json = '{"metadata": {"title": "Test",}, "list": [1, 2, 3,]}'
        extracted3 = pipeline.extract_json_tier2(bad_json)
        self.assertIsNotNone(extracted3)
        self.assertEqual(extracted3["metadata"]["title"], "Test")

    def test_tier3_normalization_and_default_injection(self):
        """Tier 3 normalizes partial/missing fields, validates bone names, and sets contiguous frames."""
        minimal_input = {
            "metadata": {"title": "Minimal Test"},
            "environment": {},
            "lighting": [],
            "characters": [
                {
                    "id": "hero",
                    "actions": [{"shot_id": 1, "pose_name": "stance", "bone_rotations_deg": {"arm.R": [10, 20, 30]}}]
                }
            ],
            "shots": [
                {"shot_id": 1, "frame_start": 1, "frame_end": 48},
                {"shot_id": 2, "frame_start": 40, "frame_end": 80}  # Overlapping frame_start must be normalized
            ]
        }
        normalized = pipeline.normalize_and_validate_tier3(minimal_input, self.schema)
        self.assertIsNotNone(normalized)
        # Check injected defaults
        self.assertEqual(normalized["metadata"]["fps"], 24)
        self.assertEqual(normalized["metadata"]["engine"], "BLENDER_EEVEE_NEXT")
        self.assertEqual(normalized["environment"]["base_blend"], "flesh_female_comic.blend")
        self.assertEqual(len(normalized["lighting"]), 3)
        # Check shot frames were normalized to be contiguous
        shots = normalized["shots"]
        self.assertEqual(shots[0]["frame_start"], 1)
        self.assertEqual(shots[0]["frame_end"], 48)
        self.assertEqual(shots[1]["frame_start"], 49)  # Adjusted from 40 to 49
        self.assertGreater(shots[1]["frame_end"], 49)
        self.assertEqual(normalized["metadata"]["total_frames"], shots[1]["frame_end"])


class TestCLIAndBridgeIntegration(unittest.TestCase):
    def test_cli_execution_offline(self):
        """CLI invocation with --offline writes manifest and returns exit code 0."""
        out_path = os.path.join(WORKSPACE_ROOT, "temp_studio_frames", "cli_test_manifest.json")
        if os.path.exists(out_path):
            os.remove(out_path)

        cmd = [
            sys.executable,
            PIPELINE_SCRIPT,
            "--offline",
            "--prompt", "Crimson Zenith duel on a cliff plateau",
            "--output", out_path
        ]
        res = subprocess.run(cmd, capture_output=True, text=True, cwd=WORKSPACE_ROOT)
        self.assertEqual(res.returncode, 0, f"CLI failed: {res.stderr}")
        self.assertTrue(os.path.exists(out_path), "Output manifest file was not created")

        with open(out_path, "r", encoding="utf-8") as f:
            manifest = json.load(f)
        self.assertIn("Crimson Zenith", manifest["metadata"]["title"])

    def test_cli_json_stdout(self):
        """CLI invocation with --json-stdout prints valid JSON."""
        cmd = [
            sys.executable,
            PIPELINE_SCRIPT,
            "--offline",
            "--json-stdout"
        ]
        res = subprocess.run(cmd, capture_output=True, text=True, cwd=WORKSPACE_ROOT)
        self.assertEqual(res.returncode, 0)
        parsed = json.loads(res.stdout)
        self.assertIn("metadata", parsed)
        self.assertIn("shots", parsed)

    def test_agent_bridge_manifest_endpoint(self):
        """Test POST /api/studio/manifest on Agent Bridge on localhost:8081."""
        body = json.dumps({"offline": True, "prompt": "Crimson Zenith duel"}).encode("utf-8")
        req = urllib.request.Request(
            "http://localhost:8081/api/studio/manifest",
            data=body,
            headers={"Content-Type": "application/json"}
        )
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                self.assertEqual(resp.status, 200)
                data = json.loads(resp.read().decode("utf-8"))
                self.assertTrue(data.get("success"))
                self.assertIn("manifest", data)
                self.assertIn("metadata", data["manifest"])
                self.assertIn("shots", data["manifest"])
        except urllib.error.URLError as e:
            self.fail(f"Could not connect to Agent Bridge: {e}")


if __name__ == "__main__":
    unittest.main()
