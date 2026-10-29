import bpy

man = bpy.data.objects['Mannequin']
arm = bpy.data.objects['Armature']

print('Mannequin parent:', man.parent)
print('Mannequin matrix_world:\n', man.matrix_world)
print('Mannequin matrix_local:\n', man.matrix_local)
print('Mannequin matrix_parent_inverse:\n', man.matrix_parent_inverse)
print('Armature matrix_world:\n', arm.matrix_world)
