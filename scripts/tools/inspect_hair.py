import bpy, os, math

hair_dir = r"C:\Users\zakde\AppData\Roaming\Blender Foundation\Blender\5.2\extensions\.user\blender_org\mpfb\data\hair"
for h in ["short01", "short02", "short03", "short04"]:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    f = os.path.join(hair_dir, h, h + ".obj")
    bpy.ops.wm.obj_import(filepath=f)
    obj = bpy.context.selected_objects[0]
    # Rotate 90 deg around X like we did
    obj.rotation_euler[0] = math.radians(90)
    bpy.ops.object.transform_apply(rotation=True)
    
    xs = [v.co.x for v in obj.data.vertices]
    ys = [v.co.y for v in obj.data.vertices]
    zs = [v.co.z for v in obj.data.vertices]
    print(f"Hair {h}: {len(obj.data.vertices)} verts")
    print(f"  X: [{min(xs):.4f}, {max(xs):.4f}] span={max(xs)-min(xs):.4f}")
    print(f"  Y: [{min(ys):.4f}, {max(ys):.4f}] span={max(ys)-min(ys):.4f}")
    print(f"  Z: [{min(zs):.4f}, {max(zs):.4f}] span={max(zs)-min(zs):.4f}")
