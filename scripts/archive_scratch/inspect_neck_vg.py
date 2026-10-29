import bpy

man = bpy.data.objects['Mannequin']
mw = man.matrix_world

for gname in ['neck', 'Head', 'Spine01', 'LeftShoulder', 'RightShoulder']:
    vg = man.vertex_groups.get(gname)
    if not vg:
        print("No vg:", gname)
        continue
    xs, ys, zs = [], [], []
    for v in man.data.vertices:
        for g in v.groups:
            if g.group == vg.index and g.weight > 0.2:
                wco = mw @ v.co
                xs.append(wco.x)
                ys.append(wco.y)
                zs.append(wco.z)
    if xs:
        print(f"VG {gname}: count={len(xs)} X=[{min(xs):.3f}, {max(xs):.3f}] Y=[{min(ys):.3f}, {max(ys):.3f}] Z=[{min(zs):.3f}, {max(zs):.3f}]")
