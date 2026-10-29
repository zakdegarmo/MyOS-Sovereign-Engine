import bpy

man = bpy.data.objects['Mannequin']
mw = man.matrix_world

print("Vertices at neck center (abs(x - 0.007) < 0.06, z in [0.85, 1.05]):")
for v in man.data.vertices:
    wco = mw @ v.co
    if 0.85 <= wco.z <= 1.05 and abs(wco.x - 0.007) < 0.06:
        bw = {man.vertex_groups[g.group].name: round(g.weight, 2) for g in v.groups if g.weight > 0.05}
        if wco.y > 1.30: # Back of neck
            print(f"BACK v[{v.index}]: z={wco.z:.3f}, y={wco.y:.3f}, weights={bw}")
