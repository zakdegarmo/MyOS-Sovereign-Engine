import bpy

man = bpy.data.objects['Mannequin']
print("Mannequin matrix_world translation:", man.matrix_world.to_translation())

# Center of mass of all visible mannequin vertices
grp = man.vertex_groups['Body_Visible']
mw = man.matrix_world
xs, ys, zs = [], [], []
for v in man.data.vertices:
    w = 0.0
    for g in v.groups:
        if g.group == grp.index: w = g.weight
    if w > 0.5:
        p = mw @ v.co
        xs.append(p.x)
        ys.append(p.y)
        zs.append(p.z)

print(f"Visible Mannequin center: X={sum(xs)/len(xs):.4f}, Y={sum(ys)/len(ys):.4f}, Z={sum(zs)/len(zs):.4f}")
print(f"X bounds: [{min(xs):.3f}, {max(xs):.3f}]")
print(f"Y bounds: [{min(ys):.3f}, {max(ys):.3f}]")
print(f"Z bounds: [{min(zs):.3f}, {max(zs):.3f}]")
