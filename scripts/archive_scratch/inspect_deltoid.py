import bpy

man = bpy.data.objects['Mannequin']
mw = man.matrix_world

# Find vertices that poke out of the sleeve in nomask_back_rest.png
# In nomask_back_rest.png, the gray spots on the sleeve are at z in [0.85, 0.95], |x| in [0.12, 0.22], y > 1.25 (back)
poking = []
for v in man.data.vertices:
    wco = mw @ v.co
    if 0.85 <= wco.z <= 0.98 and abs(wco.x - 0.007) >= 0.10:
        poking.append((v.index, wco.x, wco.y, wco.z))

print(f"Deltoid / shoulder verts in region: {len(poking)}")
for idx, x, y, z in poking[:10]:
    # Check bone weights
    bw = {man.vertex_groups[g.group].name: round(g.weight, 2) for g in man.data.vertices[idx].groups if g.weight > 0.05}
    print(f"v[{idx}]: x={x:.3f}, y={y:.3f}, z={z:.3f}, weights={bw}")
