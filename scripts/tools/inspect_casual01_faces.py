import bpy, bmesh, os

clothes_dir = r"C:\Users\zakde\AppData\Roaming\Blender Foundation\Blender\5.2\extensions\.user\blender_org\mpfb\data\clothes"
p = os.path.join(clothes_dir, "male_casualsuit01", "male_casualsuit01.obj")
bpy.ops.wm.obj_import(filepath=p)
obj = bpy.context.selected_objects[0]
bm = bmesh.new()
bm.from_mesh(obj.data)

uv_layer = bm.loops.layers.uv.active

# Let's categorize faces by UV location:
# Pants: U in [0.35, 0.70], V in [0.05, 0.98]
# Shirt: U in [0.01, 0.35] or U in [0.70, 0.95]
# Shoes: U in [0.01, 0.30], V in [0.70, 0.95]
shirt_faces = 0
pants_faces = 0
shoes_faces = 0
other_faces = 0

for f in bm.faces:
    uv_c = [l[uv_layer].uv for l in f.loops]
    avg_u = sum(u.x for u in uv_c) / len(uv_c)
    avg_v = sum(u.y for u in uv_c) / len(uv_c)
    if avg_u < 0.30 and avg_v > 0.70:
        shoes_faces += 1
    elif 0.33 < avg_u < 0.72:
        pants_faces += 1
    else:
        shirt_faces += 1

print(f"male_casualsuit01: Total faces={len(bm.faces)}")
print(f"  Shirt faces: {shirt_faces}, Pants faces: {pants_faces}, Shoes faces: {shoes_faces}")

bm.free()
bpy.data.objects.remove(obj, do_unlink=True)
