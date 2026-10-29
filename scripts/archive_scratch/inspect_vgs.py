import bpy

man = bpy.data.objects['Mannequin']
print("Mannequin VGs:", [g.name for g in man.vertex_groups])
