import bpy

man = bpy.data.objects['Mannequin']
mw = man.matrix_world

# In REST pose
bpy.context.scene.frame_set(0)
bpy.context.view_layer.update()

# Vertices near center (X ~ 0.007, Y front of face Y < 1.20)
chin_candidates = []
for v in man.data.vertices:
    wco = mw @ v.co
    if abs(wco.x - 0.007) < 0.04 and wco.y < 1.22:
        chin_candidates.append((wco.x, wco.y, wco.z))

chin_candidates.sort(key=lambda p: p[2])
print('Lowest front head/neck vertices (Z ascending):')
for p in chin_candidates[:12]:
    print(f'  X: {p[0]:.3f}, Y: {p[1]:.3f}, Z: {p[2]:.3f}')
