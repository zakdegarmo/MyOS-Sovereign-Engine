import bpy
import math
import os

# 1. LOAD MASTER BLEND
blend_file = os.path.abspath(r"apps\web\public\actions\hemp_crew\frankie_humanoid_master.blend")
bpy.ops.wm.open_mainfile(filepath=blend_file)

arm = bpy.data.objects.get("Armature")
if not arm:
    raise RuntimeError("Armature not found in frankie_humanoid_master.blend!")

arm.data.pose_position = 'POSE'

# Ensure CamTarget and RenderCam exist and are correctly positioned
target = bpy.data.objects.get("CamTarget")
if not target:
    target = bpy.data.objects.new("CamTarget", None)
    bpy.context.collection.objects.link(target)
target.location = (0.0, 0.0, 1.02)

cam = bpy.data.objects.get("RenderCam")
if not cam:
    cam_data = bpy.data.cameras.new("RenderCam")
    cam = bpy.data.objects.new("RenderCam", cam_data)
    bpy.context.collection.objects.link(cam)

cam.data.type = 'ORTHO'
cam.data.ortho_scale = 2.45
bpy.context.scene.camera = cam

# Configure Render Settings
scene = bpy.context.scene
scene.render.engine = "BLENDER_EEVEE"
scene.render.resolution_x = 512
scene.render.resolution_y = 512
scene.render.film_transparent = True
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGBA"

# Base filming directions
# LPC Standard Rows:
# Row 0: North (Back facing camera, looking away / up)
# Row 1: West  (Facing left on screen)
# Row 2: South (Front facing camera, looking down / forward)
# Row 3: East  (Facing right on screen)
cam_dist = 3.5
cam_z    = 1.02

DIRECTIONS = [
    ("north", 0, ( 0.0,       cam_dist, cam_z)),
    ("west",  1, ( cam_dist,  0.0,      cam_z)),
    ("south", 2, ( 0.0,      -cam_dist, cam_z)),
    ("east",  3, (-cam_dist,  0.0,      cam_z)),
]

base_out_dir = os.path.abspath(r"apps\web\public\actions\hemp_crew")
os.makedirs(base_out_dir, exist_ok=True)

# ─────────────────────────────────────────────────────────────────────────────
# ACTION A: WALK CYCLE (Mixamo Walk_Loop sampled at 8 frames with Tail physics)
# ─────────────────────────────────────────────────────────────────────────────
print("=== PREPARING ACTION: WALK_LOOP ===")
walk_action = bpy.data.actions.get("Walk_Loop")
if not walk_action:
    raise RuntimeError("Walk_Loop action not found!")

arm.animation_data.action = walk_action
pb = arm.pose.bones

# Add procedural keyframes for Tail and Jaw to Walk_Loop
for f in range(0, 41):
    phase = 2.0 * math.pi * (f / 40.0)
    sway_deg = 8.0 * math.sin(phase)
    for t_idx, bname in enumerate(["Tail.1", "Tail.2", "Tail.3", "Tail.4", "Tail.Tip"]):
        if bname in pb:
            mult = (t_idx + 1) * 0.35
            pb[bname].rotation_mode = 'XYZ'
            pb[bname].rotation_euler = (0.0, 0.0, math.radians(sway_deg * mult))
            pb[bname].keyframe_insert(data_path="rotation_euler", frame=f)
            
    if "Jaw" in pb:
        pb["Jaw"].rotation_mode = 'XYZ'
        jaw_deg = -3.0 * (0.5 + 0.5 * math.sin(phase * 2.0))
        pb["Jaw"].rotation_euler = (math.radians(jaw_deg), 0.0, 0.0)
        pb["Jaw"].keyframe_insert(data_path="rotation_euler", frame=f)

walk_sampled_frames = [round(i * 39.0 / 7.0) for i in range(8)]
print(f"Sampling Walk frames: {walk_sampled_frames}")

walk_raw_dir = os.path.join(base_out_dir, "raw_walk_frames")
os.makedirs(walk_raw_dir, exist_ok=True)

print("=== FILMING HUMANOID WALK CYCLE (4 Angles x 8 Frames) ===")
for d_name, d_row, d_pos in DIRECTIONS:
    cam.location = d_pos
    for col_idx, src_frame in enumerate(walk_sampled_frames):
        scene.frame_set(int(src_frame))
        bpy.context.view_layer.update()
        frame_name = f"walk_{d_name}_f{col_idx:02d}.png"
        frame_path = os.path.join(walk_raw_dir, frame_name)
        scene.render.filepath = frame_path
        bpy.ops.render.render(write_still=True)
        print(f"Rendered [WALK {d_name.upper()}] Frame {col_idx}: {frame_name}")

# ─────────────────────────────────────────────────────────────────────────────
# ACTION B: IDLE RANT (8-frame seamless loop: Drunken ranting, talking jaw, joint waving)
# ─────────────────────────────────────────────────────────────────────────────
print("\n=== PREPARING ACTION: IDLE_RANT ===")
if "Frankie_Humanoid_Idle_Rant" in bpy.data.actions:
    bpy.data.actions.remove(bpy.data.actions["Frankie_Humanoid_Idle_Rant"])

idle_act = bpy.data.actions.new("Frankie_Humanoid_Idle_Rant")
arm.animation_data.action = idle_act

