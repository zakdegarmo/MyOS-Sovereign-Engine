import bpy, bmesh

man = bpy.data.objects['Mannequin']
mw = man.matrix_world

bm = bmesh.new()
bm.from_mesh(man.data)

# Check faces with center Z between 0.60 and 1.00
torso_faces = [f for f in bm.faces if 0.60 <= (mw @ f.calc_center_median()).z <= 1.00 and abs((mw @ f.calc_center_median()).x - 0.007) < 0.20]
print(f'Torso faces count: {len(torso_faces)}')

# Check if these faces form a connected island
face_set = set(torso_faces)
islands = []
visited = set()
for f in face_set:
    if f not in visited:
        island = []
        queue = [f]
        visited.add(f)
        while queue:
            curr = queue.pop(0)
            island.append(curr)
            for e in curr.edges:
                for nxt in e.link_faces:
                    if nxt in face_set and nxt not in visited:
                        visited.add(nxt)
                        queue.append(nxt)
        islands.append(island)

print(f'Found {len(islands)} connected islands among torso faces!')
for idx, isl in enumerate(islands):
    zs = [(mw @ f.calc_center_median()).z for f in isl]
    print(f'  Island {idx}: {len(isl)} faces, Z range: [{min(zs):.3f}, {max(zs):.3f}]')

bm.free()
