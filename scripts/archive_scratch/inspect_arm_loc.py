import bpy

arm = bpy.data.objects['Armature']
print("Armature location:", arm.location)
print("Armature matrix_world translation:", arm.matrix_world.to_translation())
