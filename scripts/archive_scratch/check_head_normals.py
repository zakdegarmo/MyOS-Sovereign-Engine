import bpy, mathutils

man = bpy.data.objects['Mannequin']
mw = man.matrix_world

head_polys = [p for p in man.data.polygons if (mw @ p.center).z > 1.05]
print(f'Total head polygons: {len(head_polys)}')

outward_dot_sum = 0
head_center = (0.007, 1.25, 1.15)
for p in head_polys:
    c = mw @ p.center
    n = mw.to_3x3() @ p.normal
    rad = mathutils.Vector((c.x - head_center[0], c.y - head_center[1], c.z - head_center[2])).normalized()
    dot = n.normalized().dot(rad)
    outward_dot_sum += dot

avg_dot = outward_dot_sum / len(head_polys)
print(f'Average normal dot with radial vector: {avg_dot:.3f} (positive means pointing outwards, negative means inverted!)')
