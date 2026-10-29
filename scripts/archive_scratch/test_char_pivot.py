import sys
sys.path.append(r'C:\Users\zakde\AppData\Roaming\Python\Python313\site-packages')
import bpy, mathutils, math, os
from PIL import Image

arm = bpy.data.objects['Armature']
cam = bpy.data.objects['RenderCam']
cam.parent = None
cam.location = (0.007, 1.258 - 2.50, 0.95)
cam.rotation_euler = (math.radians(78), 0, 0)
cam.data.type = 'ORTHO'
cam.data.ortho_scale = 1.65

# Create or find CharPivot at exact character center
pivot = bpy.data.objects.get('CharPivot')
if not pivot:
    pivot = bpy.data.objects.new('CharPivot', None)
    pivot.empty_display_type = 'ARROWS'
    bpy.context.scene.collection.objects.link(pivot)

pivot.location = (0.007, 1.258, 0.0)
pivot.rotation_euler = (0, 0, 0)

# Parent Armature to CharPivot
arm.parent = pivot

scene = bpy.context.scene
scene.render.resolution_x = 256
scene.render.resolution_y = 256

# Rotation angles for the 8 directions:
# Row 0: D (facing front / south) -> 0 deg
# Row 1: DL (facing front-left / south-west) -> -45 deg
# Row 2: L (facing left / west) -> -90 deg
# Row 3: UL (facing back-left / north-west) -> -135 deg
# Row 4: U (facing back / north) -> 180 deg
# Row 5: UR (facing back-right / north-east) -> 135 deg
# Row 6: R (facing right / east) -> 90 deg
# Row 7: DR (facing front-right / south-east) -> 45 deg
angles = [0, -45, -90, -135, 180, 135, 90, 45]
preview_sheet = Image.new('RGBA', (256 * 8, 256), (0, 0, 0, 0))

arm.data.pose_position = 'REST'
bpy.context.scene.frame_set(0)

for i, ang in enumerate(angles):
    pivot.rotation_euler = (0, 0, math.radians(ang))
    bpy.context.view_layer.update()
    tile_path = os.path.abspath(f'temp_tiles/char_pivot_test_{i}.png')
    scene.render.filepath = tile_path
    bpy.ops.render.render(write_still=True)
    
    tile_img = Image.open(tile_path)
    preview_sheet.paste(tile_img, (i * 256, 0))

pivot.rotation_euler = (0, 0, 0)
preview_sheet.save('artifacts/verification/char_pivot_8_directions.png')
print("Rendered char_pivot_8_directions.png!")
