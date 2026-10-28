#!/usr/bin/env python3
"""
scripts/tools/bake_uniracer_kinematics.py
-----------------------------------------
Authoring & Baking the Complete Kinematic Action & Emote Library into uniracer_model.blend:
1. jump_squash_stretch  : Anticipation squash, explosive inertia stretch, apex balance, impact touchdown.
2. emote_talking        : Saddle flapping/bobbing rhythmically like an animated jaw.
3. emote_dancing        : Rhythmic 360 spin, frame sway, and cadence flair.
4. emote_sprinting      : Aerodynamic forward tuck (-26 deg lean) with high-speed cadence.
5. emote_startled       : Sudden vertical recoil hop with frame tilt and vibration.
6. emote_glance_side    : Saddle twisting 45 deg sideways on seatpost to eyeball rival.

Exports the updated rigged unicycle to apps/web/public/models/uniracer_hero.glb
"""

import bpy
import math
import os
import sys

WORKSPACE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
BLEND_PATH = os.path.join(WORKSPACE_ROOT, "uniracer_model.blend")
OUTPUT_GLB = os.path.join(WORKSPACE_ROOT, "apps/web/public/models/uniracer_hero.glb")

print(f"Opening {BLEND_PATH}...")
bpy.ops.wm.open_mainfile(filepath=BLEND_PATH)

arm = bpy.data.objects.get("Uniracer_Rig")
if not arm or arm.type != 'ARMATURE':
    print("❌ Error: Uniracer_Rig armature not found!", file=sys.stderr)
    sys.exit(1)

bpy.context.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode='POSE')

if not arm.animation_data:
    arm.animation_data_create()

# Pose bones
pb_root = arm.pose.bones.get("Root")
pb_wheel = arm.pose.bones.get("Bone_Wheel")
pb_frame = arm.pose.bones.get("Bone_Frame")
pb_saddle = arm.pose.bones.get("Bone_SaddleHead")
pb_crank_l = arm.pose.bones.get("Bone_Crank_L")
pb_crank_r = arm.pose.bones.get("Bone_Crank_R")
pb_pedal_l = arm.pose.bones.get("Bone_Pedal_L")
pb_pedal_r = arm.pose.bones.get("Bone_Pedal_R")

all_bones = [pb_root, pb_wheel, pb_frame, pb_saddle, pb_crank_l, pb_crank_r, pb_pedal_l, pb_pedal_r]

def reset_pose():
    for pb in all_bones:
        if pb:
            pb.rotation_mode = 'XYZ'
            pb.location = (0, 0, 0)
            pb.rotation_euler = (0, 0, 0)
            pb.scale = (1, 1, 1)

def create_action(name):
    # Remove existing action if present to ensure clean recreation
    old = bpy.data.actions.get(name)
    if old:
        bpy.data.actions.remove(old)
    act = bpy.data.actions.new(name=name)
    arm.animation_data.action = act
    reset_pose()
    return act

# =============================================================================
# 1. JUMP SQUASH & STRETCH (36 frames @ 30fps)
# =============================================================================
print("Baking jump_squash_stretch...")
act_jump = create_action("jump_squash_stretch")

# F1: Rest pose
reset_pose()
for pb in [pb_root, pb_frame, pb_saddle, pb_wheel]:
    if pb:
        pb.keyframe_insert(data_path="location", frame=1)
        pb.keyframe_insert(data_path="rotation_euler", frame=1)
        pb.keyframe_insert(data_path="scale", frame=1)

# F6: Anticipation Squash (Squatting down)
if pb_frame:
    pb_frame.location = (0, 0, -0.12)
    pb_frame.scale = (1.10, 1.10, 0.88) # Lateral bulge, vertical squash
    pb_frame.keyframe_insert(data_path="location", frame=6)
    pb_frame.keyframe_insert(data_path="scale", frame=6)
if pb_saddle:
    pb_saddle.location = (0, 0, -0.05)
    pb_saddle.rotation_euler = (math.radians(-6), 0, 0) # Tilts back slightly
    pb_saddle.keyframe_insert(data_path="location", frame=6)
    pb_saddle.keyframe_insert(data_path="rotation_euler", frame=6)
if pb_wheel:
    pb_wheel.scale = (1.08, 1.08, 0.92)
    pb_wheel.keyframe_insert(data_path="scale", frame=6)

# F12: Explosive Launch & Inertia Stretch (Airborne lift)
if pb_root:
    pb_root.location = (0, 0, 0.45)
    pb_root.keyframe_insert(data_path="location", frame=12)
if pb_frame:
    pb_frame.location = (0, 0, 0.08)
    pb_frame.scale = (0.92, 0.92, 1.15) # Aerodynamic stretch along Z
    pb_frame.rotation_euler = (math.radians(-10), 0, 0) # Dynamic flight rake
    pb_frame.keyframe_insert(data_path="location", frame=12)
    pb_frame.keyframe_insert(data_path="scale", frame=12)
    pb_frame.keyframe_insert(data_path="rotation_euler", frame=12)
