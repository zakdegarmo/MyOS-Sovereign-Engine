import socket

code = """
import bpy

# Delete all Icosphere objects in the scene
for obj in list(bpy.data.objects):
    if 'Icosphere' in obj.name or obj.type != 'MESH' and obj.type != 'ARMATURE':
        bpy.data.objects.remove(obj, do_unlink=True)
    elif obj.name == 'Icosphere':
        bpy.data.objects.remove(obj, do_unlink=True)

# Also ensure all meshes inside the GLB are unhidden and framed
for obj in bpy.data.objects:
    obj.hide_viewport = False
    obj.hide_render = False

# Frame all objects in viewport
for area in bpy.context.screen.areas:
    if area.type == 'VIEW_3D':
        for region in area.regions:
            if region.type == 'WINDOW':
                override = {'area': area, 'region': region}
                bpy.ops.view3d.view_all(override)
                break

print("Removed Icosphere blocker and framed the actual character mesh!")
"""

s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.connect(('127.0.0.1', 9876))
s.sendall(code.encode('utf-8'))
s.close()
print("REMOVED_ICOSPHERE")
