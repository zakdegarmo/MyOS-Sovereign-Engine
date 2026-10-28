import bpy

tunic = bpy.data.objects['Modular_Adventurer_Tunic']
print('Tunic vertex groups:')
for g in tunic.vertex_groups:
    print(f'  {g.index}: {g.name}')

# Check which vertices have 0 weight across all groups
unweighted = []
for v in tunic.data.vertices:
    total_w = sum(g.weight for g in v.groups)
    if total_w < 0.01:
        unweighted.append(v.index)
print(f'Unweighted vertices in tunic: {len(unweighted)}: {unweighted[:10]}')
