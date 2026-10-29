import bpy
import math
import os

blend_file = os.path.abspath(r"apps\web\public\actions\hemp_crew\frankie_actor_master.blend")
bpy.ops.wm.open_mainfile(filepath=blend_file)

arm = bpy.data.objects.get("Frankie_Armature")
if not arm:
    raise RuntimeError("Frankie_Armature not found in blend file!")

pb = arm.pose.bones
for b in pb:
    b.rotation_mode = 'XYZ'

scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end = 8

# ─── KEYFRAME ACTION 1: IDLE_RANT (8 Frames Seamless Loop) ───────────────────
# Animation data tuple:
# (frame, head_rot_xyz, jaw_rot_x, chest_rot_xyz, uarm_l_rot_xyz, farm_l_rot_xyz, tail_sway_deg)
keyframes_idle_rant = [
    (1, ( 0.0,  0.0,  0.0),   0.0, ( 0.0, 0.0,  0.0), ( 0.0,  0.0,  0.0), ( 0.0,  0.0,  0.0),  0.0),
    (2, (-4.0,  1.5,  2.5),  -8.0, ( 2.0, 0.0,  1.0), (-6.0,  8.0, -6.0), ( 4.0, -4.0,  2.0),  6.0),
    (3, (-2.0,  3.0,  4.0),  -3.0, ( 3.5, 0.0,  2.0), (-12.0, 14.0, -12.0), ( 8.0, -8.0,  4.0), 12.0),
    (4, ( 3.0, -1.0, -3.0), -11.0, ( 1.5, 0.0,  0.5), (-16.0, 18.0, -15.0), (12.0, -10.0, 6.0),  8.0),
    (5, ( 0.0, -2.5, -2.0),  -4.0, ( 0.0, 0.0, -1.0), (-8.0,  10.0, -8.0), ( 6.0, -5.0,  3.0), -2.0),
    (6, (-3.5, -3.5, -4.5),  -9.0, (-2.0, 0.0, -2.0), ( 4.0, -6.0,   4.0), (-4.0,  3.0, -2.0), -8.0),
    (7, ( 2.0, -1.0,  1.0),  -2.0, (-1.0, 0.0, -1.0), ( 2.0, -3.0,   2.0), (-2.0,  1.5, -1.0), -4.0),
    (8, ( 0.0,  0.0,  0.0),   0.0, ( 0.0, 0.0,  0.0), ( 0.0,  0.0,  0.0), ( 0.0,  0.0,  0.0),  0.0),
]

for frame, h_rot, jaw_x, c_rot, uarm_l, farm_l, tail_z in keyframes_idle_rant:
    scene.frame_set(frame)
    
    # Head Bob & Drunken Tilt
    pb["Head"].rotation_euler = (math.radians(h_rot[0]), math.radians(h_rot[1]), math.radians(h_rot[2]))
    pb["Head"].keyframe_insert(data_path="rotation_euler", frame=frame)
    
    # Articulated Jaw Opening & Muttering (moving lower teeth and goatee down)
    pb["Jaw"].rotation_euler = (math.radians(jaw_x), 0.0, 0.0)
    pb["Jaw"].keyframe_insert(data_path="rotation_euler", frame=frame)
    
    # Chest Breathing & Subtle Heave
    pb["Chest"].rotation_euler = (math.radians(c_rot[0]), math.radians(c_rot[1]), math.radians(c_rot[2]))
    pb["Chest"].keyframe_insert(data_path="rotation_euler", frame=frame)
    
    # Left Arm Gesturing with Joint
    pb["UpperArm.L"].rotation_euler = (math.radians(uarm_l[0]), math.radians(uarm_l[1]), math.radians(uarm_l[2]))
    pb["UpperArm.L"].keyframe_insert(data_path="rotation_euler", frame=frame)
    
    pb["Forearm.L"].rotation_euler = (math.radians(farm_l[0]), math.radians(farm_l[1]), math.radians(farm_l[2]))
    pb["Forearm.L"].keyframe_insert(data_path="rotation_euler", frame=frame)
    
    # Sinusoidal Tail Chain Undulation
    for t_idx, bname in enumerate(["Tail.1", "Tail.2", "Tail.3", "Tail.4", "Tail.Tip"]):
        multiplier = (t_idx + 1) * 0.45
        pb[bname].rotation_euler = (0.0, 0.0, math.radians(tail_z * multiplier))
        pb[bname].keyframe_insert(data_path="rotation_euler", frame=frame)

print("Keyframed Action: idle_rant on Frankie_Armature")

# ─── RENDER CONFIGURATION ───────────────────────────────────────────────────
scene.render.engine = "BLENDER_EEVEE"
scene.render.resolution_x = 512
scene.render.resolution_y = 512
scene.render.film_transparent = True
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGBA"

cam_obj = bpy.data.objects.get("Main_Camera")
scene.camera = cam_obj

out_dir = os.path.abspath(r"apps\web\public\actions\hemp_crew")
raw_frames_dir = os.path.join(out_dir, "raw_frankie_frames")
os.makedirs(raw_frames_dir, exist_ok=True)

# ─── FILMING 4 CARDINAL DIRECTIONS x 8 FRAMES ───────────────────────────────
# Distance 3.8m, Height 1.02m (Calibrated to volumetric center)
cam_dist = 3.8
cam_z    = 1.02

directions = [
    ("north", 0, ( 0.0,      cam_dist, cam_z)), # Row 0: Facing North (back to camera)
    ("west",  1, (-cam_dist,  0.0,      cam_z)), # Row 1: Facing West (facing left)
    ("south", 2, ( 0.0,     -cam_dist, cam_z)), # Row 2: Facing South (facing front/camera)
    ("east",  3, ( cam_dist,  0.0,      cam_z)), # Row 3: Facing East (facing right)
]

print("=== FILMING RIGGED FRANKIE ACTOR (4 Angles x 8 Frames) ===")
for d_name, d_row, d_pos in directions:
    cam_obj.location = d_pos
    for f in range(1, 9):
        scene.frame_set(f)
        frame_filename = f"frankie_{d_name}_f{f:02d}.png"
        frame_path = os.path.join(raw_frames_dir, frame_filename)
        scene.render.filepath = frame_path
        bpy.ops.render.render(write_still=True)
        print(f"Filmed [{d_name.upper()}] Frame {f}: {frame_filename}")

# Save updated blend file with animation actions
bpy.ops.wm.save_as_mainfile(filepath=blend_file)
print("Saved Rigged & Animated Frankie Blend at:", blend_file)
print("=== HEADLESS FILMING COMPLETE ===")
