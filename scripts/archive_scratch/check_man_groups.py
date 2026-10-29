import bpy

man = bpy.data.objects['Mannequin']
print('Mannequin vertex groups:')
for g in man.vertex_groups:
    print(f'  {g.index}: {g.name}')
