#!/usr/bin/env python3
"""
scripts/tools/catalog_3d_assets.py
MyOS Sovereign Engine: 3D Model Casting House & Prop Cataloger

Recursively scans the MyOS workspace for 3D assets (.glb, .gltf, .blend),
extracts skeletal hierarchies, bone sockets, animation tracks, and mesh structures,
and classifies them into semantic categories (actor, wardrobe, prop, architecture, vehicle, motion).

Outputs:
  - data/prop_house_catalog.json (Root database)
  - apps/web/public/data/prop_house_catalog.json (Web client / Stagecraft / Studio UI)
"""

import os
import sys
import json
import struct
import subprocess
import glob
from pathlib import Path
from datetime import datetime, timezone

# Ensure UTF-8 output on Windows PowerShell
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except AttributeError:
        pass

WORKSPACE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
OUTPUT_ROOT = os.path.join(WORKSPACE_ROOT, "data", "prop_house_catalog.json")
OUTPUT_WEB = os.path.join(WORKSPACE_ROOT, "apps", "web", "public", "data", "prop_house_catalog.json")

BLENDER_EXE = r"C:\Program Files\Blender Foundation\Blender 5.2\blender.exe"
if not os.path.exists(BLENDER_EXE):
    alt = r"C:\Program Files\Blender Foundation\Blender\blender.exe"
    if os.path.exists(alt):
        BLENDER_EXE = alt

SOCKET_KEYWORDS = [
    "hand.r", "hand.l", "righthand", "lefthand", "head", "neck", "spine",
    "chest", "back", "hips", "foot.r", "foot.l", "shoulder.r", "shoulder.l",
    "socket", "mount", "slot"
]

CATEGORY_RULES = [
    ("actor", ["mannequin", "chibi", "flesh", "hero", "rogue", "mage", "paladin",
               "devil", "bullywug", "titan", "golem", "larry", "frankie", "actor", "alicia", "character"]),
    ("vehicle", ["uniracer", "cycnet", "uninator", "kart", "bike", "vehicle", "car"]),
    ("wardrobe", ["boots", "pants", "tunic", "skirt", "cape", "hat", "hood", "helmet", "hair", "robe", "armor"]),
    ("architecture", ["balcony", "corner", "door", "floor", "wall", "pillar", "roof", "stairs", "chimney", "window", "inn", "tower"]),
    ("motion", ["acknowledged", "agreeing", "dismissing", "walk", "run", "idle", "attack", "action"]),
    ("prop", ["sword", "staff", "dagger", "shield", "axe", "weapon", "torch", "lantern", "chair", "table", "crate", "barrel", "item"])
]


def classify_asset(name: str, meshes: list, nodes: list, animations: list, path_str: str) -> tuple[str, list[str]]:
    """Determine asset category and semantic tags based on name, path, and structure."""
    text_corpus = f"{name} {' '.join(meshes)} {' '.join(nodes)} {' '.join(animations)} {path_str}".lower()
    tags = set()

    for word in ["chibi", "mannequin", "comic", "cyberpunk", "medieval", "fantasy", "scifi",
                 "sword", "staff", "dagger", "shield", "modular", "flesh", "animated", "rigged"]:
        if word in text_corpus:
            tags.add(word)

    # Check category rules in priority order
    for cat, keywords in CATEGORY_RULES:
        for kw in keywords:
            if kw in name.lower() or kw in path_str.lower():
                return cat, sorted(list(tags))

    # Fallback to prop
    return "prop", sorted(list(tags))


