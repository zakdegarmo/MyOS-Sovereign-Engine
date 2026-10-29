
import sys
sys.path.append(r'C:\Users\zakde\AppData\Roaming\Python\Python313\site-packages')
import bpy, os, math
from PIL import Image

blend_path = os.path.abspath('flesh_female_mannequin.blend')
bpy.ops.wm.open_mainfile(filepath=blend_path)

with open('scripts/test_conformal_wardrobe.py') as f:
    exec(f.read())

arm = bpy.data.objects['Armature']
walk_act = bpy.data.actions.get('Walk_Loop')
arm.animation_data.action = walk_act

scene = bpy.context.scene
scene.frame_set(16)

# Center camera pivot directly on character's walk center
center_y = -1.20
center_z = 0.60

cam_rot = bpy.data.objects['Cam_Rot_Empty']
cam_rot.location = (0.0, center_y, center_z)

cam_target = bpy.data.objects.get('CamTarget')
if cam_target:
    cam_target.location = (0.0, center_y, center_z)

# Set camera local distance to 2.4m for perfect framing
cam = bpy.data.objects['RenderCam']
cam.location = (0.0, -2.4, 0.25)

angles_deg = [0, 45, 90, 135, 180, 225, 270, 315]
dir_names = ['S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE']
tiles = []
temp_dir = os.path.abspath('artifacts/verification/temp_8way_centered')
os.makedirs(temp_dir, exist_ok=True)

for i, deg in enumerate(angles_deg):
    cam_rot.rotation_euler[2] = math.radians(deg)
    bpy.context.view_layer.update()
    p = os.path.join(temp_dir, f'angle_{dir_names[i]}.png')
    scene.render.filepath = p
    bpy.ops.render.render(write_still=True)
    im = Image.open(p).convert('RGBA').resize((128, 128), Image.Resampling.LANCZOS)
    tiles.append(im)

strip = Image.new('RGBA', (128 * 8, 128), (24, 26, 34, 255))
for i, t in enumerate(tiles):
    strip.paste(t, (i * 128, 0), t)

strip_path = os.path.abspath('artifacts/verification/flesh_female_8way_centered_strip.png')
strip.save(strip_path)
print('Saved centered 8-way angles strip ->', strip_path)
