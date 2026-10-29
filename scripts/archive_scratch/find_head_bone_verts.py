import bpy

man = bpy.data.objects['Mannequin']
mw = man.matrix_world
head_grp = man.vertex_groups.get('Head')

head_v = []
for v in man.data.vertices:
    for g in v.groups:
        if g.group == head_grp.index and g.weight > 0.3:
            wco = mw @ v.co
            head_v.append((wco.x, wco.y, wco.z))

head_v.sort(key=lambda p: p[2])
print('Lowest vertices weighted to Head bone:')
for p in head_v[:10]:
    print(f'  X: {p[0]:.3f}, Y: {p[1]:.3f}, Z: {p[2]:.3f}')
