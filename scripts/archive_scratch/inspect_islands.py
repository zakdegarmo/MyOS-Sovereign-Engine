import bpy, bmesh

man = bpy.data.objects['Mannequin']
bm = bmesh.new()
bm.from_mesh(man.data)

# Find connected components (islands)
visited = set()
islands = []
mw = man.matrix_world

for v in bm.verts:
    if v in visited: continue
    island = []
    queue = [v]
    visited.add(v)
    while queue:
        curr = queue.pop()
        island.append(curr)
        for e in curr.link_edges:
            other = e.other_vert(curr)
            if other not in visited:
                visited.add(other)
                queue.append(other)
    islands.append(island)

print(f"Total separate mesh islands in Mannequin: {len(islands)}")
for idx, island in enumerate(islands):
    zs = [(mw @ v.co).z for v in island]
    xs = [(mw @ v.co).x for v in island]
    ys = [(mw @ v.co).y for v in island]
    print(f"Island {idx}: {len(island)} verts, Z=[{min(zs):.2f}, {max(zs):.2f}], X=[{min(xs):.2f}, {max(xs):.2f}], Y=[{min(ys):.2f}, {max(ys):.2f}]")