if pb_saddle:
    pb_saddle.location = (0, 0, 0.04)
    pb_saddle.rotation_euler = (math.radians(4), 0, 0)
    pb_saddle.keyframe_insert(data_path="location", frame=12)
    pb_saddle.keyframe_insert(data_path="rotation_euler", frame=12)
if pb_wheel:
    pb_wheel.scale = (0.95, 0.95, 1.08)
    pb_wheel.keyframe_insert(data_path="scale", frame=12)

# F20: Apex (Peak of arc)
if pb_root:
    pb_root.location = (0, 0, 0.80)
    pb_root.keyframe_insert(data_path="location", frame=20)
if pb_frame:
    pb_frame.location = (0, 0, 0)
    pb_frame.scale = (1.0, 1.0, 1.0)
    pb_frame.rotation_euler = (math.radians(-4), 0, 0)
    pb_frame.keyframe_insert(data_path="location", frame=20)
    pb_frame.keyframe_insert(data_path="scale", frame=20)
    pb_frame.keyframe_insert(data_path="rotation_euler", frame=20)
if pb_wheel:
    pb_wheel.scale = (1.0, 1.0, 1.0)
    pb_wheel.keyframe_insert(data_path="scale", frame=20)

# F28: Touchdown & Impact Squash (Shock absorption)
if pb_root:
    pb_root.location = (0, 0, 0.0)
    pb_root.keyframe_insert(data_path="location", frame=28)
if pb_frame:
    pb_frame.location = (0, 0, -0.14)
    pb_frame.scale = (1.12, 1.12, 0.86)
    pb_frame.rotation_euler = (math.radians(2), 0, 0)
    pb_frame.keyframe_insert(data_path="location", frame=28)
    pb_frame.keyframe_insert(data_path="scale", frame=28)
    pb_frame.keyframe_insert(data_path="rotation_euler", frame=28)
if pb_wheel:
    pb_wheel.scale = (1.12, 1.12, 0.88)
    pb_wheel.keyframe_insert(data_path="scale", frame=28)

# F36: Return to Rest
reset_pose()
for pb in [pb_root, pb_frame, pb_saddle, pb_wheel]:
    if pb:
        pb.keyframe_insert(data_path="location", frame=36)
        pb.keyframe_insert(data_path="rotation_euler", frame=36)
        pb.keyframe_insert(data_path="scale", frame=36)

# =============================================================================
# 2. EMOTE TALKING (24 frames, loopable)
# =============================================================================
print("Baking emote_talking...")
act_talk = create_action("emote_talking")

for f in range(1, 25):
    t = (f - 1) / 23.0
    # Chatter wave: rapid rhythmic pitch flapping
    flap = math.sin(t * 4.0 * math.pi) * math.radians(12.0)
    bob = -abs(math.sin(t * 4.0 * math.pi)) * 0.04
    tilt = math.cos(t * 2.0 * math.pi) * math.radians(4.0)

    if pb_saddle:
        pb_saddle.rotation_euler = (flap, tilt, 0)
        pb_saddle.location = (0, 0, bob)
        pb_saddle.keyframe_insert(data_path="rotation_euler", frame=f)
        pb_saddle.keyframe_insert(data_path="location", frame=f)
    if pb_frame:
        pb_frame.rotation_euler = (math.radians(2) * math.sin(t * 2.0 * math.pi), 0, 0)
        pb_frame.keyframe_insert(data_path="rotation_euler", frame=f)

# =============================================================================
# 3. EMOTE DANCING (48 frames, loopable)
# =============================================================================
print("Baking emote_dancing...")
act_dance = create_action("emote_dancing")

for f in range(1, 49):
    t = (f - 1) / 47.0
    # Full 360 yaw rotation on root with rhythmic roll rocking
    yaw = t * 2.0 * math.pi
    sway = math.sin(t * 4.0 * math.pi) * math.radians(16.0)
    hop = abs(math.sin(t * 4.0 * math.pi)) * 0.12
    crank_spin = t * 4.0 * math.pi

    if pb_root:
        pb_root.rotation_euler = (0, 0, yaw)
        pb_root.location = (0, 0, hop)
        pb_root.keyframe_insert(data_path="rotation_euler", frame=f)
        pb_root.keyframe_insert(data_path="location", frame=f)
    if pb_frame:
        pb_frame.rotation_euler = (0, sway, 0)
        pb_frame.keyframe_insert(data_path="rotation_euler", frame=f)
    if pb_saddle:
        pb_saddle.rotation_euler = (math.sin(t * 8.0 * math.pi) * math.radians(8.0), 0, 0)
        pb_saddle.keyframe_insert(data_path="rotation_euler", frame=f)
    if pb_wheel:
        pb_wheel.rotation_euler = (crank_spin, 0, 0)
        pb_wheel.keyframe_insert(data_path="rotation_euler", frame=f)

# =============================================================================
# 4. EMOTE SPRINTING (24 frames, loopable)
# =============================================================================
print("Baking emote_sprinting...")
act_sprint = create_action("emote_sprinting")

