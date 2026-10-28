#!/usr/bin/env python3
"""
scripts/tools/bake_uniracer_snes_stunts.py
-------------------------------------------
Bakes authentic 1994 SNES-style stunt animation clips directly into
uniracer_model.blend and exports the verified GLB to apps/web/public/models/uniracer_hero.glb.

Actions added:
1. stunt_z_flip: 30-frame high-flying 360 vertical flip with saddle whip & spring recoil.
2. stunt_corkscrew: 28-frame horizontal barrel-roll twister with aggressive saddle bank.
"""

import os
import sys
import math
import subprocess

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except AttributeError:
        pass

WORKSPACE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
BLENDER_EXE = r"C:\Program Files\Blender Foundation\Blender 5.2\blender.exe"
BLEND_FILE = os.path.join(WORKSPACE_ROOT, "uniracer_model.blend")
OUTPUT_GLB = os.path.join(WORKSPACE_ROOT, "apps/web/public/models/uniracer_hero.glb")

BAKE_SCRIPT = """
import bpy
import math

bpy.ops.wm.open_mainfile(filepath=r'{blend_file}')
arm = bpy.data.objects.get('Uniracer_Rig')
if not arm:
    raise RuntimeError("Uniracer_Rig not found in blend file!")

bpy.context.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode='POSE')

pb_frame = arm.pose.bones.get('Bone_Frame')
pb_saddle = arm.pose.bones.get('Bone_SaddleHead')
pb_wheel = arm.pose.bones.get('Bone_Wheel')
pb_crank_l = arm.pose.bones.get('Bone_Crank_L')
pb_crank_r = arm.pose.bones.get('Bone_Crank_R')
pb_pedal_l = arm.pose.bones.get('Bone_Pedal_L')
pb_pedal_r = arm.pose.bones.get('Bone_Pedal_R')

# -------------------------------------------------------------
# 1. ACTION: stunt_z_flip (30 frames, 360 pitch flip with saddle whip)
# -------------------------------------------------------------
act_flip = bpy.data.actions.new(name='stunt_z_flip')
if not arm.animation_data:
    arm.animation_data_create()
arm.animation_data.action = act_flip

# Reset all pose bones
for pb in arm.pose.bones:
    pb.matrix_basis.identity()

for f in range(1, 31):
    t = (f - 1) / 29.0 # 0.0 to 1.0

    # Frame 1-6: Anticipation squash
    if f <= 6:
        phase = (f - 1) / 5.0
        pitch = -0.35 * math.sin(phase * math.pi * 0.5) # crouch back
        saddle_pitch = -0.5 * math.sin(phase * math.pi * 0.5)
        scale_y = 1.0 - 0.22 * math.sin(phase * math.pi * 0.5)
    # Frame 7-23: Aerial 360 Flip launch & whip
    elif f <= 23:
        air_t = (f - 7) / 16.0
        pitch = -(air_t * 2.0 * math.pi) # Full 360 backflip
        # Saddle whips forward aggressively like a scorpion stinger
        saddle_pitch = 0.75 * math.sin(air_t * math.pi * 2.0)
        scale_y = 1.15 if air_t < 0.5 else 1.05
    # Frame 24-30: Touchdown spring bounce & settling
    else:
        land_t = (f - 24) / 6.0
        damped = math.exp(-land_t * 3.5) * math.sin(land_t * math.pi * 2.0)
        pitch = 0.25 * damped
        saddle_pitch = 0.4 * damped
        scale_y = 1.0 - 0.18 * damped

    wheel_spin = t * 6.0 * math.pi # 3 full wheel spins during stunt

    if pb_frame:
        pb_frame.rotation_mode = 'XYZ'
        pb_frame.rotation_euler = (pitch, 0, 0)
        pb_frame.scale = (1.0, scale_y, 1.0)
        pb_frame.keyframe_insert(data_path='rotation_euler', frame=f)
        pb_frame.keyframe_insert(data_path='scale', frame=f)

    if pb_saddle:
        pb_saddle.rotation_mode = 'XYZ'
        pb_saddle.rotation_euler = (saddle_pitch, 0, 0)
        pb_saddle.keyframe_insert(data_path='rotation_euler', frame=f)

    if pb_wheel:
        pb_wheel.rotation_mode = 'XYZ'
        pb_wheel.rotation_euler = (wheel_spin, 0, 0)
        pb_wheel.keyframe_insert(data_path='rotation_euler', frame=f)

    if pb_crank_l:
        pb_crank_l.rotation_mode = 'XYZ'
        pb_crank_l.rotation_euler = (wheel_spin, 0, 0)
        pb_crank_l.keyframe_insert(data_path='rotation_euler', frame=f)
    if pb_crank_r:
        pb_crank_r.rotation_mode = 'XYZ'
        pb_crank_r.rotation_euler = (wheel_spin, 0, 0)
        pb_crank_r.keyframe_insert(data_path='rotation_euler', frame=f)

    if pb_pedal_l:
        pb_pedal_l.rotation_mode = 'XYZ'
        pb_pedal_l.rotation_euler = (-wheel_spin - pitch, 0, 0)
        pb_pedal_l.keyframe_insert(data_path='rotation_euler', frame=f)
    if pb_pedal_r:
        pb_pedal_r.rotation_mode = 'XYZ'
        pb_pedal_r.rotation_euler = (-wheel_spin - pitch, 0, 0)
        pb_pedal_r.keyframe_insert(data_path='rotation_euler', frame=f)

# Push to NLA so it exports cleanly in glTF
track_flip = arm.animation_data.nla_tracks.new()
track_flip.name = 'Track_stunt_z_flip'
track_flip.strips.new('stunt_z_flip', 1, act_flip)


# -------------------------------------------------------------
# 2. ACTION: stunt_corkscrew (28 frames, horizontal barrel-roll twister)
# -------------------------------------------------------------
act_screw = bpy.data.actions.new(name='stunt_corkscrew')
arm.animation_data.action = act_screw

for pb in arm.pose.bones:
    pb.matrix_basis.identity()

for f in range(1, 29):
    t = (f - 1) / 27.0
    roll = t * 2.0 * math.pi # 360 degree roll around Z
    saddle_yaw = 0.6 * math.sin(t * math.pi * 2.0)
    wheel_spin = t * 4.0 * math.pi

    if pb_frame:
        pb_frame.rotation_mode = 'XYZ'
        pb_frame.rotation_euler = (0, 0, roll)
        pb_frame.scale = (1.0, 1.0, 1.0)
        pb_frame.keyframe_insert(data_path='rotation_euler', frame=f)
        pb_frame.keyframe_insert(data_path='scale', frame=f)

    if pb_saddle:
        pb_saddle.rotation_mode = 'XYZ'
        pb_saddle.rotation_euler = (0, saddle_yaw, -roll * 0.4)
        pb_saddle.keyframe_insert(data_path='rotation_euler', frame=f)

    if pb_wheel:
        pb_wheel.rotation_mode = 'XYZ'
        pb_wheel.rotation_euler = (wheel_spin, 0, 0)
        pb_wheel.keyframe_insert(data_path='rotation_euler', frame=f)

    if pb_crank_l:
        pb_crank_l.rotation_mode = 'XYZ'
        pb_crank_l.rotation_euler = (wheel_spin, 0, 0)
        pb_crank_l.keyframe_insert(data_path='rotation_euler', frame=f)
    if pb_crank_r:
        pb_crank_r.rotation_mode = 'XYZ'
        pb_crank_r.rotation_euler = (wheel_spin, 0, 0)
        pb_crank_r.keyframe_insert(data_path='rotation_euler', frame=f)

track_screw = arm.animation_data.nla_tracks.new()
track_screw.name = 'Track_stunt_corkscrew'
track_screw.strips.new('stunt_corkscrew', 1, act_screw)

# Save blend file
bpy.ops.wm.save_mainfile()
print("Baked stunt_z_flip and stunt_corkscrew into blend file!")

# Select collection and export GLB
coll = bpy.data.collections.get('New_Uniracer_Model')
if not coll:
    raise RuntimeError("Collection 'New_Uniracer_Model' not found!")

bpy.ops.object.mode_set(mode='OBJECT')
bpy.ops.object.select_all(action='DESELECT')
for obj in coll.all_objects:
    obj.select_set(True)

bpy.context.view_layer.objects.active = arm

print(f"Exporting actor to {r'{out_glb}'}...")
bpy.ops.export_scene.gltf(
    filepath=r'{out_glb}',
    use_selection=True,
    export_format='GLB',
    export_apply=False,
    export_yup=True,
    export_materials='EXPORT',
    export_armature_object_remove=False,
    export_animations=True
)
print("GLB export complete!")
"""

def main():
    script_content = BAKE_SCRIPT.replace('{blend_file}', BLEND_FILE).replace('{out_glb}', OUTPUT_GLB)
    cmd = [BLENDER_EXE, "--background", "--python-expr", script_content]
    print("🚀 Launching Blender 5.2 headless to bake SNES stunt clips...")
    res = subprocess.run(cmd, capture_output=True, text=True, cwd=WORKSPACE_ROOT)
    print("STDOUT:", res.stdout)
    if res.returncode != 0:
        print("STDERR:", res.stderr, file=sys.stderr)
        sys.exit(1)
    print("🎉 Successfully baked and exported uniracer_hero.glb!")

if __name__ == '__main__':
    main()
