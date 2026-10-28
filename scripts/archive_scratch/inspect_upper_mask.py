import bpy

man = bpy.data.objects['Mannequin']
mw = man.matrix_world
grp_vis = man.vertex_groups['Body_Visible']

vis_upper = []
for v in man.data.vertices:
    wco = mw @ v.co
    if 0.70 <= wco.z <= 1.05:
        # Check weight in Body_Visible
        w = 0.0
        for g in v.groups:
            if g.group == grp_vis.index:
                w = g.weight
        vis_upper.append((wco.x, wco.y, wco.z, w))

print(f"Mannequin verts in Z [0.70, 1.05]: {len(vis_upper)}")
print(f"Visible (w > 0.5): {sum(1 for p in vis_upper if p[3] > 0.5)}")
print(f"Hidden (w <= 0.5): {sum(1 for p in vis_upper if p[3] <= 0.5)}")

# Print some of the visible ones:
print("\nSample visible upper verts:")
for p in [p for p in vis_upper if p[3] > 0.5][:10]:
    print(f"x={p[0]:.3f}, y={p[1]:.3f}, z={p[2]:.3f}")

print("\nSample hidden upper verts (near neck):")
for p in [p for p in vis_upper if p[3] <= 0.5 and p[2] > 0.85][:10]:
    print(f"x={p[0]:.3f}, y={p[1]:.3f}, z={p[2]:.3f}")
