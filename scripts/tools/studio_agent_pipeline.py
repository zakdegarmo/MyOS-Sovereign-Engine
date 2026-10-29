#!/usr/bin/env python3
"""
MyOS Autonomous 3D Animation Studio: Local Agent Pipeline & Manifest Engine
Personas:
  - Director Agent: High-level vision, tone, dramatic pacing, thematic styling, scene arc.
  - Screenwriter Agent: Staging, actor placement, combat choreography, poses, wardrobe/sockets.
  - DP (Director of Photography) Agent: Cinematic framing, lenses, camera movement, chiaroscuro lighting.

4-Tier Fallback Architecture:
  - Tier 1: Local Ollama / Agent Bridge JSON response (format: json).
  - Tier 2: Regex extraction from code blocks / raw text.
  - Tier 3: Schema validation, normalization, and default injection.
  - Tier 4: Deterministic rule-based fallback generator parsing prompt keywords.
"""

import os
import sys
import json
import re
import argparse
import urllib.request
import urllib.error

# Windows PowerShell UTF-8 encoding protection
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except AttributeError:
        pass

# Optional jsonschema import with graceful fallback
try:
    import jsonschema
    HAS_JSONSCHEMA = True
except ImportError:
    HAS_JSONSCHEMA = False

WORKSPACE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
SCHEMA_PATH = os.path.join(os.path.dirname(__file__), "production_manifest.schema.json")
DEFAULT_OUTPUT = os.path.join(WORKSPACE_ROOT, "temp_studio_frames", "production_manifest.json")

CANONICAL_BONES = {
    "arm.R", "forearm.R", "hand.R",
    "arm.L", "forearm.L", "hand.L",
    "thigh.R", "shin.R", "foot.R",
    "thigh.L", "shin.L", "foot.L",
    "spine", "chest", "neck", "head"
}


def load_schema():
    """Load canonical production manifest schema."""
    if os.path.exists(SCHEMA_PATH):
        try:
            with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            sys.stderr.write(f"[Pipeline] Warning: failed to load schema file: {e}\n")
    return None


