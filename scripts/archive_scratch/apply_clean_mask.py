import bpy, bmesh, os, math

man = bpy.data.objects['Mannequin']
mw = man.matrix_world
CX = 0.007

bm = bmesh.new()
bm.from_mesh(man.data)

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

# Clear all to 0
for v in man.data.vertices:
    grp_vis.add([v.index], 0.0, 'REPLACE')

for idx, island in enumerate(islands):
    zs = [(mw @ v.co).z for v in island]
    xs = [(mw @ v.co).x for v in island]
    z_min, z_max = min(zs), max(zs)
    dx_max = max(abs(x - CX) for x in xs)
    
    # 1. Head & Neck:
    is_head_neck = (z_max >= 0.88 and dx_max <= 0.16 and idx not in [14, 41])
    
    # 2. Forearms & Hands:
    # Specifically exclude 15 and 42 (biceps)
    is_forearm_hand = (dx_max > 0.32 and z_min >= 0.85 and idx not in [15, 42, 14, 41])
    
    # 3. Lower Leg (Shin / Calf):
    is_shin_calf = (z_min >= 0.07 and z_max <= 0.42 and 0.02 < dx_max < 0.16 and idx not in [5, 40])
    
    if is_head_neck or is_forearm_hand or is_shin_calf:
        vert_indices = [v.index for v in island]
        grp_vis.add(vert_indices, 1.0, 'REPLACE')

bpy.ops.wm.save_as_mainfile(filepath='mannequin_chibi_basic_rigTest4.blend')
print("Updated mask with 15 & 42 hidden!")
