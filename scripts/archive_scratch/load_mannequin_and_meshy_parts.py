import socket

code = """
import bpy

# 1. Clear current scene
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

# 2. Append the native bald mannequin from mannequin folder
mannequin_blend = r"c:\\Users\\zakde\\Desktop\\AntiGravity projects\\MyOS\\apps\\web\\public\\models\\mannequin\\human_mannequin_native_bald.blend"
with bpy.data.libraries.load(mannequin_blend, link=False) as (data_from, data_to):
    data_to.objects = data_from.objects

for obj in data_to.objects:
    if obj is not None:
        bpy.context.scene.collection.objects.link(obj)

# 3. Append the hair and robe from Moonlit Mage Character Output
mage_glb = r"c:\\Users\\zakde\\Desktop\\AntiGravity projects\\MyOS\\apps\\web\\public\\models\\meshy ai glb\\rigged\\Meshy_AI_Moonlit_Mage_biped\\Meshy_AI_Moonlit_Mage_biped\\Meshy_AI_Moonlit_Mage_biped_Character_output.glb"
bpy.ops.import_scene.gltf(filepath=mage_glb)

print("🎯 Combined the clean native mannequin with the high-res Meshy model in live Blender!")
"""

s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.connect(('127.0.0.1', 9876))
s.sendall(code.encode('utf-8'))
s.close()
print("SENT_COMBINED_MANNEQUIN_AND_MESHY")
