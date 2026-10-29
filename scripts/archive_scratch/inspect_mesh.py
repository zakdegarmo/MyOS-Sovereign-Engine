import bpy

man = bpy.data.objects['Mannequin']
tunic = bpy.data.objects.get('Modular_Adventurer_Tunic')
pants = bpy.data.objects.get('Modular_Adventurer_Pants')
boots = bpy.data.objects.get('Modular_Adventurer_Boots')

print("=== Mannequin Modifiers ===")
for m in man.modifiers:
    print(m.name, m.type, getattr(m, 'vertex_group', None), getattr(m, 'invert_vertex_group', None), m.show_viewport, m.show_render)

print("\n=== Tunic Modifiers ===")
if tunic:
    for m in tunic.modifiers:
        print(m.name, m.type, m.show_viewport, m.show_render)

print("\n=== Boots ===")
if boots:
    print("Boots verts:", len(boots.data.vertices))
    for m in boots.modifiers:
        print(m.name, m.type, m.show_viewport, m.show_render)

print("\n=== Armature Bones around Neck / Spine ===")
arm = bpy.data.objects['Armature']
for b in arm.data.bones:
    if any(k in b.name.lower() for k in ['neck', 'head', 'spine', 'shoulder', 'chest']):
        print(b.name, b.head, b.tail)
