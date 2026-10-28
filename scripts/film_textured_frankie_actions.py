import bpy
import math
import os

blend_file = os.path.abspath(r"apps\web\public\actions\hemp_crew\frankie_textured_master.blend")
if not os.path.exists(blend_file):
    raise RuntimeError(f"Textured blend file not found: {blend_file}")

bpy.ops.wm.open_mainfile(filepath=blend_file)
print(f"Loaded textured blend file: {blend_file}")

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
if not cam:
    cam_data = bpy.data.cameras.new("RenderCam")
    cam = bpy.data.objects.new("RenderCam", cam_data)
    bpy.context.collection.objects.link(cam)

cam.data.type = 'ORTHO'
cam.data.ortho_scale = 2.45
bpy.context.scene.camera = cam

tt = cam.constraints.get("TrackTo")
if not tt:
    tt = cam.constraints.new(type='TRACK_TO')
tt.name = "TrackTo"
tt.target = target
tt.track_axis = 'TRACK_NEGATIVE_Z'
tt.up_axis = 'UP_Z'

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

# ─────────────────────────────────────────────────────────────────────────────
# 1. FILM 8 PHONETIC VISEMES (4 Directions x 8 Frames = 32 Frames)
# ─────────────────────────────────────────────────────────────────────────────
viseme_raw_dir = os.path.join(base_out_dir, "raw_textured_viseme_frames")
os.makedirs(viseme_raw_dir, exist_ok=True)

print("\n=== FILMING TEXTURED PHONETIC SPEECH VISEMES ===")
if "Frankie_Textured_Visemes" in bpy.data.actions:
    bpy.data.actions.remove(bpy.data.actions["Frankie_Textured_Visemes"])

viseme_act = bpy.data.actions.new("Frankie_Textured_Visemes")
arm.animation_data.action = viseme_act
pb = arm.pose.bones

for bname in ["Head", "Jaw", "LeftArm", "LeftForeArm", "LeftHand", "Spine", "Spine01"]:
    if bname in pb:
        pb[bname].rotation_mode = 'XYZ'

if "LeftArm" in pb:
    pb["LeftArm"].rotation_euler = (math.radians(-14), math.radians(18), math.radians(-12))
if "LeftForeArm" in pb:
    pb["LeftForeArm"].rotation_euler = (math.radians(48), math.radians(-24), math.radians(12))

