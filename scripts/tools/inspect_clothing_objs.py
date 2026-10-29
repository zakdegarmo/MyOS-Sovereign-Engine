import bpy, os

clothes_dir = r"C:\Users\zakde\AppData\Roaming\Blender Foundation\Blender\5.2\extensions\.user\blender_org\mpfb\data\clothes"

print("=== INSPECTING SUIT OBJS ===")
for folder, fname in [
    ("toigo_male_suit_tie_and_jacket", "jacket_tie_pants.obj"),
    ("male_casualsuit01", "male_casualsuit01.obj"),
    ("male_elegantsuit01", "male_elegantsuit01.obj"),
    ("cortu_cargo_pants", "cargo_pants.obj"),
    ("toigo_wool_pants", "pants_wool.obj"),
    ("shoes01", "shoes01.obj")
]:
    p = os.path.join(clothes_dir, folder, fname)
    if not os.path.exists(p):
        print(f"Not found: {p}")
        continue
    bpy.ops.wm.obj_import(filepath=p)
    obj = bpy.context.selected_objects[0]
    print(f"\n--- {folder}/{fname} ---")
    print(f"  Verts: {len(obj.data.vertices)}, Polys: {len(obj.data.polygons)}")
    zs = [v.co.z for v in obj.data.vertices]
    ys = [v.co.y for v in obj.data.vertices]
    xs = [v.co.x for v in obj.data.vertices]
    print(f"  X: [{min(xs):.2f}, {max(xs):.2f}], Y: [{min(ys):.2f}, {max(ys):.2f}], Z: [{min(zs):.2f}, {max(zs):.2f}]")
    print(f"  UV layers: {[uv.name for uv in obj.data.uv_layers]}")
    print(f"  Materials: {[m.name for m in obj.data.materials if m]}")
    bpy.data.objects.remove(obj, do_unlink=True)
