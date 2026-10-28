#!/usr/bin/env python3
"""
scripts/tools/blender_three_bridge.py
------------------------------------
Symbiorithmic Bridge between Blender and Three.js / MyOS.
Provides CLI subcommands:
  - export-actor : Exports rigged and verified actor models from .blend to .glb with intact bone hierarchies.
  - inspect-glb  : Inspects a .glb file to verify meshes, bones, materials, and embedded AnimationClips.
  - bake-clip    : Bakes a procedural or keyframed action in Blender into the actor's NLA tracks for Three.js playback.
"""

import os
import sys
import json
import argparse
import subprocess

# Windows PowerShell UTF-8 reconfigure
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except AttributeError:
        pass

WORKSPACE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
BLENDER_EXE = r"C:\Program Files\Blender Foundation\Blender 5.2\blender.exe"
PYTHON_EXE = sys.executable

def cmd_inspect_glb(args):
    glb_path = os.path.abspath(args.glb)
    if not os.path.exists(glb_path):
        print(f"❌ Error: GLB file not found at {glb_path}", file=sys.stderr)
        sys.exit(1)

    # Use Blender headless to inspect accurately without extra heavy pip dependencies
    inspect_script = f"""
import bpy
import json
import os

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=r'{glb_path}')

info = {{
    'filename': os.path.basename(r'{glb_path}'),
    'size_bytes': os.path.getsize(r'{glb_path}'),
    'objects': [],
    'armatures': [],
    'actions': [a.name for a in bpy.data.actions],
    'materials': [m.name for m in bpy.data.materials]
}}

for obj in bpy.context.scene.objects:
    item = {{
        'name': obj.name,
        'type': obj.type,
        'location': [round(v, 3) for v in obj.location],
        'parent': obj.parent.name if obj.parent else None,
        'parent_bone': obj.parent_bone if obj.parent_bone else None
    }}
    info['objects'].append(item)
    if obj.type == 'ARMATURE':
        bones = [b.name for b in obj.data.bones]
        info['armatures'].append({{'name': obj.name, 'bones': bones}})

print("---JSON_OUTPUT_START---")
print(json.dumps(info, indent=2))
print("---JSON_OUTPUT_END---")
"""
    cmd = [BLENDER_EXE, "--background", "--python-expr", inspect_script]
    res = subprocess.run(cmd, capture_output=True, text=True, cwd=WORKSPACE_ROOT)
    stdout = res.stdout

    if "---JSON_OUTPUT_START---" in stdout and "---JSON_OUTPUT_END---" in stdout:
        json_str = stdout.split("---JSON_OUTPUT_START---")[1].split("---JSON_OUTPUT_END---")[0].strip()
        data = json.loads(json_str)

        if args.output:
            with open(args.output, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
            print(f"✅ Inspection written to {args.output}")
        else:
            print(f"📦 GLB: {data['filename']} ({data['size_bytes']} bytes)")
            print(f"  Armatures ({len(data['armatures'])}):")
            for arm in data['armatures']:
                print(f"    - {arm['name']}: {len(arm['bones'])} bones -> {arm['bones']}")
            print(f"  Objects ({len(data['objects'])}):")
            for o in data['objects']:
                parent_str = f" [parent: {o['parent']}" + (f" / bone: {o['parent_bone']}]" if o['parent_bone'] else "]") if o['parent'] else ""
                print(f"    - {o['name']} ({o['type']}){parent_str}")
            print(f"  Animation Actions ({len(data['actions'])}): {data['actions']}")
            print(f"  Materials ({len(data['materials'])}): {data['materials']}")
    else:
        print("❌ Error inspecting GLB with Blender:", res.stderr, file=sys.stderr)
        sys.exit(1)

def cmd_export_actor(args):
    blend_path = os.path.abspath(args.blend)
    output_glb = os.path.abspath(args.output)
    collection_name = args.collection

    if not os.path.exists(blend_path):
        print(f"❌ Error: Blend file not found at {blend_path}", file=sys.stderr)
        sys.exit(1)

    os.makedirs(os.path.dirname(output_glb), exist_ok=True)

    export_script = f"""
import bpy
import os
import sys

blend_path = r'{blend_path}'
out_glb = r'{output_glb}'
target_coll = '{collection_name}'

bpy.ops.wm.open_mainfile(filepath=blend_path)

coll = bpy.data.collections.get(target_coll)
if not coll:
    print(f"Error: Collection '{{target_coll}}' not found!", file=sys.stderr)
    sys.exit(1)

bpy.ops.object.select_all(action='DESELECT')
for obj in coll.all_objects:
    obj.select_set(True)

arm = bpy.data.objects.get('Uniracer_Rig')
if arm:
    bpy.context.view_layer.objects.active = arm

print(f"Exporting {{len(coll.all_objects)}} objects to {{out_glb}}...")
bpy.ops.export_scene.gltf(
    filepath=out_glb,
    use_selection=True,
    export_format='GLB',
    export_apply=False,
    export_yup=True,
    export_materials='EXPORT',
    export_armature_object_remove=False,
    export_animations=True
)

print(f"SUCCESS: Exported {{os.path.getsize(out_glb)}} bytes to {{out_glb}}")
"""
    cmd = [BLENDER_EXE, "--background", "--python-expr", export_script]
    res = subprocess.run(cmd, capture_output=True, text=True, cwd=WORKSPACE_ROOT)
    if res.returncode != 0:
        print(f"❌ Blender export failed:\n{res.stderr}\n{res.stdout}", file=sys.stderr)
        sys.exit(1)
    
    print(f"✅ Successfully exported actor to {output_glb} ({os.path.getsize(output_glb)} bytes)")

def cmd_bake_clip(args):
    blend_path = os.path.abspath(args.blend)
    action_name = args.action
    clip_type = args.type

    bake_script = f"""
import bpy
import math

bpy.ops.wm.open_mainfile(filepath=r'{blend_path}')
arm = bpy.data.objects.get('Uniracer_Rig')
if not arm:
    print("Error: Uniracer_Rig not found!", file=sys.stderr)
    sys.exit(1)

bpy.context.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode='POSE')

# Reset pose
for pb in arm.pose.bones:
    pb.matrix_basis.identity()

# Create or get action
act = bpy.data.actions.new(name='{action_name}')
if not arm.animation_data:
    arm.animation_data_create()
arm.animation_data.action = act

pb_wheel = arm.pose.bones.get('Bone_Wheel')
pb_frame = arm.pose.bones.get('Bone_Frame')
pb_saddle = arm.pose.bones.get('Bone_SaddleHead')
pb_crank_l = arm.pose.bones.get('Bone_Crank_L')
pb_crank_r = arm.pose.bones.get('Bone_Crank_R')
pb_pedal_l = arm.pose.bones.get('Bone_Pedal_L')
pb_pedal_r = arm.pose.bones.get('Bone_Pedal_R')

if '{clip_type}' == 'roll_puddle':
    # Slow continuous wheel roll over 48 frames (2 full rotations)
    for f in range(1, 49):
        t = (f - 1) / 47.0
        angle = t * 4.0 * math.pi
        if pb_wheel:
            pb_wheel.rotation_mode = 'XYZ'
            pb_wheel.rotation_euler = (angle, 0, 0)
            pb_wheel.keyframe_insert(data_path='rotation_euler', frame=f)
        if pb_crank_l:
            pb_crank_l.rotation_mode = 'XYZ'
            pb_crank_l.rotation_euler = (angle, 0, 0)
            pb_crank_l.keyframe_insert(data_path='rotation_euler', frame=f)
        if pb_crank_r:
            pb_crank_r.rotation_mode = 'XYZ'
            pb_crank_r.rotation_euler = (angle, 0, 0)
            pb_crank_r.keyframe_insert(data_path='rotation_euler', frame=f)
        # Counter-rotate pedals so they stay horizontal
        if pb_pedal_l:
            pb_pedal_l.rotation_mode = 'XYZ'
            pb_pedal_l.rotation_euler = (-angle, 0, 0)
            pb_pedal_l.keyframe_insert(data_path='rotation_euler', frame=f)
        if pb_pedal_r:
            pb_pedal_r.rotation_mode = 'XYZ'
            pb_pedal_r.rotation_euler = (-angle, 0, 0)
            pb_pedal_r.keyframe_insert(data_path='rotation_euler', frame=f)

bpy.ops.wm.save_mainfile()
print(f"Action '{action_name}' baked successfully into {blend_path}!")
"""
    cmd = [BLENDER_EXE, "--background", "--python-expr", bake_script]
    res = subprocess.run(cmd, capture_output=True, text=True, cwd=WORKSPACE_ROOT)
    if res.returncode != 0:
        print(f"❌ Bake failed:\n{res.stderr}\n{res.stdout}", file=sys.stderr)
        sys.exit(1)
    print(f"✅ Baked action '{action_name}' into {blend_path}")

def main():
    parser = argparse.ArgumentParser(description="Symbiorithmic Bridge between Blender and Three.js / MyOS.")
    subparsers = parser.add_subparsers(dest="command", required=True)

    # inspect-glb
    p_inspect = subparsers.add_parser("inspect-glb", help="Inspect GLB meshes, bones, and animation clips.")
    p_inspect.add_argument("glb", help="Path to GLB file")
    p_inspect.add_argument("--output", "-o", help="Optional output JSON file")
    p_inspect.set_defaults(func=cmd_inspect_glb)

    # export-actor
    p_export = subparsers.add_parser("export-actor", help="Export actor from .blend to .glb")
    p_export.add_argument("--blend", default="uniracer_model.blend", help="Source blend file (default: uniracer_model.blend)")
    p_export.add_argument("--collection", default="New_Uniracer_Model", help="Target collection")
    p_export.add_argument("--output", default="apps/web/public/models/uniracer_hero.glb", help="Output GLB path")
    p_export.set_defaults(func=cmd_export_actor)

    # bake-clip
    p_bake = subparsers.add_parser("bake-clip", help="Bake an action clip into Blender rig")
    p_bake.add_argument("--blend", default="uniracer_model.blend", help="Target blend file")
    p_bake.add_argument("--action", required=True, help="Name of action (e.g. roll_puddle)")
    p_bake.add_argument("--type", default="roll_puddle", choices=["roll_puddle", "slouch_idle"], help="Clip generator type")
    p_bake.set_defaults(func=cmd_bake_clip)

    args = parser.parse_args()
    args.func(args)

if __name__ == "__main__":
    main()
