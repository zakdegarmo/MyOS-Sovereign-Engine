import bpy

tunic = bpy.data.objects['Modular_Adventurer_Tunic']
for i, m in enumerate(tunic.data.materials):
    print(f'Slot {i}: {m.name}')

indices = set(p.material_index for p in tunic.data.polygons)
print('Material indices used by polygons:', indices)
