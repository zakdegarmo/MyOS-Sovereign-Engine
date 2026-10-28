import bpy, bmesh

man = bpy.data.objects['Mannequin']
bm = bmesh.new()
bm.from_mesh(man.data)
mw = man.matrix_world
CX = 0.007

visited = set()
islands = []
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

grp_vis = man.vertex_groups['Body_Visible']
# Island 15 and 42
for idx in [14, 41, 15, 42]:
    vert_indices = [v.index for v in islands[idx]]
    grp_vis.add(vert_indices, 0.0, 'REPLACE')

bpy.ops.wm.save_as_mainfile(filepath='mannequin_chibi_basic_rigTest4.blend')
print("Hidden islands 15 and 42!")
