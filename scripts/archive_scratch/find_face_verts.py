import bpy

man = bpy.data.objects['Mannequin']
uv_layer = man.data.uv_layers.active.data
mw = man.matrix_world

# Face decal is in UV space (often around [0, 1] or mapped to head)
# Let's find vertices of polygons that have UVs mapped to the eye region or front of face
print('Front-most head vertices (smallest Y at Z between 1.05 and 1.20):')
front_verts = []
for v in man.data.vertices:
    wco = mw @ v.co
    if 1.00 <= wco.z <= 1.25 and wco.y < 1.20:
        front_verts.append((wco.x, wco.y, wco.z))

front_verts.sort(key=lambda p: p[1])
for p in front_verts[:15]:
    print(f'X: {p[0]:.3f}, Y: {p[1]:.3f}, Z: {p[2]:.3f}')
