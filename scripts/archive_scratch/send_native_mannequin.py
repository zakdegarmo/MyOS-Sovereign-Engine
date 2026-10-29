import socket

code = """
import bpy
# Append or open the native bald mannequin directly into current Blender session
filepath = r"c:\\Users\\zakde\\Desktop\\AntiGravity projects\\MyOS\\apps\\web\\public\\models\\mannequin\\human_mannequin_native_bald.blend"
with bpy.data.libraries.load(filepath, link=False) as (data_from, data_to):
    data_to.objects = data_from.objects

for obj in data_to.objects:
    if obj is not None:
        bpy.context.scene.collection.objects.link(obj)

print("Successfully imported human_mannequin_native_bald objects into live Blender!")
"""

s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.connect(('127.0.0.1', 9876))
s.sendall(code.encode('utf-8'))
s.close()
print("SENT_MANNEQUIN_IMPORT")
