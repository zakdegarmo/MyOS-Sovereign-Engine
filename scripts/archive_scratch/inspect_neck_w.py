import bpy

man = bpy.data.objects['Mannequin']
vg = man.vertex_groups.get('neck')
weights = []
for v in man.data.vertices:
    for g in v.groups:
        if g.group == vg.index:
            weights.append(g.weight)
print(f"neck weights count={len(weights)}, max={max(weights) if weights else 0}")
