import bpy

tunic = bpy.data.objects.get('Modular_Adventurer_Tunic')
mw = tunic.matrix_world

# Let's inspect the vertices of the current tunic
print("Tunic total verts:", len(tunic.data.vertices))
print("Tunic total faces:", len(tunic.data.polygons))
