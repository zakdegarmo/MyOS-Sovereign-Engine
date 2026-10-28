import bpy

man = bpy.data.objects['Mannequin']
print('Number of materials on Mannequin:', len(man.data.materials))
for i, m in enumerate(man.data.materials):
    print(f'Slot {i}: {m.name if m else "None"}')

poly_mat_indices = set(p.material_index for p in man.data.polygons)
print('Polygon material indices in use:', poly_mat_indices)

print('Color attributes on Mannequin:')
for ca in man.data.color_attributes:
    print(f'  {ca.name}: domain={ca.domain}, data_type={ca.data_type}')
