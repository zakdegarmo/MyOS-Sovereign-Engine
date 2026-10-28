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

visible_islands = []
hidden_islands = []

for idx, island in enumerate(islands):
    zs = [(mw @ v.co).z for v in island]
    xs = [(mw @ v.co).x for v in island]
    ys = [(mw @ v.co).y for v in island]
    z_min, z_max = min(zs), max(zs)
    x_min, x_max = min(xs), max(xs)
    dx_max = max(abs(x - CX) for x in xs)
    
    # Check if this island is:
    # 1. Head or Neck:
    is_head_neck = (z_max >= 0.88 and dx_max <= 0.16)
    
    # 2. Forearm or Hand / Fingers:
    # Forearms start around |x| > 0.30, hands are further out
    is_forearm_hand = (dx_max > 0.32 and z_min >= 0.85)
    
    # 3. Lower Leg (Shin / Calf):
    # Shin is z in [0.08, 0.38]
    # Feet are z < 0.08
    is_shin_calf = (z_min >= 0.07 and z_max <= 0.42 and 0.02 < dx_max < 0.16)
    
    if is_head_neck or is_forearm_hand or is_shin_calf:
        visible_islands.append((idx, len(island), z_min, z_max, dx_max))
        vert_indices = [v.index for v in island]
        grp_vis.add(vert_indices, 1.0, 'REPLACE')
    else:
        hidden_islands.append((idx, len(island), z_min, z_max, dx_max))

print(f"Visible islands: {len(visible_islands)}")
for item in visible_islands:
    print("  VIS:", item)

print(f"\nHidden islands: {len(hidden_islands)}")
for item in hidden_islands[:10]:
    print("  HID:", item)

bpy.ops.wm.save_as_mainfile(filepath='mannequin_chibi_basic_rigTest4.blend')
print("Saved blend file with island-perfect mask!")
