import bpy
import os

files_to_check = [
    r"C:\Users\zakde\Desktop\AntiGravity projects\MyOS\models\uniracer_model.blend",
    r"C:\Users\zakde\Desktop\AntiGravity projects\MyOS\uniracer_model.blend",
    r"C:\Users\zakde\Desktop\AntiGravity projects\MyOS\models\cycnet_uninator.blend"
]

for fp in files_to_check:
    print("="*60)
    print("CHECKING BLEND:", fp)
    if not os.path.exists(fp):
        print("DOES NOT EXIST")
        continue
    bpy.ops.wm.open_mainfile(filepath=fp)
    print("Collections:", [c.name for c in bpy.data.collections])
    for c in bpy.data.collections:
        print(f"  Col '{c.name}': {len(c.objects)} objs -> {[o.name for o in c.objects[:10]]}")
    print("Root Scene Objects (unparented):")
    for obj in bpy.context.scene.objects:
        if obj.parent is None:
            print(f"  Root Obj: {obj.name} (type={obj.type}, loc={obj.location})")