def build_system_prompt():
    """Construct multi-agent system prompt incorporating Director, DP, and Screenwriter."""
    return (
        "You are the MyOS 3D Animation Studio Production Council, consisting of three expert personas:\n"
        "1. DIRECTOR AGENT: Defines thematic tone, high-level narrative conflict, visual style, dramatic pacing, and total runtime.\n"
        "2. SCREENWRITER AGENT: Choreographs scene staging, character positions, bone rotations, weapon attachments, and combat actions.\n"
        "3. DP (DIRECTOR OF PHOTOGRAPHY) AGENT: Designs multi-shot camera cinematography (dolly, crane, tracking), focal lengths (lens_mm), and 3-point chiaroscuro lighting (KeySun, RimSun, FillSun).\n\n"
        "Your task is to synthesize the user's creative prompt into a single, valid JSON production manifest.\n"
        "The JSON MUST follow this exact schema structure:\n"
        "{\n"
        '  "metadata": {\n'
        '    "title": "string",\n'
        '    "style": "string",\n'
        '    "fps": 24,\n'
        '    "resolution": { "width": 640, "height": 360 },\n'
        '    "total_frames": 96,\n'
        '    "engine": "BLENDER_EEVEE_NEXT"\n'
        "  },\n"
        '  "environment": {\n'
        '    "base_blend": "flesh_female_comic.blend",\n'
        '    "terrain": {\n'
        '      "type": "cliff_plateau",\n'
        '      "dimensions": [12.0, 8.0, 15.0],\n'
        '      "material": {\n'
        '        "name": "Crag_Rock",\n'
        '        "base_rgba": [0.35, 0.25, 0.22, 1.0],\n'
        '        "shadow_rgba": [0.12, 0.08, 0.15, 1.0],\n'
        '        "rim_rgba": [0.8, 0.3, 0.1, 1.0]\n'
        "      }\n"
        "    },\n"
        '    "backdrop": {\n'
        '      "type": "cyclorama_gradient",\n'
        '      "emission_strength": 1.8,\n'
        '      "gradient_stops": [\n'
        '        { "position": 0.0, "color_rgba": [1.0, 0.45, 0.05, 1.0] },\n'
        '        { "position": 0.4, "color_rgba": [0.75, 0.08, 0.18, 1.0] },\n'
        '        { "position": 1.0, "color_rgba": [0.06, 0.04, 0.18, 1.0] }\n'
        "      ]\n"
        "    }\n"
        "  },\n"
        '  "lighting": [\n'
        '    { "name": "KeySun", "type": "SUN", "energy": 5.5, "color_rgb": [1.0, 0.55, 0.2], "rotation_deg": [65.0, -15.0, -45.0] },\n'
        '    { "name": "RimSun", "type": "SUN", "energy": 8.0, "color_rgb": [1.0, 0.1, 0.5], "rotation_deg": [-40.0, 20.0, 135.0] },\n'
        '    { "name": "FillSun", "type": "SUN", "energy": 1.2, "color_rgb": [0.2, 0.25, 0.6], "rotation_deg": [0.0, 0.0, 0.0] }\n'
        "  ],\n"
        '  "characters": [\n'
        "    {\n"
        '      "id": "warrior_1",\n'
        '      "name": "string",\n'
        '      "source_object": "LPC_Decivoxel_Flesh_Female",\n'
        '      "material": { "name": "string", "base_rgba": [0.92, 0.72, 0.58, 1.0], "shadow_rgba": [0.45, 0.18, 0.22, 1.0], "rim_rgba": [1.0, 0.3, 0.5, 1.0] },\n'
        '      "initial_transform": { "location": [-1.4, 0.0, 0.1], "rotation_deg": [0.0, 0.0, 80.0] },\n'
        '      "equipment": [\n'
        '        { "name": "Warrior1_Broadsword", "type": "broadsword", "parent_socket": "Armature", "location_offset": [0.4, 0.2, 0.9], "rotation_offset_deg": [45.0, 30.0, 0.0], "material": { "name": "Frazetta_Steel", "base_rgba": [0.8, 0.88, 0.95, 1.0], "shadow_rgba": [0.15, 0.2, 0.35, 1.0], "rim_rgba": [1.0, 0.9, 0.5, 1.0] } }\n'
        "      ],\n"
        '      "actions": [\n'
        '        { "shot_id": 1, "pose_name": "string", "bone_rotations_deg": { "arm.R": [-65.0, 40.0, -30.0], "forearm.R": [-45.0, 0.0, 20.0], "arm.L": [25.0, -30.0, 0.0], "thigh.L": [25.0, 0.0, 0.0], "thigh.R": [-25.0, 0.0, 0.0] } },\n'
        '        { "shot_id": 2, "pose_name": "string", "bone_rotations_deg": { "arm.R": [-50.0, 30.0, -20.0], "forearm.R": [-35.0, 10.0, 15.0], "arm.L": [15.0, -20.0, 0.0], "thigh.L": [30.0, 0.0, 0.0], "thigh.R": [-30.0, 0.0, 0.0] } }\n'
        "      ]\n"
        "    }\n"
        "  ],\n"
        '  "shots": [\n'
        "    {\n"
        '      "shot_id": 1,\n'
        '      "name": "string",\n'
        '      "frame_start": 1,\n'
        '      "frame_end": 48,\n'
        '      "lens_mm": 28.0,\n'
        '      "camera_movement": {\n'
        '        "type": "dolly",\n'
        '        "start_location": [-4.8, -4.5, 0.8],\n'
        '        "start_rotation_deg": [78.0, 0.0, -40.0],\n'
        '        "end_location": [-3.2, -3.8, 0.5],\n'
        '        "end_rotation_deg": [82.0, 0.0, -32.0],\n'
        '        "interpolation": "BEZIER"\n'
        "      }\n"
        "    },\n"
        "    {\n"
        '      "shot_id": 2,\n'
        '      "name": "string",\n'
        '      "frame_start": 49,\n'
        '      "frame_end": 96,\n'
        '      "lens_mm": 45.0,\n'
        '      "camera_movement": {\n'
        '        "type": "crane",\n'
        '        "start_location": [0.0, -2.2, 0.2],\n'
        '        "start_rotation_deg": [65.0, 0.0, 0.0],\n'
        '        "end_location": [0.3, -1.5, 0.9],\n'
        '        "end_rotation_deg": [52.0, 0.0, 12.0],\n'
        '        "interpolation": "BEZIER"\n'
        "      }\n"
        "    }\n"
        "  ]\n"
        "}\n\n"
        "Strict rules:\n"
        "- Return ONLY the raw JSON object.\n"
        "- Do not include markdown code block ticks (```) or preamble.\n"
        "- Ensure total_frames matches the maximum frame_end across all shots.\n"
        "- Shots must be sequential and contiguous."
    )


