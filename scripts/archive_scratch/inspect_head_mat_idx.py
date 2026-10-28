import bpy

man = bpy.data.objects['Mannequin']
print("Mannequin vertex color layers (color_attributes):", [a.name for a in man.data.color_attributes])

# Check material index of head polygons (z > 1.05)
mw = man.matrix_world
head_mat_indices = set()
for p in man.data.polygons:
    p_z = sum((mw @ man.data.vertices[v].co).z for v in p.vertices) / len(p.vertices)
    if p_z > 1.05:
        head_mat_indices.add(p.material_index)

print("Material indices for head polygons:", head_mat_indices)