animated_bones = [
    "Head", "Jaw", "Spine", "Spine01", "LeftArm", "LeftForeArm", "LeftHand",
    "RightArm", "RightForeArm", "Tail.1", "Tail.2", "Tail.3", "Tail.4", "Tail.Tip"
]
for bname in animated_bones:
    if bname in pb:
        pb[bname].rotation_mode = 'XYZ'

idle_rant_data = [
    (1, ( 0.0,  0.0,  0.0),   0.0, ( 0.0, 0.0,  0.0), ( 0.0,  0.0,  0.0), (-10.0,  15.0, -10.0), ( 45.0, -20.0,  10.0),  0.0),
    (2, (-4.0,  2.0,  3.0),  -9.0, ( 1.5, 0.0,  1.0), ( 1.0,  0.0,  1.5), (-16.0,  22.0, -18.0), ( 55.0, -30.0,  15.0),  7.0),
    (3, (-2.0,  3.5,  5.0),  -4.0, ( 2.5, 0.0,  2.0), ( 2.0,  0.0,  2.5), (-22.0,  28.0, -24.0), ( 65.0, -38.0,  20.0), 14.0),
    (4, ( 3.0, -1.0, -2.0), -12.0, ( 1.0, 0.0,  0.5), ( 0.5,  0.0,  0.0), (-25.0,  32.0, -28.0), ( 70.0, -42.0,  22.0),  9.0),
    (5, ( 1.0, -3.0, -3.0),  -5.0, (-1.0, 0.0, -1.0), (-1.0,  0.0, -1.5), (-18.0,  24.0, -20.0), ( 60.0, -32.0,  16.0), -3.0),
    (6, (-3.0, -4.0, -4.0), -10.0, (-2.0, 0.0, -2.0), (-2.0,  0.0, -2.0), ( -8.0,  12.0,  -8.0), ( 48.0, -18.0,   8.0), -9.0),
    (7, ( 2.0, -1.5,  1.5),  -3.0, (-0.8, 0.0, -0.5), (-0.5,  0.0, -0.8), ( -6.0,  10.0,  -6.0), ( 42.0, -15.0,   6.0), -4.0),
    (8, ( 0.0,  0.0,  0.0),   0.0, ( 0.0, 0.0,  0.0), ( 0.0,  0.0,  0.0), (-10.0,  15.0, -10.0), ( 45.0, -20.0,  10.0),  0.0),
]

for frame, h_rot, jaw_x, sp_rot, sp1_rot, la_rot, lfa_rot, tail_z in idle_rant_data:
    scene.frame_set(frame)
    if "Head" in pb:
        pb["Head"].rotation_euler = (math.radians(h_rot[0]), math.radians(h_rot[1]), math.radians(h_rot[2]))
        pb["Head"].keyframe_insert(data_path="rotation_euler", frame=frame)
    if "Jaw" in pb:
        pb["Jaw"].rotation_euler = (math.radians(jaw_x), 0.0, 0.0)
        pb["Jaw"].keyframe_insert(data_path="rotation_euler", frame=frame)
    if "Spine" in pb:
        pb["Spine"].rotation_euler = (math.radians(sp_rot[0]), math.radians(sp_rot[1]), math.radians(sp_rot[2]))
        pb["Spine"].keyframe_insert(data_path="rotation_euler", frame=frame)
    if "Spine01" in pb:
        pb["Spine01"].rotation_euler = (math.radians(sp1_rot[0]), math.radians(sp1_rot[1]), math.radians(sp1_rot[2]))
        pb["Spine01"].keyframe_insert(data_path="rotation_euler", frame=frame)
    if "LeftArm" in pb:
        pb["LeftArm"].rotation_euler = (math.radians(la_rot[0]), math.radians(la_rot[1]), math.radians(la_rot[2]))
        pb["LeftArm"].keyframe_insert(data_path="rotation_euler", frame=frame)
    if "LeftForeArm" in pb:
        pb["LeftForeArm"].rotation_euler = (math.radians(lfa_rot[0]), math.radians(lfa_rot[1]), math.radians(lfa_rot[2]))
        pb["LeftForeArm"].keyframe_insert(data_path="rotation_euler", frame=frame)
    for t_idx, bname in enumerate(["Tail.1", "Tail.2", "Tail.3", "Tail.4", "Tail.Tip"]):
        if bname in pb:
            mult = (t_idx + 1) * 0.45
            pb[bname].rotation_euler = (0.0, 0.0, math.radians(tail_z * mult))
            pb[bname].keyframe_insert(data_path="rotation_euler", frame=frame)

idle_raw_dir = os.path.join(base_out_dir, "raw_idle_frames")
os.makedirs(idle_raw_dir, exist_ok=True)

print("\n=== FILMING HUMANOID IDLE RANT (4 Angles x 8 Frames) ===")
for d_name, d_row, d_pos in DIRECTIONS:
    cam.location = d_pos
    for f in range(1, 9):
        col_idx = f - 1
        scene.frame_set(f)
        bpy.context.view_layer.update()
        frame_name = f"idle_{d_name}_f{col_idx:02d}.png"
        frame_path = os.path.join(idle_raw_dir, frame_name)
        scene.render.filepath = frame_path
        bpy.ops.render.render(write_still=True)
        print(f"Rendered [IDLE {d_name.upper()}] Frame {col_idx}: {frame_name}")

bpy.ops.wm.save_mainfile(filepath=blend_file)
print(f"\nSuccessfully filmed all humanoid actions and saved {blend_file}!")
