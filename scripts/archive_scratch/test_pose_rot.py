import sys
sys.path.append(r'C:\Users\zakde\AppData\Roaming\Python\Python313\site-packages')
import bpy, mathutils, math, os
from PIL import Image

cam = bpy.data.objects['RenderCam']
cam.parent = None
# Camera looking at (0, 0, 0.68)
cam.location = (0.0, -2.60, 0.95)
# Pitch looking down ~12 degrees
cam.rotation_euler = (math.radians(78), 0, 0)
cam.data.type = 'ORTHO'
cam.data.ortho_scale = 1.65

arm = bpy.data.objects['Armature']
arm.parent = None
arm.location = (0, 0, 0)
arm.data.pose_position = 'POSE'
act = bpy.data.actions.get('Walk_Loop')
arm.animation_data.action = act
bpy.context.scene.frame_set(10)
bpy.context.view_layer.update()

scene = bpy.context.scene
scene.render.resolution_x = 256
scene.render.resolution_y = 256

angles = [0, -45, -90, -135, 180, 135, 90, 45]
preview_sheet = Image.new('RGBA', (256 * 8, 256), (0, 0, 0, 0))

for i, ang in enumerate(angles):
    arm.rotation_euler = (0, 0, math.radians(ang))
    bpy.context.view_layer.update()
    tile_path = os.path.abspath(f'temp_tiles/pose_rot_test_{i}.png')
    scene.render.filepath = tile_path
    bpy.ops.render.render(write_still=True)
    
    tile_img = Image.open(tile_path)
    preview_sheet.paste(tile_img, (i * 256, 0))

arm.rotation_euler = (0, 0, 0)
preview_sheet.save('artifacts/verification/pose_rot_8_directions.png')
print("Rendered pose_rot_8_directions.png!")
