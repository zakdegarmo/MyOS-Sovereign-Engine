import socket

code = """
import bpy

# 1. Purge ALL existing objects, meshes, and collections completely
for obj in list(bpy.data.objects):
    bpy.data.objects.remove(obj, do_unlink=True)

for col in list(bpy.data.collections):
    bpy.data.collections.remove(col)

# Create clean active collection
main_col = bpy.data.collections.new("Clean_Production_Scene")
bpy.context.scene.collection.children.link(main_col)

# 2. Append ONLY the authentic human native bald mannequin
mannequin_blend = r"c:\\Users\\zakde\\Desktop\\AntiGravity projects\\MyOS\\apps\\web\\public\\models\\mannequin\\human_mannequin_native_bald.blend"
with bpy.data.libraries.load(mannequin_blend, link=False) as (data_from, data_to):
    data_to.objects = data_from.objects

for obj in data_to.objects:
    if obj is not None:
        main_col.objects.link(obj)

# 3. Import Moonlit Mage Character GLB offset to the side (+1.5m on X)
mage_glb = r"c:\\Users\\zakde\\Desktop\\AntiGravity projects\\MyOS\\apps\\web\\public\\models\\meshy ai glb\\rigged\\Meshy_AI_Moonlit_Mage_biped\\Meshy_AI_Moonlit_Mage_biped\\Meshy_AI_Moonlit_Mage_biped_Character_output.glb"
bpy.ops.import_scene.gltf(filepath=mage_glb)

# Offset newly imported objects to the right
for obj in bpy.context.selected_objects:
    obj.location.x += 1.5

print("✨ Cleaned entire scene! Only authentic native mannequin and Moonlit Mage are present.")
"""

s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.connect(('127.0.0.1', 9876))
s.sendall(code.encode('utf-8'))
s.close()
print("PURGED_AND_RELOADED_CLEAN")
