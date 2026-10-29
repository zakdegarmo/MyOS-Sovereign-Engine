import bpy, mathutils, math, os
from PIL import Image

# Ensure output directory exists
os.makedirs("apps/web/public/actions", exist_ok=True)
os.makedirs("artifacts/spritesheets", exist_ok=True)
os.makedirs("temp_tiles", exist_ok=True)

arm = bpy.data.objects['Armature']
cam = bpy.data.objects['RenderCam']
scene = bpy.context.scene

scene.render.film_transparent = True
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'
scene.render.resolution_x = 256
scene.render.resolution_y = 256

cam.data.type = 'ORTHO'
cam.data.ortho_scale = 1.65
cam.location = (0.007, -2.50, 0.95)
pitch = math.radians(78)
cam.rotation_euler = (pitch, 0, 0)

# 8 directions in exact MyOS order:
# Row 0: D (0 deg)
# Row 1: DL (-45 deg)
# Row 2: L (-90 deg)
# Row 3: UL (-135 deg)
# Row 4: U (180 deg)
# Row 5: UR (135 deg)
# Row 6: R (90 deg)
# Row 7: DR (45 deg)
dir_angles = [0, -45, -90, -135, 180, 135, 90, 45]

act = bpy.data.actions.get('Walk_Loop')
arm.animation_data.action = act
f_start = int(act.frame_range[0])
f_end = int(act.frame_range[1])
duration = f_end - f_start

frames = [int(round(f_start + i * (duration / 8.0))) for i in range(8)]
print(f"Sampling frames for Walk_Loop: {frames}")

sheet = Image.new('RGBA', (2048, 2048), (0, 0, 0, 0))

tile_tmp = os.path.abspath('temp_tiles/tile_tmp.png')
scene.render.filepath = tile_tmp

for row_idx, deg in enumerate(dir_angles):
    arm.rotation_euler = (0, 0, math.radians(deg))
    for col_idx, f in enumerate(frames):
        scene.frame_set(f)
        bpy.context.view_layer.update()
        bpy.ops.render.render(write_still=True)
        
        tile_img = Image.open(tile_tmp)
        sheet.paste(tile_img, (col_idx * 256, row_idx * 256))

# Reset armature rotation
arm.rotation_euler = (0, 0, 0)

out_web = 'apps/web/public/actions/chibi_adventurer_walk_loop.png'
out_art = 'artifacts/spritesheets/chibi_adventurer_walk_loop.png'
sheet.save(out_web)
sheet.save(out_art)

# Also generate 1024x1024 (128px tile) version
sheet_1024 = sheet.resize((1024, 1024), Image.Resampling.LANCZOS)
sheet_1024.save('apps/web/public/actions/chibi_adventurer_walk_1024.png')
sheet_1024.save('artifacts/spritesheets/chibi_adventurer_walk_1024.png')

print(f"SUCCESS: Rendered chibi_adventurer_walk_loop.png (2048x2048 and 1024x1024)!")
