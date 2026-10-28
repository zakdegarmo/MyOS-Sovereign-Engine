import bpy

man = bpy.data.objects['Mannequin']
print("Mannequin materials:")
for i, m in enumerate(man.data.materials):
    print(f"[{i}] {m.name if m else 'None'}")

# Check polygon material slot assignment
mat_counts = {}
for p in man.data.polygons:
    mat_counts[p.material_index] = mat_counts.get(p.material_index, 0) + 1
print("Polygon material slot usage:", mat_counts)
