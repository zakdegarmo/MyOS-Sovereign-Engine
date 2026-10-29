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
    if abs(wco.x - 0.007) < 0.03 and wco.y < 1.22 and 0.90 <= wco.z <= 1.10:
        pts.append((wco.x, wco.y, wco.z))

pts.sort(key=lambda p: p[2])
print('Evaluated Mannequin vertices between Z 0.90 and 1.10:')
for p in pts:
    print(f'  X: {p[0]:.3f}, Y: {p[1]:.3f}, Z: {p[2]:.3f}')

man.evaluated_get(deps).to_mesh_clear()
