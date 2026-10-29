import bpy

man = bpy.data.objects['Mannequin']
arm = bpy.data.objects['Armature']

arm.data.pose_position = 'REST'
bpy.context.scene.frame_set(0)
bpy.context.view_layer.update()

deps = bpy.context.evaluated_depsgraph_get()
me = man.evaluated_get(deps).to_mesh()

pts = []
for v in me.vertices:
    wco = man.matrix_world @ v.co
    # front center
    if abs(wco.x - 0.007) < 0.03 and wco.y < 1.20 and wco.z > 0.80:
        pts.append((wco.x, wco.y, wco.z))

pts.sort(key=lambda p: p[2])
print('Evaluated Mannequin front center vertices (Z > 0.80, Z ascending):')
for p in pts[:15]:
    print(f'  X: {p[0]:.3f}, Y: {p[1]:.3f}, Z: {p[2]:.3f}')

man.evaluated_get(deps).to_mesh_clear()
