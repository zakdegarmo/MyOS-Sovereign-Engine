import bpy

man = bpy.data.objects['Mannequin']
mw = man.matrix_world

pts = []
for v in man.data.vertices:
    wco = mw @ v.co
    if 0.85 <= wco.z <= 1.05:
        pts.append((wco.x, wco.y, wco.z))

print(f'Total vertices in Z [0.85, 1.05]: {len(pts)}')
xs = [p[0] for p in pts]
ys = [p[1] for p in pts]
zs = [p[2] for p in pts]
print(f'X range: [{min(xs):.3f}, {max(xs):.3f}]')
print(f'Y range: [{min(ys):.3f}, {max(ys):.3f}]')
print(f'Z range: [{min(zs):.3f}, {max(zs):.3f}]')

neck_pts = [p for p in pts if abs(p[0] - 0.007) < 0.06]
print('Neck area points (X ~ 0.007):')
for p in sorted(neck_pts, key=lambda x: x[2], reverse=True)[:10]:
    print(f'X: {p[0]:.3f}, Y: {p[1]:.3f}, Z: {p[2]:.3f}')
