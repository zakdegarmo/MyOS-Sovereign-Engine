import bpy

arm = bpy.data.objects['Armature']
for b in arm.data.bones:
    if any(k in b.name.lower() for k in ['shoulder', 'arm', 'spine', 'neck']):
        print(f'Bone {b.name}: head={b.head}, tail={b.tail}, parent={b.parent.name if b.parent else "None"}')
