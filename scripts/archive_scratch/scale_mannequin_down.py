import socket

code = """
import bpy

# Scale down all mannequin objects/armatures in the scene
for obj in bpy.data.objects:
    if 'mannequin' in obj.name.lower() or 'armature' in obj.name.lower():
        obj.scale = (obj.scale[0] * 0.75, obj.scale[1] * 0.75, obj.scale[2] * 0.75)

print("Scaled mannequin down by 25%!")
"""

s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.connect(('127.0.0.1', 9876))
s.sendall(code.encode('utf-8'))
s.close()
print("SCALED_DOWN_MANNEQUIN")