def parse_glb_file(file_path: str) -> dict | None:
    """Parses GLB header and JSON chunk with pure Python without external dependencies."""
    try:
        with open(file_path, "rb") as f:
            header = f.read(12)
            if len(header) < 12:
                return None
            magic, version, length = struct.unpack("<4sII", header)
            if magic != b"glTF":
                return None

            chunk_header = f.read(8)
            if len(chunk_header) < 8:
                return None
            chunk_len, chunk_type = struct.unpack("<II", chunk_header)
            # 0x4E4F534A is ASCII 'JSON'
            if chunk_type != 0x4E4F534A:
                return None

            json_bytes = f.read(chunk_len)
            gltf = json.loads(json_bytes.decode("utf-8", errors="replace"))

            nodes = [n.get("name", "") for n in gltf.get("nodes", []) if n.get("name")]
            meshes = [m.get("name", "") for m in gltf.get("meshes", []) if m.get("name")]
            animations = [a.get("name", "") for a in gltf.get("animations", []) if a.get("name")]
            skins = gltf.get("skins", [])
            has_armature = len(skins) > 0 or any("armature" in n.lower() or "root" in n.lower() for n in nodes)

            # Detect sockets
            sockets = []
            for n in nodes:
                n_lower = n.lower()
                for kw in SOCKET_KEYWORDS:
                    if kw in n_lower:
                        sockets.append(n)
                        break

            return {
                "nodes": nodes,
                "meshes": meshes,
                "animations": animations,
                "has_armature": has_armature,
                "sockets": list(set(sockets)),
                "skin_joint_count": len(skins[0].get("joints", [])) if skins else 0
            }
    except Exception as e:
        sys.stderr.write(f"[GLB Parser] Failed to parse {file_path}: {e}\n")
        return None


def parse_gltf_file(file_path: str) -> dict | None:
    """Parses glTF JSON file."""
    try:
        with open(file_path, "r", encoding="utf-8", errors="replace") as f:
            gltf = json.load(f)
        nodes = [n.get("name", "") for n in gltf.get("nodes", []) if n.get("name")]
        meshes = [m.get("name", "") for m in gltf.get("meshes", []) if m.get("name")]
        animations = [a.get("name", "") for a in gltf.get("animations", []) if a.get("name")]
        skins = gltf.get("skins", [])
        has_armature = len(skins) > 0 or any("armature" in n.lower() for n in nodes)

        sockets = []
        for n in nodes:
            n_lower = n.lower()
            for kw in SOCKET_KEYWORDS:
                if kw in n_lower:
                    sockets.append(n)
                    break

        return {
            "nodes": nodes,
            "meshes": meshes,
            "animations": animations,
            "has_armature": has_armature,
            "sockets": list(set(sockets)),
            "skin_joint_count": len(skins[0].get("joints", [])) if skins else 0
        }
    except Exception as e:
        sys.stderr.write(f"[glTF Parser] Failed to parse {file_path}: {e}\n")
        return None


def inspect_blends_batch(blend_paths: list[str]) -> dict[str, dict]:
    """Inspects multiple .blend files headlessly via Blender Python."""
    if not os.path.exists(BLENDER_EXE):
        sys.stderr.write(f"[Blend Inspector] Blender executable not found at {BLENDER_EXE}\n")
        return {}

    # Create temporary script for Blender to run
    temp_script = os.path.join(WORKSPACE_ROOT, "temp_studio_frames", "blend_batch_inspect.py")
    os.makedirs(os.path.dirname(temp_script), exist_ok=True)

    script_content = """import bpy, sys, json, os

results = {}
files = json.loads(os.environ.get("MYOS_INSPECT_FILES", "[]"))

for fpath in files:
    try:
        bpy.ops.wm.open_mainfile(filepath=fpath)
        objs = [o.name for o in bpy.data.objects]
        armatures = [a.name for a in bpy.data.armatures]
        actions = [act.name for act in bpy.data.actions]
        meshes = [m.name for m in bpy.data.meshes]
        
        # Sockets
        sockets = []
        for o in bpy.data.objects:
            if o.type == 'ARMATURE':
                for b in o.data.bones:
                    b_lower = b.name.lower()
                    if any(k in b_lower for k in ['socket', 'hand', 'head', 'back', 'hip', 'mount']):
                        sockets.append(b.name)

        results[fpath] = {
            "objects": objs,
            "armatures": armatures,
            "actions": actions,
            "meshes": meshes,
            "sockets": list(set(sockets)),
            "has_armature": len(armatures) > 0
        }
    except Exception as err:
        results[fpath] = {"error": str(err)}

out_file = os.environ.get("MYOS_INSPECT_OUT", "")
if out_file:
    with open(out_file, "w", encoding="utf-8") as out:
        json.dump(results, out, indent=2)
print("BATCH_INSPECT_COMPLETE")
"""
    with open(temp_script, "w", encoding="utf-8") as f:
        f.write(script_content)

    temp_out = os.path.join(WORKSPACE_ROOT, "temp_studio_frames", "blend_inspect_results.json")
    env = os.environ.copy()
    env["MYOS_INSPECT_FILES"] = json.dumps(blend_paths)
    env["MYOS_INSPECT_OUT"] = temp_out

    cmd = [BLENDER_EXE, "--background", "--python", temp_script]
    try:
        subprocess.run(cmd, env=env, capture_output=True, text=True, timeout=60)
        if os.path.exists(temp_out):
            with open(temp_out, "r", encoding="utf-8") as f:
                return json.load(f)
    except Exception as e:
        sys.stderr.write(f"[Blend Inspector] Blender inspection failed: {e}\n")

    return {}


