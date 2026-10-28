import sys
sys.path.append(r'C:\Users\zakde\AppData\Roaming\Python\Python313\site-packages')
import bpy, os
from PIL import Image

OUT_FEMALE_BLEND = os.path.abspath('flesh_female_mannequin.blend')
bpy.ops.wm.open_mainfile(filepath=OUT_FEMALE_BLEND)

arm = bpy.data.objects['Armature']
walk_act = bpy.data.actions.get('Walk_Loop')
arm.animation_data.action = walk_act

scene = bpy.context.scene
frames = [0, 10, 20, 30]
rendered_tiles = []

temp_dir = os.path.abspath('artifacts/verification/fem_walk_test')
os.makedirs(temp_dir, exist_ok=True)

for i, f in enumerate(frames):
    scene.frame_set(f)
    bpy.context.view_layer.update()
    p = os.path.join(temp_dir, f'f_{f}.png')
    scene.render.filepath = p
    bpy.ops.render.render(write_still=True)
    rendered_tiles.append(Image.open(p).convert('RGBA').resize((128, 128), Image.Resampling.LANCZOS))

strip = Image.new('RGBA', (512, 128), (24, 26, 34, 255))
for idx, tile in enumerate(rendered_tiles):
    strip.paste(tile, (idx * 128, 0), tile)

strip_path = os.path.abspath('artifacts/verification/flesh_female_walk_strip.png')
strip.save(strip_path)
print(f'Saved female walk strip -> {strip_path}')