def query_ollama(prompt, model="gemma4:latest", endpoint="http://localhost:11434", timeout=45):
    """Tier 1: Request Ollama generate endpoint with format: json."""
    url = f"{endpoint.rstrip('/')}/api/generate"
    payload = {
        "model": model,
        "system": build_system_prompt(),
        "prompt": f"Produce a production manifest JSON for this creative direction:\n{prompt}",
        "stream": False,
        "format": "json",
        "options": {
            "temperature": 0.4
        }
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        res_body = json.loads(resp.read().decode("utf-8"))
        return res_body.get("response", "")


def query_agent_bridge(prompt, model="gemma4:latest", bridge_url="http://localhost:8081", timeout=45):
    """Tier 1 Fallback: Query Agent Bridge Gemini proxy."""
    url = f"{bridge_url.rstrip('/')}/v1beta/models/{model}:generateContent"
    payload = {
        "systemInstruction": {
            "parts": [{"text": build_system_prompt()}]
        },
        "contents": [
            {
                "role": "user",
                "parts": [{"text": f"Produce a production manifest JSON for this creative direction:\n{prompt}"}]
            }
        ],
        "generationConfig": {
            "temperature": 0.4,
            "responseMimeType": "application/json"
        }
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        res_body = json.loads(resp.read().decode("utf-8"))
        candidates = res_body.get("candidates", [])
        if candidates and "content" in candidates[0]:
            parts = candidates[0]["content"].get("parts", [])
            if parts:
                return parts[0].get("text", "")
    return ""


def extract_json_tier2(raw_text):
    """Tier 2: Robust regex extraction from code blocks or raw string."""
    if not raw_text or not isinstance(raw_text, str):
        return None

    cleaned = raw_text.strip()

    # Try direct parse
    try:
        return json.loads(cleaned)
    except Exception:
        pass

    # Try regex matching markdown code blocks
    pattern = r"```(?:json)?\s*(\{[\s\S]*?\})\s*```"
    match = re.search(pattern, cleaned)
    if match:
        try:
            return json.loads(match.group(1))
        except Exception:
            pass

    # Try finding outermost curly braces
    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start != -1 and end != -1 and end > start:
        snippet = cleaned[start:end + 1]
        try:
            return json.loads(snippet)
        except Exception:
            # Handle trailing commas
            relaxed = re.sub(r",\s*([\}\]])", r"\1", snippet)
            try:
                return json.loads(relaxed)
            except Exception:
                pass

    return None


def normalize_and_validate_tier3(manifest, schema=None):
    """Tier 3: Schema validation, normalization, and default injection."""
    try:
        if not isinstance(manifest, dict):
            return None

        # Deep copy to avoid mutating source
        data = json.loads(json.dumps(manifest))

        # Filter out non-dict elements from lists defensively
        if "characters" in data and isinstance(data["characters"], list):
            data["characters"] = [c for c in data["characters"] if isinstance(c, dict)]
            for c in data["characters"]:
                if "equipment" in c and isinstance(c["equipment"], list):
                    c["equipment"] = [eq for eq in c["equipment"] if isinstance(eq, dict)]
                if "actions" in c and isinstance(c["actions"], list):
                    c["actions"] = [act for act in c["actions"] if isinstance(act, dict)]
        if "shots" in data and isinstance(data["shots"], list):
            data["shots"] = [s for s in data["shots"] if isinstance(s, dict)]
        if "lighting" in data and isinstance(data["lighting"], list):
            data["lighting"] = [l for l in data["lighting"] if isinstance(l, dict)]

        # 1. Normalize metadata
        if "metadata" not in data or not isinstance(data["metadata"], dict):
            data["metadata"] = {}
        meta = data["metadata"]
        meta["title"] = str(meta.get("title") or "Studio Production Reel")
        meta["style"] = str(meta.get("style") or "Cinematic 3D Animation")
        try:
            fps_val = int(meta.get("fps") or 24)
            meta["fps"] = max(1, fps_val)
        except (ValueError, TypeError):
            meta["fps"] = 24
        try:
            tf_val = int(meta.get("total_frames") or 96)
            meta["total_frames"] = max(1, tf_val)
        except (ValueError, TypeError):
            meta["total_frames"] = 96
        if "resolution" not in meta or not isinstance(meta["resolution"], dict):
            meta["resolution"] = {"width": 640, "height": 360}
        else:
            try:
                rw = int(meta["resolution"].get("width") or 640)
                rh = int(meta["resolution"].get("height") or 360)
                meta["resolution"]["width"] = max(16, rw)
                meta["resolution"]["height"] = max(16, rh)
            except (ValueError, TypeError):
                meta["resolution"]["width"] = 640
                meta["resolution"]["height"] = 360
        meta["engine"] = meta.get("engine") or "BLENDER_EEVEE_NEXT"
        if meta["engine"] not in ["BLENDER_EEVEE_NEXT", "BLENDER_EEVEE", "CYCLES"]:
            meta["engine"] = "BLENDER_EEVEE_NEXT"

        # 2. Normalize environment
        if "environment" not in data or not isinstance(data["environment"], dict):
            data["environment"] = {}
        env = data["environment"]
        env["base_blend"] = str(env.get("base_blend") or "flesh_female_comic.blend")

        if "terrain" not in env or not isinstance(env["terrain"], dict):
            env["terrain"] = {}
        t = env["terrain"]
        if t.get("type") not in ["cliff_plateau", "arena", "dungeon_corridor", "flat_ground"]:
            t["type"] = "cliff_plateau"
        if "dimensions" not in t or not isinstance(t["dimensions"], list) or len(t["dimensions"]) != 3:
            t["dimensions"] = [12.0, 8.0, 15.0]
        else:
            try:
                t["dimensions"] = [float(x) for x in t["dimensions"][:3]]
                if len(t["dimensions"]) != 3:
                    t["dimensions"] = [12.0, 8.0, 15.0]
            except (ValueError, TypeError):
                t["dimensions"] = [12.0, 8.0, 15.0]
        if "material" not in t or not isinstance(t["material"], dict):
            t["material"] = {
                "name": "Crag_Rock",
                "base_rgba": [0.35, 0.25, 0.22, 1.0],
                "shadow_rgba": [0.12, 0.08, 0.15, 1.0],
                "rim_rgba": [0.8, 0.3, 0.1, 1.0]
            }

        if "backdrop" not in env or not isinstance(env["backdrop"], dict):
            env["backdrop"] = {}
        b = env["backdrop"]
        if b.get("type") not in ["cyclorama_gradient", "procedural_sky", "solid"]:
            b["type"] = "cyclorama_gradient"
        try:
            b["emission_strength"] = float(b.get("emission_strength") or 1.8)
        except (ValueError, TypeError):
            b["emission_strength"] = 1.8
        if "gradient_stops" not in b or not isinstance(b["gradient_stops"], list) or len(b["gradient_stops"]) == 0:
            b["gradient_stops"] = [
                {"position": 0.0, "color_rgba": [1.0, 0.45, 0.05, 1.0]},
                {"position": 0.4, "color_rgba": [0.75, 0.08, 0.18, 1.0]},
                {"position": 1.0, "color_rgba": [0.06, 0.04, 0.18, 1.0]}
            ]

        # 3. Normalize lighting
        if "lighting" not in data or not isinstance(data["lighting"], list) or len(data["lighting"]) == 0:
            data["lighting"] = [
                {"name": "KeySun", "type": "SUN", "energy": 5.5, "color_rgb": [1.0, 0.55, 0.2], "rotation_deg": [65.0, -15.0, -45.0]},
                {"name": "RimSun", "type": "SUN", "energy": 8.0, "color_rgb": [1.0, 0.1, 0.5], "rotation_deg": [-40.0, 20.0, 135.0]},
                {"name": "FillSun", "type": "SUN", "energy": 1.2, "color_rgb": [0.2, 0.25, 0.6], "rotation_deg": [0.0, 0.0, 0.0]}
            ]
        else:
            for light in data["lighting"]:
                if light.get("type") not in ["SUN", "POINT", "SPOT", "AREA"]:
                    light["type"] = "SUN"
                try:
                    light["energy"] = float(light.get("energy") or 4.0)
                except (ValueError, TypeError):
                    light["energy"] = 4.0
                try:
                    if "color_rgb" not in light or len(light["color_rgb"]) != 3:
                        light["color_rgb"] = [1.0, 1.0, 1.0]
                    else:
                        light["color_rgb"] = [float(x) for x in light["color_rgb"][:3]]
                except (ValueError, TypeError):
                    light["color_rgb"] = [1.0, 1.0, 1.0]
                try:
                    if "rotation_deg" not in light or len(light["rotation_deg"]) != 3:
                        light["rotation_deg"] = [0.0, 0.0, 0.0]
                    else:
                        light["rotation_deg"] = [float(x) for x in light["rotation_deg"][:3]]
                except (ValueError, TypeError):
                    light["rotation_deg"] = [0.0, 0.0, 0.0]

        # 4. Normalize characters
        if "characters" not in data or not isinstance(data["characters"], list) or len(data["characters"]) == 0:
            return None  # Cannot synthesize characters blindly if completely missing
        for char in data["characters"]:
            char["id"] = str(char.get("id") or "actor")
            char["name"] = str(char.get("name") or "Character")
            char["source_object"] = str(char.get("source_object") or "LPC_Decivoxel_Flesh_Female")
            if "material" not in char or not isinstance(char["material"], dict):
                char["material"] = {
                    "name": f"Mat_{char['id']}",
                    "base_rgba": [0.9, 0.7, 0.55, 1.0],
                    "shadow_rgba": [0.4, 0.2, 0.2, 1.0],
                    "rim_rgba": [1.0, 0.3, 0.5, 1.0]
                }
            if "initial_transform" not in char or not isinstance(char["initial_transform"], dict):
                char["initial_transform"] = {"location": [0.0, 0.0, 0.0], "rotation_deg": [0.0, 0.0, 0.0]}
            else:
                loc = char["initial_transform"].get("location", [0.0, 0.0, 0.0])
                rot = char["initial_transform"].get("rotation_deg", [0.0, 0.0, 0.0])
                try:
                    char["initial_transform"]["location"] = [float(x) for x in loc[:3]]
                except (ValueError, TypeError):
                    char["initial_transform"]["location"] = [0.0, 0.0, 0.0]
                try:
                    char["initial_transform"]["rotation_deg"] = [float(x) for x in rot[:3]]
                except (ValueError, TypeError):
                    char["initial_transform"]["rotation_deg"] = [0.0, 0.0, 0.0]

            # Equipment
            if "equipment" not in char or not isinstance(char["equipment"], list):
                char["equipment"] = []
            for eq in char["equipment"]:
                eq["name"] = str(eq.get("name") or "Weapon")
                if eq.get("type") not in ["broadsword", "dagger", "greataxe", "staff", "shield"]:
                    eq["type"] = "broadsword"
                eq["parent_socket"] = str(eq.get("parent_socket") or "Armature")
                try:
                    eq["location_offset"] = [float(x) for x in eq.get("location_offset", [0.0, 0.0, 0.0])[:3]]
                except (ValueError, TypeError):
                    eq["location_offset"] = [0.0, 0.0, 0.0]
                try:
                    eq["rotation_offset_deg"] = [float(x) for x in eq.get("rotation_offset_deg", [0.0, 0.0, 0.0])[:3]]
                except (ValueError, TypeError):
                    eq["rotation_offset_deg"] = [0.0, 0.0, 0.0]
                if "material" not in eq or not isinstance(eq["material"], dict):
                    eq["material"] = {
                        "name": "Mat_Weapon",
                        "base_rgba": [0.8, 0.88, 0.95, 1.0],
                        "shadow_rgba": [0.15, 0.2, 0.35, 1.0],
                        "rim_rgba": [1.0, 0.9, 0.5, 1.0]
                    }

            # Actions & Bone rotations
            if "actions" not in char or not isinstance(char["actions"], list):
                char["actions"] = []
            for act in char["actions"]:
                try:
                    act["shot_id"] = int(act.get("shot_id") or 1)
                except (ValueError, TypeError):
                    act["shot_id"] = 1
                act["pose_name"] = str(act.get("pose_name") or "pose")
                if "bone_rotations_deg" not in act or not isinstance(act["bone_rotations_deg"], dict):
                    act["bone_rotations_deg"] = {}
                cleaned_bones = {}
                for bone, degs in act["bone_rotations_deg"].items():
                    if isinstance(degs, list) and len(degs) == 3:
                        try:
                            cleaned_bones[bone] = [float(d) for d in degs]
                        except (ValueError, TypeError):
                            pass
                act["bone_rotations_deg"] = cleaned_bones

        # 5. Normalize shots
        if "shots" not in data or not isinstance(data["shots"], list) or len(data["shots"]) == 0:
            return None  # Cannot guess shots from nothing
        cur_frame = 1
        for i, shot in enumerate(data["shots"]):
            shot["shot_id"] = i + 1
            shot["name"] = str(shot.get("name") or f"Shot {i + 1}")
            try:
                start = int(shot.get("frame_start") or cur_frame)
            except (ValueError, TypeError):
                start = cur_frame
            try:
                end = int(shot.get("frame_end") or (start + 47))
            except (ValueError, TypeError):
                end = start + 47
            if start < cur_frame:
                start = cur_frame
            if end <= start:
                end = start + 47
            shot["frame_start"] = start
            shot["frame_end"] = end
            cur_frame = end + 1

            try:
                shot["lens_mm"] = float(shot.get("lens_mm") or 35.0)
            except (ValueError, TypeError):
                shot["lens_mm"] = 35.0
            if "camera_movement" not in shot or not isinstance(shot["camera_movement"], dict):
                shot["camera_movement"] = {
                    "type": "dolly",
                    "start_location": [-4.0, -4.0, 1.0],
                    "start_rotation_deg": [75.0, 0.0, -35.0],
                    "end_location": [-3.0, -3.0, 0.8],
                    "end_rotation_deg": [80.0, 0.0, -30.0],
                    "interpolation": "BEZIER"
                }
            else:
                cm = shot["camera_movement"]
                if cm.get("type") not in ["dolly", "crane", "pan", "static", "tracking"]:
                    cm["type"] = "dolly"
                try:
                    cm["start_location"] = [float(x) for x in cm.get("start_location", [-4.0, -4.0, 1.0])[:3]]
                except (ValueError, TypeError):
                    cm["start_location"] = [-4.0, -4.0, 1.0]
                try:
                    cm["start_rotation_deg"] = [float(x) for x in cm.get("start_rotation_deg", [75.0, 0.0, -35.0])[:3]]
                except (ValueError, TypeError):
                    cm["start_rotation_deg"] = [75.0, 0.0, -35.0]
                try:
                    cm["end_location"] = [float(x) for x in cm.get("end_location", [-3.0, -3.0, 0.8])[:3]]
                except (ValueError, TypeError):
                    cm["end_location"] = [-3.0, -3.0, 0.8]
                try:
                    cm["end_rotation_deg"] = [float(x) for x in cm.get("end_rotation_deg", [80.0, 0.0, -30.0])[:3]]
                except (ValueError, TypeError):
                    cm["end_rotation_deg"] = [80.0, 0.0, -30.0]
                if cm.get("interpolation") not in ["BEZIER", "LINEAR"]:
                    cm["interpolation"] = "BEZIER"

        # Synchronize total_frames with maximum shot frame_end
        data["metadata"]["total_frames"] = max(s["frame_end"] for s in data["shots"])

        # Validate against schema if available
        if schema and HAS_JSONSCHEMA:
            try:
                jsonschema.validate(instance=data, schema=schema)
            except jsonschema.ValidationError as ve:
                sys.stderr.write(f"[Pipeline] Tier 3 jsonschema validation error: {ve.message}\n")
                return None

        return data
    except Exception as e:
        sys.stderr.write(f"[Pipeline] Tier 3 unhandled exception caught: {e}\n")
        return None


def generate_deterministic_tier4(prompt=""):
    """
    Tier 4: Deterministic rule-based fallback generator.
    Parses keywords in the prompt (e.g. frazetta, bakshi, duel, cliff, sunset, cyberpunk, dungeon)
    and produces a guaranteed 100% schema-compliant production manifest.
    """
    p_lower = prompt.lower() if isinstance(prompt, str) else str(prompt).lower() if prompt is not None else ""

    # Genre & Palette Detection
    if any(k in p_lower for k in ["cyberpunk", "neon", "sci-fi", "mech"]):
        title = "Neon Reckoning: Cyber Claws at Midnight"
        style = "1980s Anime Cyberpunk & Neo-Tokyo Cel Shading"
        terrain_type = "arena"
        terrain_dim = [10.0, 10.0, 1.0]
        terrain_mat = {"name": "Neon_Grid", "base_rgba": [0.1, 0.1, 0.15, 1.0], "shadow_rgba": [0.02, 0.02, 0.05, 1.0], "rim_rgba": [0.0, 0.9, 1.0, 1.0]}
        backdrop_type = "cyclorama_gradient"
        gradient_stops = [
            {"position": 0.0, "color_rgba": [0.0, 0.9, 1.0, 1.0]},   # Cyan
            {"position": 0.5, "color_rgba": [0.8, 0.0, 0.6, 1.0]},   # Magenta
            {"position": 1.0, "color_rgba": [0.05, 0.0, 0.15, 1.0]}  # Dark Purple
        ]
        lights = [
            {"name": "KeySun", "type": "SUN", "energy": 6.0, "color_rgb": [0.1, 0.8, 1.0], "rotation_deg": [50.0, -10.0, -30.0]},
            {"name": "RimSun", "type": "SUN", "energy": 9.0, "color_rgb": [1.0, 0.05, 0.6], "rotation_deg": [-35.0, 15.0, 140.0]},
            {"name": "FillSun", "type": "SUN", "energy": 1.5, "color_rgb": [0.2, 0.05, 0.4], "rotation_deg": [0.0, 0.0, 0.0]}
        ]
    elif any(k in p_lower for k in ["dungeon", "crypt", "catacomb", "underground"]):
        title = "Shadow Catacomb: Clash in the Dark"
        style = "Grimdark Gothic High Fantasy"
        terrain_type = "dungeon_corridor"
        terrain_dim = [8.0, 14.0, 4.0]
        terrain_mat = {"name": "Dungeon_Cobble", "base_rgba": [0.2, 0.2, 0.2, 1.0], "shadow_rgba": [0.05, 0.05, 0.05, 1.0], "rim_rgba": [0.4, 0.6, 0.5, 1.0]}
        backdrop_type = "solid"
        gradient_stops = [
            {"position": 0.0, "color_rgba": [0.1, 0.12, 0.1, 1.0]},
            {"position": 1.0, "color_rgba": [0.02, 0.02, 0.02, 1.0]}
        ]
        lights = [
            {"name": "KeySun", "type": "SUN", "energy": 4.0, "color_rgb": [0.9, 0.6, 0.2], "rotation_deg": [70.0, 0.0, -20.0]},
            {"name": "RimSun", "type": "SUN", "energy": 5.0, "color_rgb": [0.3, 0.7, 0.6], "rotation_deg": [-50.0, 30.0, 120.0]},
            {"name": "FillSun", "type": "SUN", "energy": 0.8, "color_rgb": [0.05, 0.05, 0.1], "rotation_deg": [0.0, 0.0, 0.0]}
        ]
    else:
        # Canonical Bakshi / Frazetta Sunset Cliff Duel benchmark setup
        title = "Crimson Zenith: Duel of the Sundered Sisterhood"
        style = "1980s Ralph Bakshi meets Frank Frazetta Heavy Metal Dark Fantasy"
        terrain_type = "cliff_plateau"
        terrain_dim = [12.0, 8.0, 15.0]
        terrain_mat = {
            "name": "Crag_Rock",
            "base_rgba": [0.35, 0.25, 0.22, 1.0],
            "shadow_rgba": [0.12, 0.08, 0.15, 1.0],
            "rim_rgba": [0.8, 0.3, 0.1, 1.0]
        }
        backdrop_type = "cyclorama_gradient"
        gradient_stops = [
            {"position": 0.0, "color_rgba": [1.0, 0.45, 0.05, 1.0]},  # Sunset Gold
            {"position": 0.4, "color_rgba": [0.75, 0.08, 0.18, 1.0]},  # Blood Crimson
            {"position": 1.0, "color_rgba": [0.06, 0.04, 0.18, 1.0]}  # Night Ultramarine
        ]
        lights = [
            {"name": "KeySun", "type": "SUN", "energy": 5.5, "color_rgb": [1.0, 0.55, 0.2], "rotation_deg": [65.0, -15.0, -45.0]},
            {"name": "RimSun", "type": "SUN", "energy": 8.0, "color_rgb": [1.0, 0.1, 0.5], "rotation_deg": [-40.0, 20.0, 135.0]},
            {"name": "FillSun", "type": "SUN", "energy": 1.2, "color_rgb": [0.2, 0.25, 0.6], "rotation_deg": [0.0, 0.0, 0.0]}
        ]

    # Two Combatants: Sister of Crimson and Sister of Zenith
    characters = [
        {
            "id": "warrior_1",
            "name": "Warrior 1 (Sister of Crimson)",
            "source_object": "LPC_Decivoxel_Flesh_Female",
            "material": {
                "name": "Bakshi_Flesh_1",
                "base_rgba": [0.92, 0.72, 0.58, 1.0],
                "shadow_rgba": [0.45, 0.18, 0.22, 1.0],
                "rim_rgba": [1.0, 0.3, 0.5, 1.0]
            },
            "initial_transform": {
                "location": [-1.4, 0.0, 0.1],
                "rotation_deg": [0.0, 0.0, 80.0]
            },
            "equipment": [
                {
                    "name": "Warrior1_Broadsword",
                    "type": "broadsword",
                    "parent_socket": "Armature",
                    "location_offset": [0.4, 0.2, 0.9],
                    "rotation_offset_deg": [45.0, 30.0, 0.0],
                    "material": {
                        "name": "Frazetta_Steel",
                        "base_rgba": [0.8, 0.88, 0.95, 1.0],
                        "shadow_rgba": [0.15, 0.2, 0.35, 1.0],
                        "rim_rgba": [1.0, 0.9, 0.5, 1.0]
                    }
                }
            ],
            "actions": [
                {
                    "shot_id": 1,
                    "pose_name": "striking_overhand_cleave",
                    "bone_rotations_deg": {
                        "arm.R": [-65.0, 40.0, -30.0],
                        "forearm.R": [-45.0, 0.0, 20.0],
                        "arm.L": [25.0, -30.0, 0.0],
                        "thigh.L": [25.0, 0.0, 0.0],
                        "thigh.R": [-25.0, 0.0, 0.0]
                    }
                },
                {
                    "shot_id": 2,
                    "pose_name": "blade_lock_clash",
                    "bone_rotations_deg": {
                        "arm.R": [-50.0, 30.0, -20.0],
                        "forearm.R": [-35.0, 10.0, 15.0],
                        "arm.L": [15.0, -20.0, 0.0],
                        "thigh.L": [30.0, 0.0, 0.0],
                        "thigh.R": [-30.0, 0.0, 0.0]
                    }
                }
            ]
        },
        {
            "id": "warrior_2",
            "name": "Warrior 2 (Sister of Zenith)",
            "source_object": "LPC_Decivoxel_Flesh_Female_2",
            "duplicate_from": "LPC_Decivoxel_Flesh_Female",
            "material": {
                "name": "Bakshi_Flesh_2",
                "base_rgba": [0.85, 0.65, 0.52, 1.0],
                "shadow_rgba": [0.38, 0.14, 0.20, 1.0],
                "rim_rgba": [0.2, 0.8, 1.0, 1.0]
            },
            "initial_transform": {
                "location": [1.4, 0.0, 0.1],
                "rotation_deg": [0.0, 0.0, -100.0]
            },
            "equipment": [
                {
                    "name": "Warrior2_Broadsword",
                    "type": "broadsword",
                    "parent_socket": "Armature_2",
                    "location_offset": [-0.3, 0.1, 0.8],
                    "rotation_offset_deg": [-45.0, -25.0, 0.0],
                    "material": {
                        "name": "Frazetta_Steel",
                        "base_rgba": [0.8, 0.88, 0.95, 1.0],
                        "shadow_rgba": [0.15, 0.2, 0.35, 1.0],
                        "rim_rgba": [1.0, 0.9, 0.5, 1.0]
                    }
                }
            ],
            "actions": [
                {
                    "shot_id": 1,
                    "pose_name": "defensive_diagonal_parry",
                    "bone_rotations_deg": {
                        "arm.R": [45.0, -35.0, 20.0],
                        "arm.L": [-70.0, 25.0, 45.0],
                        "thigh.R": [30.0, 0.0, 0.0],
                        "thigh.L": [-30.0, 0.0, 0.0]
                    }
                },
                {
                    "shot_id": 2,
                    "pose_name": "parry_counter_press",
                    "bone_rotations_deg": {
                        "arm.R": [35.0, -25.0, 15.0],
                        "arm.L": [-60.0, 20.0, 35.0],
                        "thigh.R": [25.0, 0.0, 0.0],
                        "thigh.L": [-25.0, 0.0, 0.0]
                    }
                }
            ]
        }
    ]

    # Three Cinematic Shots: Wide Dolly, Over-Shoulder Hero Crane, Horizon Pan
    shots = [
        {
            "shot_id": 1,
            "name": "Wide Low-Angle Dolly Across the Abyss",
            "frame_start": 1,
            "frame_end": 80,
            "lens_mm": 28.0,
            "camera_movement": {
                "type": "dolly",
                "start_location": [-4.8, -4.5, 0.8],
                "start_rotation_deg": [78.0, 0.0, -40.0],
                "end_location": [-3.2, -3.8, 0.5],
                "end_rotation_deg": [82.0, 0.0, -32.0],
                "interpolation": "BEZIER"
            }
        },
        {
            "shot_id": 2,
            "name": "Reverse Over-The-Shoulder Hero Crane on Blade Cleave & Shield Parry",
            "frame_start": 81,
            "frame_end": 160,
            "lens_mm": 45.0,
            "camera_movement": {
                "type": "crane",
                "start_location": [0.0, -2.2, 0.2],
                "start_rotation_deg": [65.0, 0.0, 0.0],
                "end_location": [0.3, -1.5, 0.9],
                "end_rotation_deg": [52.0, 0.0, 12.0],
                "interpolation": "BEZIER"
            }
        },
        {
            "shot_id": 3,
            "name": "Low-Angle Horizon Pan Silhouetted Against Sunset",
            "frame_start": 161,
            "frame_end": 240,
            "lens_mm": 35.0,
            "camera_movement": {
                "type": "pan",
                "start_location": [-2.0, -4.0, 0.4],
                "start_rotation_deg": [85.0, 0.0, -15.0],
                "end_location": [2.0, -3.8, 0.6],
                "end_rotation_deg": [85.0, 0.0, 15.0],
                "interpolation": "BEZIER"
            }
        }
    ]

    return {
        "metadata": {
            "title": title,
            "style": style,
            "fps": 30,
            "resolution": {"width": 640, "height": 360},
            "total_frames": 240,
            "engine": "BLENDER_EEVEE_NEXT"
        },
        "environment": {
            "base_blend": "lunaria_flesh_mannequin.blend",
            "terrain": {
                "type": terrain_type,
                "dimensions": terrain_dim,
                "material": terrain_mat
            },
            "backdrop": {
                "type": backdrop_type,
                "emission_strength": 1.8,
                "gradient_stops": gradient_stops
            }
        },
        "lighting": lights,
        "characters": characters,
        "shots": shots
    }


def produce_manifest(prompt, model="gemma4:latest", endpoint="http://localhost:11434",
                     bridge_url="http://localhost:8081", offline=False, timeout=45):
    """
    Executes the 4-tier pipeline to generate a fully validated production manifest.
    Returns: (manifest_dict, tier_reached)
    """
    schema = load_schema()

    if offline:
        sys.stderr.write("[Pipeline] Running in --offline mode. Invoking Tier 4 deterministic generator.\n")
        manifest = generate_deterministic_tier4(prompt)
        validated = normalize_and_validate_tier3(manifest, schema)
        return (validated or manifest), 4

    # Tier 1: Try Ollama
    raw_response = None
    sys.stderr.write(f"[Pipeline] [Tier 1] Querying Ollama ({model}) on {endpoint}...\n")
    try:
        raw_response = query_ollama(prompt, model=model, endpoint=endpoint, timeout=timeout)
        sys.stderr.write(f"[Pipeline] [Tier 1] Received {len(raw_response)} chars from Ollama.\n")
    except Exception as e:
        sys.stderr.write(f"[Pipeline] [Tier 1] Ollama query failed: {e}\n")
        # Try fallback to Agent Bridge proxy if not a timeout
        is_timeout = "timed out" in str(e).lower()
        if bridge_url and not is_timeout:
            sys.stderr.write(f"[Pipeline] [Tier 1] Attempting Agent Bridge fallback on {bridge_url}...\n")
            try:
                raw_response = query_agent_bridge(prompt, model=model, bridge_url=bridge_url, timeout=min(timeout, 15))
                sys.stderr.write(f"[Pipeline] [Tier 1] Received {len(raw_response)} chars from Agent Bridge.\n")
            except Exception as e2:
                sys.stderr.write(f"[Pipeline] [Tier 1] Agent Bridge fallback failed: {e2}\n")

    # Tier 2: Extract JSON from raw response
    parsed_json = None
    if raw_response:
        sys.stderr.write("[Pipeline] [Tier 2] Extracting JSON structure from response...\n")
        parsed_json = extract_json_tier2(raw_response)
        if parsed_json:
            sys.stderr.write("[Pipeline] [Tier 2] JSON parsed successfully.\n")
        else:
            sys.stderr.write("[Pipeline] [Tier 2] Failed to parse JSON from raw response.\n")

    # Tier 3: Normalize and validate
    if parsed_json:
        sys.stderr.write("[Pipeline] [Tier 3] Normalizing and validating manifest against schema...\n")
        try:
            validated = normalize_and_validate_tier3(parsed_json, schema)
        except Exception as e:
            sys.stderr.write(f"[Pipeline] [Tier 3] Normalization failed with exception: {e}\n")
            validated = None

        if validated:
            sys.stderr.write("[Pipeline] [Tier 3] Validation successful.\n")
            return validated, (1 if raw_response.startswith("{") else 2)
        else:
            sys.stderr.write("[Pipeline] [Tier 3] Validation failed. Falling back to Tier 4.\n")

    # Tier 4: Deterministic fallback
    sys.stderr.write("[Pipeline] [Tier 4] Activating deterministic rule-based generator for prompt.\n")
    fallback = generate_deterministic_tier4(prompt)
    try:
        validated_fallback = normalize_and_validate_tier3(fallback, schema)
    except Exception:
        validated_fallback = None
    return (validated_fallback or fallback), 4


def main():
    parser = argparse.ArgumentParser(description="MyOS Local Multi-Agent 3D Animation Studio Pipeline")
    parser.add_argument("--prompt", type=str, default="1980s Bakshi/Frazetta dark high fantasy duel on a cliff plateau",
                        help="High-level creative prompt for the agent crew")
    parser.add_argument("--output", type=str, default=DEFAULT_OUTPUT,
                        help="Destination filepath for the production manifest JSON")
    parser.add_argument("--model", type=str, default="gemma4:latest",
                        help="Local LLM model identifier (default: gemma4:latest)")
    parser.add_argument("--endpoint", type=str, default="http://localhost:11434",
                        help="Ollama API base endpoint (default: http://localhost:11434)")
    parser.add_argument("--bridge-url", type=str, default="http://localhost:8081",
                        help="MyOS Agent Bridge base endpoint (default: http://localhost:8081)")
    parser.add_argument("--offline", action="store_true",
                        help="Force offline mode (bypass LLM network queries, use deterministic generator)")
    parser.add_argument("--timeout", type=int, default=45,
                        help="Timeout in seconds for LLM queries (default: 45)")
    parser.add_argument("--json-stdout", action="store_true",
                        help="Print pure manifest JSON to stdout for piping")

    args = parser.parse_args()

    manifest, tier = produce_manifest(
        prompt=args.prompt,
        model=args.model,
        endpoint=args.endpoint,
        bridge_url=args.bridge_url,
        offline=args.offline,
        timeout=args.timeout
    )

    # Ensure output directory exists and save
    out_path = os.path.abspath(args.output)
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)

    sys.stderr.write(f"[Pipeline] ✅ Production manifest successfully written to: {out_path} (via Tier {tier})\n")

    if args.json_stdout:
        print(json.dumps(manifest, indent=2))
    else:
        print(out_path)

    sys.exit(0)


if __name__ == "__main__":
    main()
