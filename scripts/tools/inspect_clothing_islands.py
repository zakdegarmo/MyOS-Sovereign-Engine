import bpy, bmesh, os

clothes_dir = r"C:\Users\zakde\AppData\Roaming\Blender Foundation\Blender\5.2\extensions\.user\blender_org\mpfb\data\clothes"

for name, fname in [("suit", "toigo_male_suit_tie_and_jacket/jacket_tie_pants.obj"), ("casual", "male_casualsuit01/male_casualsuit01.obj")]:
    bpy.ops.wm.obj_import(filepath=os.path.join(clothes_dir, fname))
    obj = bpy.context.selected_objects[0]
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    
    # Check connected components (islands)
    islands = []
    unvisited = set(bm.faces)
    while unvisited:
        f = unvisited.pop()
        island = [f]
        queue = [f]
        while queue:
            curr = queue.pop(0)
            for e in curr.edges:
                for lf in e.link_faces:
                    if lf in unvisited:
                        unvisited.remove(lf)
                        island.append(lf)
                        queue.append(lf)
        islands.append(island)
    print(f"\n--- {name} has {len(islands)} mesh islands ---")
    for i, isl in enumerate(islands):
        zs = [v.co.z for f in isl for v in f.verts]
        ys = [v.co.y for f in isl for v in f.verts]
        xs = [v.co.x for f in isl for v in f.verts]
        print(f"  Island {i}: {len(isl)} faces | X=[{min(xs):.2f}, {max(xs):.2f}] Y=[{min(ys):.2f}, {max(ys):.2f}] Z=[{min(zs):.2f}, {max(zs):.2f}]")
    bm.free()
    bpy.data.objects.remove(obj, do_unlink=True)
