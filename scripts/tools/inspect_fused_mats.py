import bpy

obj = bpy.data.objects.get('LPC_Decivoxel_Flesh_Fused')
print(f"Object {obj.name} materials:")
for i, slot in enumerate(obj.material_slots):
    print(f"  Slot {i}: {slot.material.name if slot.material else 'None'}")

mat_idx_counts = {}
for p in obj.data.polygons:
    mat_idx_counts[p.material_index] = mat_idx_counts.get(p.material_index, 0) + 1
print(f"Polygon material indices count: {mat_idx_counts}")