for f in range(1, 25):
    t = (f - 1) / 23.0
    # Aggressive aerodynamic forward tuck (-26 deg) with rapid pedal spin
    cadence = t * 2.0 * math.pi * 2.0 # 2 full crank turns per cycle
    bob = math.sin(t * 4.0 * math.pi) * 0.02

    if pb_frame:
        pb_frame.rotation_euler = (math.radians(-26), 0, math.sin(t * 4.0 * math.pi) * math.radians(3))
        pb_frame.location = (0, 0, -0.04 + bob)
        pb_frame.keyframe_insert(data_path="rotation_euler", frame=f)
        pb_frame.keyframe_insert(data_path="location", frame=f)
    if pb_saddle:
        pb_saddle.rotation_euler = (math.radians(-14), 0, 0)
        pb_saddle.keyframe_insert(data_path="rotation_euler", frame=f)
    if pb_wheel:
        pb_wheel.rotation_euler = (cadence, 0, 0)
        pb_wheel.keyframe_insert(data_path="rotation_euler", frame=f)

# =============================================================================
# 5. EMOTE STARTLED (30 frames)
# =============================================================================
print("Baking emote_startled...")
act_startled = create_action("emote_startled")

# F1: Normal
reset_pose()
for pb in [pb_root, pb_frame, pb_saddle]:
    if pb:
        pb.keyframe_insert(data_path="location", frame=1)
        pb.keyframe_insert(data_path="rotation_euler", frame=1)

# F6: Sudden vertical shock recoil
if pb_root:
    pb_root.location = (0, 0, 0.28)
    pb_root.keyframe_insert(data_path="location", frame=6)
if pb_frame:
    pb_frame.rotation_euler = (math.radians(18), 0, 0) # Jerks back in fright!
    pb_frame.scale = (0.90, 0.90, 1.20)
    pb_frame.keyframe_insert(data_path="rotation_euler", frame=6)
    pb_frame.keyframe_insert(data_path="scale", frame=6)
if pb_saddle:
    pb_saddle.rotation_euler = (math.radians(24), 0, 0)
    pb_saddle.keyframe_insert(data_path="rotation_euler", frame=6)

# F12-F22: Shivering / vibrating with nervous energy
for f in range(12, 23, 2):
    jitter = ((f % 4) - 2) * 0.015
    if pb_root:
        pb_root.location = (jitter, 0, 0.04)
        pb_root.keyframe_insert(data_path="location", frame=f)
    if pb_frame:
        pb_frame.rotation_euler = (math.radians(10 + jitter * 200), jitter * 5, 0)
        pb_frame.keyframe_insert(data_path="rotation_euler", frame=f)

# F30: Recover to rest
reset_pose()
for pb in [pb_root, pb_frame, pb_saddle]:
    if pb:
        pb.keyframe_insert(data_path="location", frame=30)
        pb.keyframe_insert(data_path="rotation_euler", frame=30)
        pb.keyframe_insert(data_path="scale", frame=30)

# =============================================================================
# 6. EMOTE GLANCE SIDE (36 frames)
# =============================================================================
print("Baking emote_glance_side...")
act_glance = create_action("emote_glance_side")

# F1: Center
reset_pose()
if pb_saddle:
    pb_saddle.keyframe_insert(data_path="rotation_euler", frame=1)

# F10-F26: Saddle turns 45 deg to right to eyeball competitor
if pb_saddle:
    pb_saddle.rotation_euler = (0, 0, math.radians(-45))
    pb_saddle.keyframe_insert(data_path="rotation_euler", frame=10)
    pb_saddle.keyframe_insert(data_path="rotation_euler", frame=26)

# F36: Return to center
if pb_saddle:
    pb_saddle.rotation_euler = (0, 0, 0)
    pb_saddle.keyframe_insert(data_path="rotation_euler", frame=36)

# Set jump as active action
arm.animation_data.action = act_jump
reset_pose()

# Save blend file
print(f"Saving updated {BLEND_PATH}...")
bpy.ops.wm.save_mainfile(filepath=BLEND_PATH)

# =============================================================================
# EXPORT ALL ACTIONS TO HERO GLB
# =============================================================================
print(f"Exporting full kinematic suite to {OUTPUT_GLB}...")
bpy.ops.object.mode_set(mode='OBJECT')
# Strict selection: ONLY objects in New_Uniracer_Model + Uniracer_Rig
bpy.ops.object.select_all(action='DESELECT')
coll = bpy.data.collections.get('New_Uniracer_Model')
if coll:
    for obj in coll.objects:
        obj.select_set(True)
if arm:
    arm.select_set(True)
    bpy.context.view_layer.objects.active = arm

# Ensure all 6 actions + existing actions are included in glTF animation export
bpy.ops.export_scene.gltf(
    filepath=OUTPUT_GLB,
    export_format='GLB',
    use_selection=True,
    export_apply=False,
    export_yup=True,
    export_materials='EXPORT',
    export_armature_object_remove=False,
    export_animations=True
)

print(f"✅ SUCCESS: Baked all kinematic actions & emotes into {OUTPUT_GLB} ({os.path.getsize(OUTPUT_GLB):,} bytes)")
