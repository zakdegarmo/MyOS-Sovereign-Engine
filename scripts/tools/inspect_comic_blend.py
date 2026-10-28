import bpy

print("=== SCENE OBJECTS ===")
for obj in bpy.data.objects:
    mats = [m.name for m in obj.data.materials if m] if obj.data and hasattr(obj.data, "materials") else []
    print(f"Obj: {obj.name} | Type: {obj.type} | Render: {not obj.hide_render} | Parent: {obj.parent.name if obj.parent else None} | Mats: {mats}")

print("\n=== MATERIALS ===")
for mat in bpy.data.materials:
    print(f"Mat: {mat.name}")

print("\n=== ARMATURE ACTIONS ===")
for act in bpy.data.actions:
    print(f"Act: {act.name}")

mesh_objs = [o for o in bpy.data.objects if o.type == 'MESH']
for o in mesh_objs:
    print(f"\n--- Mesh Object: {o.name} ---")
    print(f"  Vertices: {len(o.data.vertices)}, Polygons: {len(o.data.polygons)}")
    print(f"  Vertex Groups: {[vg.name for vg in o.vertex_groups]}")
    print(f"  Modifiers: {[m.name + ' (' + m.type + ')' for m in o.modifiers]}")
    bb = [list(corner) for corner in o.bound_box]
    min_z = min(c[2] for c in bb)
    max_z = max(c[2] for c in bb)
    min_y = min(c[1] for c in bb)
    max_y = max(c[1] for c in bb)
    min_x = min(c[0] for c in bb)
    max_x = max(c[0] for c in bb)
    print(f"  Bounding Box: X=[{min_x:.3f}, {max_x:.3f}], Y=[{min_y:.3f}, {max_y:.3f}], Z=[{min_z:.3f}, {max_z:.3f}]")