def build_prop_house_catalog(include_blends: bool = True) -> dict:
    """Scans and compiles all 3D assets in MyOS."""
    print("🎬 [Casting House] Scanning MyOS 3D asset libraries...")

    assets = []
    seen_paths = set()

    # Search directories
    scan_roots = [
        os.path.join(WORKSPACE_ROOT, "apps", "web", "public", "models"),
        os.path.join(WORKSPACE_ROOT, "apps", "web", "public", "assets"),
        os.path.join(WORKSPACE_ROOT, "apps", "web", "public", "actions"),
        os.path.join(WORKSPACE_ROOT, "models"),
        os.path.join(WORKSPACE_ROOT, "artifacts", "flesh_golems"),
        os.path.join(WORKSPACE_ROOT, "assets", "motion_library", "baked"),
    ]

    # Also include root master .blend files
    root_blends = glob.glob(os.path.join(WORKSPACE_ROOT, "*.blend"))

    # 1. Parse GLB / GLTF files
    glb_gltf_files = []
    for r in scan_roots:
        if os.path.isdir(r):
            glb_gltf_files.extend(glob.glob(os.path.join(r, "**", "*.glb"), recursive=True))
            glb_gltf_files.extend(glob.glob(os.path.join(r, "**", "*.gltf"), recursive=True))

    # Also root GLB if any
    glb_gltf_files.extend(glob.glob(os.path.join(WORKSPACE_ROOT, "apps", "web", "public", "*.glb")))

    for fpath in glb_gltf_files:
        norm_path = os.path.normpath(fpath)
        if norm_path in seen_paths:
            continue
        seen_paths.add(norm_path)

        rel_path = os.path.relpath(norm_path, WORKSPACE_ROOT).replace("\\", "/")
        stem = Path(norm_path).stem
        ext = Path(norm_path).suffix.lower().lstrip(".")

        parsed = parse_glb_file(norm_path) if ext == "glb" else parse_gltf_file(norm_path)
        if not parsed:
            continue

        # Determine web URL if within public directory
        web_url = None
        pub_marker = "apps/web/public/"
        if pub_marker in rel_path:
            web_url = "/" + rel_path.split(pub_marker, 1)[1]

        category, tags = classify_asset(
            name=stem,
            meshes=parsed["meshes"],
            nodes=parsed["nodes"],
            animations=parsed["animations"],
            path_str=rel_path
        )

        assets.append({
            "id": stem.lower(),
            "name": stem.replace("_", " ").title(),
            "category": category,
            "format": ext,
            "file_path": rel_path,
            "web_url": web_url,
            "has_armature": parsed["has_armature"],
            "sockets": parsed["sockets"],
            "meshes": parsed["meshes"][:12],
            "animations": parsed["animations"],
            "tags": tags,
            "skin_joint_count": parsed["skin_joint_count"]
        })

    # 2. Parse .blend files
    all_blends = root_blends.copy()
    for r in scan_roots:
        if os.path.isdir(r):
            all_blends.extend(glob.glob(os.path.join(r, "**", "*.blend"), recursive=True))

    # Filter out temp or backup blends
    clean_blends = [
        b for b in all_blends
        if "backup" not in b.lower() and "temp" not in b.lower() and "archive" not in b.lower()
    ]

    blend_meta_map = {}
    if include_blends and clean_blends:
        # Prioritize top 15 key production blends for deep inspection
        priority_blends = [
            b for b in clean_blends
            if any(k in os.path.basename(b).lower() for k in [
                "wardrobe", "mannequin", "comic", "flesh", "rogue", "mage", "paladin", "larry", "uniracer", "frankie"
            ])
        ][:15]
        print(f"🎬 [Casting House] Inspecting {len(priority_blends)} core .blend files via Blender headless...")
        blend_meta_map = inspect_blends_batch(priority_blends)

    for bpath in clean_blends:
        norm_path = os.path.normpath(bpath)
        if norm_path in seen_paths:
            continue
        seen_paths.add(norm_path)

        rel_path = os.path.relpath(norm_path, WORKSPACE_ROOT).replace("\\", "/")
        stem = Path(norm_path).stem

        meta = blend_meta_map.get(norm_path, {})
        meshes = meta.get("meshes", [])
        armatures = meta.get("armatures", [])
        actions = meta.get("actions", [])
        sockets = meta.get("sockets", [])
        has_armature = meta.get("has_armature", True if any(k in stem.lower() for k in ["mannequin", "chibi", "flesh", "rig", "actor"]) else False)

        category, tags = classify_asset(
            name=stem,
            meshes=meshes,
            nodes=meta.get("objects", []),
            animations=actions,
            path_str=rel_path
        )

        assets.append({
            "id": stem.lower(),
            "name": stem.replace("_", " ").title(),
            "category": category,
            "format": "blend",
            "file_path": rel_path,
            "web_url": None,
            "has_armature": has_armature,
            "sockets": sockets,
            "meshes": meshes[:12],
            "animations": actions,
            "tags": tags,
            "skin_joint_count": len(sockets)
        })

    # Summary statistics
    summary = {
        "total_assets": len(assets),
        "actors": sum(1 for a in assets if a["category"] == "actor"),
        "props": sum(1 for a in assets if a["category"] == "prop"),
        "wardrobe": sum(1 for a in assets if a["category"] == "wardrobe"),
        "architecture": sum(1 for a in assets if a["category"] == "architecture"),
        "vehicles": sum(1 for a in assets if a["category"] == "vehicle"),
        "motions": sum(1 for a in assets if a["category"] == "motion"),
    }

    catalog = {
        "version": "1.0.0",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "summary": summary,
        "assets": assets
    }

    # Save to disk
    os.makedirs(os.path.dirname(OUTPUT_ROOT), exist_ok=True)
    with open(OUTPUT_ROOT, "w", encoding="utf-8") as f:
        json.dump(catalog, f, indent=2)

    os.makedirs(os.path.dirname(OUTPUT_WEB), exist_ok=True)
    with open(OUTPUT_WEB, "w", encoding="utf-8") as f:
        json.dump(catalog, f, indent=2)

    print(f"✅ [Casting House] Successfully cataloged {len(assets)} 3D assets!")
    print(f"   - Actors: {summary['actors']}")
    print(f"   - Props: {summary['props']}")
    print(f"   - Architecture: {summary['architecture']}")
    print(f"   - Wardrobe: {summary['wardrobe']}")
    print(f"   - Vehicles: {summary['vehicles']}")
    print(f"   - Motions: {summary['motions']}")
    print(f"   Saved to: {OUTPUT_ROOT} and {OUTPUT_WEB}")

    return catalog


if __name__ == "__main__":
    include_blends = "--fast" not in sys.argv
    build_prop_house_catalog(include_blends=include_blends)
