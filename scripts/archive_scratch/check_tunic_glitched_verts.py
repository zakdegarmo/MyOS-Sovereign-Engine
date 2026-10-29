import bpy

tunic = bpy.data.objects['Modular_Adventurer_Tunic']
print('Vertices with local Y < 0.5 or world Y < 0.5:')
for v in tunic.data.vertices:
    if v.co.y < 0.5:
        # print vertex coordinates and bone weights
        groups = {tunic.vertex_groups[g.group].name: round(g.weight, 3) for g in v.groups}
        print(f'Vert {v.index}: co=({v.co.x:.3f}, {v.co.y:.3f}, {v.co.z:.3f}), groups={groups}')
