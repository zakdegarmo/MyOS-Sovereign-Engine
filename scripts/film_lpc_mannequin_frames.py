import bpy
import math
import os

BLEND_PATH = os.path.abspath('mannequin_decivoxel_flesh_studio.blend')
bpy.ops.wm.open_mainfile(filepath=BLEND_PATH)
print(f'Loaded {BLEND_PATH}')

arm = bpy.data.objects['Armature']
action = bpy.data.actions.get('Walk_Loop')
if not action:
    raise RuntimeError("Action 'Walk_Loop' not found!")
arm.animation_data.action = action

scene = bpy.context.scene
scene.render.engine = 'BLENDER_EEVEE'
scene.render.resolution_x = 512
scene.render.resolution_y = 512
scene.render.film_transparent = True
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'

# Hide reference billboards
for o in bpy.data.objects:
    if 'SideBySide' in o.name or 'DirectOverlay' in o.name:
        o.hide_render = True

cam = bpy.data.objects['RenderCam']
cam.data.type = 'ORTHO'
cam.data.ortho_scale = 1.85
scene.camera = cam

for c in list(cam.constraints):
    cam.constraints.remove(c)

# Calibrated geometric center during Walk_Loop: (0.0, -1.30, -0.42)
cx, cy, cz = 0.0, -1.30, -0.42
dist = 3.5

# 4 Cardinal Angles: (Name, Location, RotationEuler)
DIRECTIONS = [
    # North (Row 8): facing away, camera from behind (+Y) looking South (-Y)
    ("north", 8, (cx, cy + dist, cz), (math.radians(90), 0, math.radians(180))),
    # West (Row 9): facing left, camera from right (+X) looking West (-X)
    ("west", 9, (cx + dist, cy, cz), (math.radians(90), 0, math.radians(90))),
    # South (Row 10): facing camera, camera from front (-Y) looking North (+Y)
    ("south", 10, (cx, cy - dist, cz), (math.radians(90), 0, 0)),
    # East (Row 11): facing right, camera from left (-X) looking East (+X)
    ("east", 11, (cx - dist, cy, cz), (math.radians(90), 0, math.radians(-90))),
]

raw_out_dir = os.path.abspath('artifacts/lpc_filming/raw_frames')
os.makedirs(raw_out_dir, exist_ok=True)

# 9 frames per walk cycle sampled across the 40-frame action
sampled_frames = [round(i * 39.0 / 8.0) for i in range(9)]
print(f'Sampled frames: {sampled_frames}')

for d_name, row_idx, cam_pos, cam_rot in DIRECTIONS:
    cam.location = cam_pos
    cam.rotation_euler = cam_rot
    print(f'Filming direction: {d_name.upper()} (Row {row_idx})')
    
    for col_idx, src_frame in enumerate(sampled_frames):
        scene.frame_set(int(src_frame))
        bpy.context.view_layer.update()
        
        frame_filename = f"walk_{d_name}_r{row_idx:02d}_c{col_idx:02d}.png"
        out_path = os.path.join(raw_out_dir, frame_filename)
        scene.render.filepath = out_path
        bpy.ops.render.render(write_still=True)

print('\n=== All 36 walk cycle frames successfully filmed! ===')
