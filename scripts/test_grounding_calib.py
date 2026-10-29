
import sys
sys.path.append(r'C:\Users\zakde\AppData\Roaming\Python\Python313\site-packages')
import bpy, os
from PIL import Image

blend_path = os.path.abspath('flesh_female_mannequin.blend')
bpy.ops.wm.open_mainfile(filepath=blend_path)

arm = bpy.data.objects['Armature']
walk_act = bpy.data.actions.get('Walk_Loop')
arm.animation_data.action = walk_act

scene = bpy.context.scene
scene.render.resolution_x = 512
scene.render.resolution_y = 512
scene.render.film_transparent = True
scene.frame_set(0)

# Calibrated ground center
center_y = -1.20
center_z = 0.70

cam_rot = bpy.data.objects['Cam_Rot_Empty']
cam_rot.location = (0.0, center_y, center_z)
cam_rot.rotation_euler[2] = 0.0 # South

cam_target = bpy.data.objects.get('CamTarget')
if cam_target:
    cam_target.location = (0.0, center_y, center_z)

cam = bpy.data.objects['RenderCam']
cam.location = (0.0, -2.40, 0.25)

out_test = os.path.abspath('artifacts/verification/test_grounded_foot.png')
scene.render.filepath = out_test
bpy.ops.render.render(write_still=True)

# Downsample to 128x128 and inspect lowest opaque pixel
im = Image.open(out_test).convert('RGBA').resize((128, 128), Image.Resampling.LANCZOS)
im.save(out_test)

# Find lowest non-transparent pixel Y
alpha = im.split()[-1]
lowest_y = 0
for y in range(128):
    for x in range(128):
        if alpha.getpixel((x, y)) > 20:
            if y > lowest_y: lowest_y = y

print(f'Lowest opaque pixel Y = {lowest_y} (out of 127)! Grounded threshold >= 118: {lowest_y >= 118}')
