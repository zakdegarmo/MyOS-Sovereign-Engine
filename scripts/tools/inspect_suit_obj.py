import bpy, os

clothes_dir = r"C:\Users\zakde\AppData\Roaming\Blender Foundation\Blender\5.2\extensions\.user\blender_org\mpfb\data\clothes"
hair_dir = r"C:\Users\zakde\AppData\Roaming\Blender Foundation\Blender\5.2\extensions\.user\blender_org\mpfb\data\hair"

suit_obj_path = os.path.join(clothes_dir, "toigo_male_suit_tie_and_jacket", "jacket_tie_pants.obj")
bpy.ops.wm.obj_import(filepath=suit_obj_path)
suit = bpy.context.selected_objects[0]
print(f"Suit {suit.name}:")
print(f"  Materials: {[m.name for m in suit.data.materials if m]}")
zs = [v.co.z for v in suit.data.vertices]
ys = [v.co.y for v in suit.data.vertices]
xs = [v.co.x for v in suit.data.vertices]
print(f"  Bounds: X=[{min(xs):.3f}, {max(xs):.3f}], Y=[{min(ys):.3f}, {max(ys):.3f}], Z=[{min(zs):.3f}, {max(zs):.3f}]")

hair_path = os.path.join(hair_dir, "short02", "short02.obj")
bpy.ops.wm.obj_import(filepath=hair_path)
hair = bpy.context.selected_objects[0]
print(f"\nHair {hair.name}:")
print(f"  Materials: {[m.name for m in hair.data.materials if m]}")
zs = [v.co.z for v in hair.data.vertices]
ys = [v.co.y for v in hair.data.vertices]
xs = [v.co.x for v in hair.data.vertices]
print(f"  Bounds: X=[{min(xs):.3f}, {max(xs):.3f}], Y=[{min(ys):.3f}, {max(ys):.3f}], Z=[{min(zs):.3f}, {max(zs):.3f}]")

short01_path = os.path.join(hair_dir, "short01", "short01.obj")
bpy.ops.wm.obj_import(filepath=short01_path)
hair01 = bpy.context.selected_objects[0]
print(f"\nHair01 {hair01.name}:")
zs = [v.co.z for v in hair01.data.vertices]
ys = [v.co.y for v in hair01.data.vertices]
xs = [v.co.x for v in hair01.data.vertices]
print(f"  Bounds: X=[{min(xs):.3f}, {max(xs):.3f}], Y=[{min(ys):.3f}, {max(ys):.3f}], Z=[{min(zs):.3f}, {max(zs):.3f}]")
