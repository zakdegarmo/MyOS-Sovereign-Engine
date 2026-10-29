import bpy, bmesh, os

clothes_dir = r"C:\Users\zakde\AppData\Roaming\Blender Foundation\Blender\5.2\extensions\.user\blender_org\mpfb\data\clothes"
p = os.path.join(clothes_dir, "toigo_male_suit_tie_and_jacket", "jacket_tie_pants.obj")
bpy.ops.wm.obj_import(filepath=p)
obj = bpy.context.selected_objects[0]
bm = bmesh.new()
bm.from_mesh(obj.data)

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

print(f"Total islands: {len(islands)}")
uv_layer = bm.loops.layers.uv.active
for i, isl in enumerate(islands):
    uvs = [l[uv_layer].uv for f in isl for l in f.loops]
    min_u = min(u.x for u in uvs)
    max_u = max(u.x for u in uvs)
    min_v = min(u.y for u in uvs)
    max_v = max(u.y for u in uvs)
    print(f"Island {i}: faces={len(isl)} UV: U=[{min_u:.3f}, {max_u:.3f}], V=[{min_v:.3f}, {max_v:.3f}]")

bm.free()
bpy.data.objects.remove(obj, do_unlink=True)