viseme_data = [
    (1,   0.0, ( 0.0,  0.0,  0.0),  0.0), # 0: sil / Rest
    (2, -18.0, ( 2.5,  0.0,  0.0),  0.0), # 1: AA / Ah
    (3,  -8.0, (-1.5,  0.0,  0.0),  0.0), # 2: O / Oh
    (4,  -4.0, ( 1.0,  2.0,  1.5),  0.0), # 3: EE / Ee
    (5,  -2.0, (-1.0, -1.0,  0.0),  0.0), # 4: FV / F_V
    (6,  -7.0, ( 1.5,  0.0, -1.0),  0.0), # 5: CDG / Dental
    (7, -25.0, ( 4.5, -2.0,  2.0),  1.5), # 6: Rant_Wide
    (8,  -9.0, (-3.0,  4.5, -3.5), -1.5), # 7: Cackle
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
        arm_sway = math.radians(6.0 if frame in [2, 7] else 0.0)
        pb["LeftArm"].rotation_euler = (math.radians(-14) + arm_sway, math.radians(18), math.radians(-12))
        pb["LeftArm"].keyframe_insert(data_path="rotation_euler", frame=frame)

for d_name, d_row, d_pos in DIRECTIONS:
    cam.location = d_pos
    for f_idx in range(8):
        frame_num = f_idx + 1
        scene.frame_set(frame_num)
        bpy.context.view_layer.update()
        frame_name = f"viseme_{d_name}_f{f_idx:02d}.png"
        out_path = os.path.join(viseme_raw_dir, frame_name)
        scene.render.filepath = out_path
        bpy.ops.render.render(write_still=True)
    print(f"  Rendered visemes angle: {d_name}")

# ─────────────────────────────────────────────────────────────────────────────
# 2. FILM WALK LOOP (4 Directions x 8 Frames = 32 Frames)
# ─────────────────────────────────────────────────────────────────────────────
walk_raw_dir = os.path.join(base_out_dir, "raw_textured_walk_frames")
os.makedirs(walk_raw_dir, exist_ok=True)

print("\n=== FILMING TEXTURED WALK LOOP ===")
walk_action = bpy.data.actions.get("Walk_Loop")
if walk_action:
    arm.animation_data.action = walk_action
    pb = arm.pose.bones
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

for d_name, d_row, d_pos in DIRECTIONS:
    cam.location = d_pos
    for col_idx, src_frame in enumerate(walk_sampled_frames):
        scene.frame_set(int(src_frame))
        bpy.context.view_layer.update()
        frame_name = f"walk_{d_name}_f{col_idx:02d}.png"
        out_path = os.path.join(walk_raw_dir, frame_name)
        scene.render.filepath = out_path
        bpy.ops.render.render(write_still=True)
    print(f"  Rendered walk angle: {d_name}")

# ─────────────────────────────────────────────────────────────────────────────
# 3. FILM IDLE RANT (4 Directions x 8 Frames = 32 Frames)
# ─────────────────────────────────────────────────────────────────────────────
idle_raw_dir = os.path.join(base_out_dir, "raw_textured_idle_frames")
os.makedirs(idle_raw_dir, exist_ok=True)

print("\n=== FILMING TEXTURED IDLE RANT ===")
if "Frankie_Idle_Rant" in bpy.data.actions:
    bpy.data.actions.remove(bpy.data.actions["Frankie_Idle_Rant"])

idle_action = bpy.data.actions.new("Frankie_Idle_Rant")
arm.animation_data.action = idle_action
pb = arm.pose.bones

for bname in ["Head", "Jaw", "Spine", "Spine01", "Spine02", "LeftArm", "LeftForeArm", "RightArm", "RightForeArm"]:
    if bname in pb:
        pb[bname].rotation_mode = 'XYZ'

for f in range(1, 9):
    scene.frame_set(f)
    t = (f - 1) / 7.0
    jaw_deg = -6.0 - 16.0 * abs(math.sin(t * math.pi * 3.0))
    head_p = 4.0 * math.sin(t * math.pi * 2.0)
    head_y = 6.0 * math.cos(t * math.pi * 2.0)
    chest_p = -2.0 * math.sin(t * math.pi * 2.0)
    tail_s = 14.0 * math.sin(t * math.pi * 2.0)

    if "Jaw" in pb:
        pb["Jaw"].rotation_euler = (math.radians(jaw_deg), 0.0, 0.0)
        pb["Jaw"].keyframe_insert(data_path="rotation_euler", frame=f)
    if "Head" in pb:
        pb["Head"].rotation_euler = (math.radians(head_p), math.radians(head_y * 0.5), math.radians(head_y))
        pb["Head"].keyframe_insert(data_path="rotation_euler", frame=f)
    if "Spine02" in pb:
        pb["Spine02"].rotation_euler = (math.radians(chest_p), 0.0, 0.0)
        pb["Spine02"].keyframe_insert(data_path="rotation_euler", frame=f)
    if "LeftArm" in pb:
        pb["LeftArm"].rotation_euler = (math.radians(-14 + 6.0 * math.sin(t * math.pi * 4.0)), math.radians(18), math.radians(-12))
        pb["LeftArm"].keyframe_insert(data_path="rotation_euler", frame=f)
    if "RightArm" in pb:
        pb["RightArm"].rotation_euler = (math.radians(10.0 + 8.0 * math.cos(t * math.pi * 2.0)), 0.0, math.radians(15.0))
        pb["RightArm"].keyframe_insert(data_path="rotation_euler", frame=f)
    for t_idx, bname in enumerate(["Tail.1", "Tail.2", "Tail.3", "Tail.4", "Tail.Tip"]):
        if bname in pb:
            mult = (t_idx + 1) * 0.45
            pb[bname].rotation_mode = 'XYZ'
            pb[bname].rotation_euler = (0.0, 0.0, math.radians(tail_s * mult))
            pb[bname].keyframe_insert(data_path="rotation_euler", frame=f)

for d_name, d_row, d_pos in DIRECTIONS:
    cam.location = d_pos
    for f_idx in range(8):
        frame_num = f_idx + 1
        scene.frame_set(frame_num)
        bpy.context.view_layer.update()
        frame_name = f"idle_{d_name}_f{f_idx:02d}.png"
        out_path = os.path.join(idle_raw_dir, frame_name)
        scene.render.filepath = out_path
        bpy.ops.render.render(write_still=True)
    print(f"  Rendered idle angle: {d_name}")

print("\n=== ALL TEXTURED ACTIONS SUCCESSFULLY FILMED (96 Frames Total) ===")
