import bpy

for o in bpy.data.objects:
    if any(k in o.name.lower() for k in ['head', 'face', 'chibi', 'mannequin']):
        print(f"Obj: {o.name}, type={o.type}")
        if o.type == 'MESH':
            print("  mats:", [m.name if m else None for m in o.data.materials])
