import sys
sys.path.append(r'C:\Users\zakde\AppData\Roaming\Python\Python313\site-packages')
import bpy, mathutils, math, os
from PIL import Image

os.makedirs('temp_tiles', exist_ok=True)
os.makedirs('artifacts/verification', exist_ok=True)

# Find or create CamPivot empty
pivot = bpy.data.objects.get('CamPivot')
if not pivot:
    pivot = bpy.data.objects.new('CamPivot', None)
    pivot.empty_display_type = 'ARROWS'
    bpy.context.scene.collection.objects.link(pivot)

pivot.location = (0.007, 1.258, 0.65)
pivot.rotation_euler = (0, 0, 0)

cam = bpy.data.objects['RenderCam']
cam.parent = pivot
cam.location = (0, -3.8, 0.9)
# Camera pointing at center:
# Pitch down ~13 degrees
cam.rotation_euler = (math.radians(77), 0, 0)
cam.data.type = 'ORTHO'
cam.data.ortho_scale = 1.65

scene = bpy.context.scene
scene.render.film_transparent = True
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'
scene.render.resolution_x = 256
scene.render.resolution_y = 256

arm = bpy.data.objects['Armature']
arm.data.pose_position = 'REST'
bpy.context.scene.frame_set(0)
bpy.context.view_layer.update()

# For camera orbiting the character:
# When CamPivot rotates by angle A:
# At A = 0: camera is at -Y (front of character) -> D (Row 0)
# To view character from front-left (DL, Row 1): camera needs to orbit to front-left (-X, -Y)
# Which direction is -X from -Y? Counter-clockwise is +X (positive Z rotation)!
# So clock-wise rotation (-Z rotation) moves camera to -X (-Y)!
# Let's verify angles for the 8 rows:
# Row 0: D -> 0 deg
# Row 1: DL -> -45 deg
# Row 2: L -> -90 deg
# Row 3: UL -> -135 deg
# Row 4: U -> 180 deg
# Row 5: UR -> 135 deg
# Row 6: R -> 90 deg
# Row 7: DR -> 45 deg

angles = [0, -45, -90, -135, 180, 135, 90, 45]
preview_sheet = Image.new('RGBA', (256 * 8, 256), (0, 0, 0, 0))

for i, ang in enumerate(angles):
    pivot.rotation_euler = (0, 0, math.radians(ang))
    bpy.context.view_layer.update()
    tile_path = os.path.abspath(f'temp_tiles/orbit_test_{i}.png')
    scene.render.filepath = tile_path
    bpy.ops.render.render(write_still=True)
    
    tile_img = Image.open(tile_path)
    preview_sheet.paste(tile_img, (i * 256, 0))

preview_sheet.save('artifacts/verification/orbit_8_directions.png')
print("Rendered orbit_8_directions.png!")
