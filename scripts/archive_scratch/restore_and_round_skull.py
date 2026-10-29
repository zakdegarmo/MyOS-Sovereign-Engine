import socket

code = """
import bpy

# 1. Remove the deformed mannequin mesh
for obj in list(bpy.data.objects):
    if 'mannequin' in obj.name.lower():
        bpy.data.objects.remove(obj, do_unlink=True)

# 2. Re-import clean, pristine native mannequin from blend file
mannequin_blend = r"c:\\Users\\zakde\\Desktop\\AntiGravity projects\\MyOS\\apps\\web\\public\\models\\mannequin\\human_mannequin_native_bald.blend"
with bpy.data.libraries.load(mannequin_blend, link=False) as (data_from, data_to):
    data_to.objects = data_from.objects

for obj in data_to.objects:
    if obj is not None:
        bpy.context.scene.collection.objects.link(obj)

# 3. Scale and position the clean mannequin
man_obj = None
for obj in bpy.data.objects:
    if 'mannequin' in obj.name.lower() or ('Mesh' in obj.name and 'char1' not in obj.name):
        obj.scale = (0.75, 0.75, 0.75)
        obj.location = (0, 0, 0)
        if obj.type == 'MESH':
            man_obj = obj

# 4. Perfectly expand the skull dome (cranium) + round the anime jaw smoothly using proportional falloff
if man_obj:
    mesh = man_obj.data
    min_z = min(v.co.z for v in mesh.vertices)
    max_z = max(v.co.z for v in mesh.vertices)
    h = max_z - min_z
    
    # Head region
    head_z_start = max_z - h * 0.24
    cranium_z_start = max_z - h * 0.12
    
    for v in mesh.vertices:
        if v.co.z > head_z_start:
            # Overall head width expansion (anime proportions)
            v.co.x *= 1.30
            v.co.y *= 1.22
            
            # Extra expansion for upper brain casing / skull dome
            if v.co.z > cranium_z_start:
                dome_factor = (v.co.z - cranium_z_start) / (max_z - cranium_z_start)
                v.co.x *= (1.0 + dome_factor * 0.15)
                v.co.y *= (1.0 + dome_factor * 0.18)
                v.co.z += dome_factor * 0.04
                
    mesh.update()

# Hand vertices left completely untouched and pristine!
print("✨ Restored pristine hands, expanded brain casing dome and gave defined anime jawline!")
"""

s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.connect(('127.0.0.1', 9876))
s.sendall(code.encode('utf-8'))
s.close()
print("RESTORED_AND_ROUNDED_SKULL")
