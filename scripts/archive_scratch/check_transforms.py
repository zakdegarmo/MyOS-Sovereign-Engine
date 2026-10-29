import bpy

man = bpy.data.objects['Mannequin']
arm = bpy.data.objects['Armature']

print('Mannequin parent:', man.parent)
print('Mannequin parent type:', man.parent_type)
print('Mannequin location:', man.location)
print('Mannequin matrix_world:\n', man.matrix_world)
print('Armature matrix_world:\n', arm.matrix_world)
print('Armature location:', arm.location)
