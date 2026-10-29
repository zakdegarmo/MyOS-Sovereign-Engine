import sys
sys.path.append(r'C:\Users\zakde\AppData\Roaming\Python\Python313\site-packages')
import bpy, os, math
from PIL import Image

flesh_base = os.path.abspath("flesh_base_mannequin.blend")
bpy.ops.wm.open_mainfile(filepath=flesh_base)

p = os.path.abspath("mannequin_chibi_basic_rigTest2.blend")
with bpy.data.libraries.load(p) as (df, dt):
    dt.objects = ["Modular_Hair_Adventurer"]

hair = bpy.data.objects.get("Modular_Hair_Adventurer")
bpy.context.scene.collection.objects.link(hair)
hair.hide_render = False
hair.hide_viewport = False

min_z = min(v.co.z for v in hair.data.vertices)
mid_y = sum(v.co.y for v in hair.data.vertices) / len(hair.data.vertices)
mid_x = sum(v.co.x for v in hair.data.vertices) / len(hair.data.vertices)
for v in hair.data.vertices:
    v.co.x -= mid_x
    v.co.y -= mid_y
    v.co.z -= min_z

rotations = [
    ("rot_Xpos90", (math.radians(90), 0, 0)),
    ("rot_Xneg90", (math.radians(-90), 0, 0)),
    ("rot_X180", (math.radians(180), 0, 0)),
    ("rot_Xneg90_Z180", (math.radians(-90), 0, math.radians(180))),
    ("rot_Xpos90_Z180", (math.radians(90), 0, math.radians(180))),
    ("rot_Y90", (0, math.radians(90), 0)),
]

hair.location = (0.0, 0.0, 1.04)
hair.scale = (1.5, 1.5, 1.5)

tiles = []
scene = bpy.context.scene
temp_dir = os.path.abspath("artifacts/verification/hair_grid_temp")
os.makedirs(temp_dir, exist_ok=True)

for name, rot in rotations:
    hair.rotation_euler = rot
    bpy.context.view_layer.update()
    out_p = os.path.join(temp_dir, f"{name}.png")
    scene.render.filepath = out_p
    bpy.ops.render.render(write_still=True)
    tiles.append(Image.open(out_p).convert("RGBA").resize((256, 256), Image.Resampling.LANCZOS))

# 3 cols x 2 rows
comp = Image.new("RGBA", (256 * 3, 256 * 2), (24, 26, 34, 255))
for idx, tile in enumerate(tiles):
    gx = idx % 3
    gy = idx // 3
    comp.paste(tile, (gx * 256, gy * 256), tile)

grid_path = os.path.abspath("artifacts/verification/hair_rotations_grid.png")
comp.save(grid_path)
print(f"Saved hair rotations grid -> {grid_path}")
