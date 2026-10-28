import socket

code = """
import bpy

# Find the Meshy armature that has elongated runaway bones
for obj in bpy.data.objects:
    if obj.type == 'ARMATURE':
        # Turn off bone display or hide armature overlay so you see clean geometry
        obj.show_in_front = False
        obj.hide_viewport = True

# Frame the two characters cleanly in the center of the viewport
for area in bpy.context.screen.areas:
    if area.type == 'VIEW_3D':
        for region in area.regions:
            if region.type == 'WINDOW':
                override = {'area': area, 'region': region}
                bpy.ops.view3d.view_all(override)
                break

print("Hidden crazy runaway bones and framed the clean character meshes!")
"""

s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.connect(('127.0.0.1', 9876))
s.sendall(code.encode('utf-8'))
s.close()
print("CLEANED_BONES_VIEW")
