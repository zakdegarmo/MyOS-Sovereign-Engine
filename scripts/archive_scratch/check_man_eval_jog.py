import bpy

man = bpy.data.objects['Mannequin']
arm = bpy.data.objects['Armature']

bpy.context.scene.frame_set(0)
bpy.context.view_layer.update()

deps = bpy.context.evaluated_depsgraph_get()
me = man.evaluated_get(deps).to_mesh()

ys = [(man.matrix_world @ v.co).y for v in me.vertices]
xs = [(man.matrix_world @ v.co).x for v in me.vertices]
zs = [(man.matrix_world @ v.co).z for v in me.vertices]

print('Mannequin evaluated bounds in Frame 0 of Jog_Fwd_Loop:')
print(f'  X: [{min(xs):.3f}, {max(xs):.3f}]')
print(f'  Y: [{min(ys):.3f}, {max(ys):.3f}]')
print(f'  Z: [{min(zs):.3f}, {max(zs):.3f}]')

man.evaluated_get(deps).to_mesh_clear()
