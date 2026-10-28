import bpy
import math
import os

blend_file = os.path.abspath(r"apps\web\public\actions\hemp_crew\frankie_humanoid_master.blend")
bpy.ops.wm.open_mainfile(filepath=blend_file)

arm = bpy.data.objects.get("Armature")
if not arm:
    raise RuntimeError("Armature not found!")

arm.data.pose_position = 'POSE'

target = bpy.data.objects.get("CamTarget")
if not target:
    target = bpy.data.objects.new("CamTarget", None)
    bpy.context.collection.objects.link(target)
target.location = (0.0, 0.0, 1.02)

cam = bpy.data.objects.get("RenderCam")
cam.data.type = 'ORTHO'
cam.data.ortho_scale = 2.45
bpy.context.scene.camera = cam

scene = bpy.context.scene
scene.render.engine = "BLENDER_EEVEE"
scene.render.resolution_x = 512
scene.render.resolution_y = 512
scene.render.film_transparent = True
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGBA"

cam_dist = 3.5
cam_z    = 1.02

DIRECTIONS = [
    ("north", 0, ( 0.0,       cam_dist, cam_z)),
    ("west",  1, ( cam_dist,  0.0,      cam_z)),
    ("south", 2, ( 0.0,      -cam_dist, cam_z)),
    ("east",  3, (-cam_dist,  0.0,      cam_z)),
]

base_out_dir = os.path.abspath(r"apps\web\public\actions\hemp_crew")
viseme_raw_dir = os.path.join(base_out_dir, "raw_viseme_frames")
os.makedirs(viseme_raw_dir, exist_ok=True)

# ─────────────────────────────────────────────────────────────────────────────
# PHONETIC SPEECH VISEMES (8 Standard Phoneme Targets)
# Frame 1: 'sil' / Rest     (Closed mouth, buck teeth resting on lower lip)
# Frame 2: 'AA'  / Ah       (Jaw drops wide open, vowels A, Ah, Ay, lower teeth drop)
# Frame 3: 'O'   / Oh       (Rounded puckered vowel O, Oo, buck teeth at top)
# Frame 4: 'EE'  / Ee       (Wide horizontal grin / sneer, vowels E, I, consonants S, Z)
# Frame 5: 'FV'  / F_V      (Lower lip tucked tight under buck teeth tips)
# Frame 6: 'CDG' / Dental   (Jaw slightly open behind buck teeth, consonants T, D, N, L)
# Frame 7: 'Rant_Scream'    (Maximum manic shouting wide mouth)
# Frame 8: 'Cackle_Snicker' (Asymmetrical drunk grin / cackle)
# ─────────────────────────────────────────────────────────────────────────────
print("=== PREPARING PHONETIC VISEME ACTION ===")
if "Frankie_Humanoid_Visemes" in bpy.data.actions:
    bpy.data.actions.remove(bpy.data.actions["Frankie_Humanoid_Visemes"])

viseme_act = bpy.data.actions.new("Frankie_Humanoid_Visemes")
arm.animation_data.action = viseme_act
pb = arm.pose.bones

for bname in ["Head", "Jaw", "LeftArm", "LeftForeArm", "LeftHand", "Spine", "Spine01"]:
    if bname in pb:
        pb[bname].rotation_mode = 'XYZ'

# Casual relaxed body posture holding joint comfortably
if "LeftArm" in pb:
    pb["LeftArm"].rotation_euler = (math.radians(-14), math.radians(18), math.radians(-12))
if "LeftForeArm" in pb:
    pb["LeftForeArm"].rotation_euler = (math.radians(48), math.radians(-24), math.radians(12))

# (frame, jaw_x_deg, head_xyz_deg, spine_z_deg)
viseme_data = [
    (1,   0.0, ( 0.0,  0.0,  0.0),  0.0), # 0: sil / Rest
    (2, -18.0, ( 2.5,  0.0,  0.0),  0.0), # 1: AA / Ah (wide vowel)
    (3,  -8.0, (-1.5,  0.0,  0.0),  0.0), # 2: O / Oh (round vowel)
    (4,  -4.0, ( 1.0,  2.0,  1.5),  0.0), # 3: EE / Ee (wide grin / sneer)
    (5,  -2.0, (-1.0, -1.0,  0.0),  0.0), # 4: FV / F_V (lip under buck teeth)
    (6,  -7.0, ( 1.5,  0.0, -1.0),  0.0), # 5: CDG / Dental (T, D, L)
    (7, -25.0, ( 4.5, -2.0,  2.0),  1.5), # 6: Rant_Scream (full manic rant)
    (8,  -9.0, (-3.0,  4.5, -3.5), -1.5), # 7: Cackle (drunk crooked smirk)
]

for frame, jaw_deg, head_rot, sp_z in viseme_data:
    scene.frame_set(frame)
    if "Jaw" in pb:
        pb["Jaw"].rotation_euler = (math.radians(jaw_deg), 0.0, 0.0)
        pb["Jaw"].keyframe_insert(data_path="rotation_euler", frame=frame)
    if "Head" in pb:
        pb["Head"].rotation_euler = (math.radians(head_rot[0]), math.radians(head_rot[1]), math.radians(head_rot[2]))
        pb["Head"].keyframe_insert(data_path="rotation_euler", frame=frame)
    if "LeftArm" in pb:
        # Subtle joint gesture accompanying yell/cackle
        arm_sway = math.radians(6.0 if frame in [2, 7] else 0.0)
        pb["LeftArm"].rotation_euler = (math.radians(-14) + arm_sway, math.radians(18), math.radians(-12))
        pb["LeftArm"].keyframe_insert(data_path="rotation_euler", frame=frame)

print("\n=== FILMING PHONETIC SPEECH VISEMES (4 Angles x 8 Visemes) ===")
for d_name, d_row, d_pos in DIRECTIONS:
    cam.location = d_pos
    for f in range(1, 9):
        col_idx = f - 1
        scene.frame_set(f)
        bpy.context.view_layer.update()
        frame_name = f"viseme_{d_name}_f{col_idx:02d}.png"
        frame_path = os.path.join(viseme_raw_dir, frame_name)
        scene.render.filepath = frame_path
        bpy.ops.render.render(write_still=True)
        print(f"Rendered [VISEME {d_name.upper()}] Frame {col_idx} ({viseme_data[col_idx][0]}): {frame_name}")

bpy.ops.wm.save_mainfile(filepath=blend_file)
print("Filming of all 8 Phonetic Visemes across 4 directions Complete!")
