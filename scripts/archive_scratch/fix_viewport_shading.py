import socket

code = """
import bpy

# Set armature display to stick so it doesn't block the character mesh
for obj in bpy.data.objects:
    if obj.type == 'ARMATURE':
        obj.data.display_type = 'STICK'
        obj.show_in_front = False

# Ensure all mesh objects are visible, unhidden, and in Solid/Material preview
for obj in bpy.data.objects:
    if obj.type == 'MESH':
        obj.hide_viewport = False
        obj.hide_render = False

# Switch viewport to Material Preview
for area in bpy.context.screen.areas:
    if area.type == 'VIEW_3D':
        for space in area.spaces:
            if space.type == 'VIEW_3D':
                space.shading.type = 'MATERIAL'

print("Switched armature to stick mode and enabled Material Preview shading!")
"""

s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.connect(('127.0.0.1', 9876))
s.sendall(code.encode('utf-8'))
s.close()
print("UPDATED_VIEWPORT_DISPLAY")
