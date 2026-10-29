import bpy

man = bpy.data.objects['Mannequin']
arm = bpy.data.objects['Armature']

arm.data.pose_position = 'REST'
bpy.context.view_layer.update()

# Evaluated mesh in REST pose
depsgraph = bpy.context.evaluated_depsgraph_get()
man_eval = man.evaluated_get(depsgraph)
mesh_eval = man_eval.to_mesh()

print('Evaluated Mannequin in REST pose:')
zs = [(man.matrix_world @ v.co).z for v in mesh_eval.vertices]
ys = [(man.matrix_world @ v.co).y for v in mesh_eval.vertices]
xs = [(man.matrix_world @ v.co).x for v in mesh_eval.vertices]
print(f'Evaluated X: [{min(xs):.3f}, {max(xs):.3f}], Y: [{min(ys):.3f}, {max(ys):.3f}], Z: [{min(zs):.3f}, {max(zs):.3f}]')

head_eval_zs = [(man.matrix_world @ v.co).z for v in mesh_eval.vertices if (man.matrix_world @ v.co).z > 0.95]
print(f'Evaluated Head/Neck Z range: [{min(head_eval_zs):.3f}, {max(head_eval_zs):.3f}]')
head_eval_ys = [(man.matrix_world @ v.co).y for v in mesh_eval.vertices if (man.matrix_world @ v.co).z > 1.05]
print(f'Evaluated Head Y range: [{min(head_eval_ys):.3f}, {max(head_eval_ys):.3f}]')
head_eval_xs = [(man.matrix_world @ v.co).x for v in mesh_eval.vertices if (man.matrix_world @ v.co).z > 1.05]
print(f'Evaluated Head X range: [{min(head_eval_xs):.3f}, {max(head_eval_xs):.3f}]')

man_eval.to_mesh_clear()
