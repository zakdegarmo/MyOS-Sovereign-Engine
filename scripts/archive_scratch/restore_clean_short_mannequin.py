import socket

code = """
import bpy

# Clear scene
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

# 1. Load clean native bald mannequin
mannequin_blend = r"c:\\Users\\zakde\\Desktop\\AntiGravity projects\\MyOS\\apps\\web\\public\\models\\mannequin\\human_mannequin_native_bald.blend"
with bpy.data.libraries.load(mannequin_blend, link=False) as (data_from, data_to):
    data_to.objects = data_from.objects

for obj in data_to.objects:
    if obj is not None:
        bpy.context.scene.collection.objects.link(obj)

# 2. Scale the mannequin down uniformly to 0.75x (matching Mage scale)
for obj in bpy.context.scene.collection.objects:
    obj.scale = (0.75, 0.75, 0.75)
    obj.location = (0, 0, 0)

# 3. Load Moonlit Mage right next to it (+1.0m X)
mage_glb = r"c:\\Users\\zakde\\Desktop\\AntiGravity projects\\MyOS\\apps\\web\\public\\models\\meshy ai glb\\rigged\\Meshy_AI_Moonlit_Mage_biped\\Meshy_AI_Moonlit_Mage_biped\\Meshy_AI_Moonlit_Mage_biped_Character_output.glb"
bpy.ops.import_scene.gltf(filepath=mage_glb)

# Remove icosphere from mage
for obj in list(bpy.data.objects):
    if 'icosphere' in obj.name.lower():
        bpy.data.objects.remove(obj, do_unlink=True)

for obj in bpy.context.selected_objects:
    obj.location.x += 1.0

# 4. Hide all bone armatures so you only see clean meshes and materials
for obj in bpy.data.objects:
    if obj.type == 'ARMATURE':
        obj.hide_viewport = True
    elif obj.type == 'MESH':
        obj.hide_viewport = False
        obj.hide_render = False

# 5. Material Preview Shading & Frame in 3D Viewport
for area in bpy.context.screen.areas:
    if area.type == 'VIEW_3D':
        for space in area.spaces:
            if space.type == 'VIEW_3D':
                space.shading.type = 'MATERIAL'
        for region in area.regions:
            if region.type == 'WINDOW':
                override = {'area': area, 'region': region}
                bpy.ops.view3d.view_all(override)
                break

print("✨ Restored the clean, shortened native mannequin standing right next to the Mage!")
"""

s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.connect(('127.0.0.1', 9876))
s.sendall(code.encode('utf-8'))
s.close()
print("RESTORED_CLEAN_SHORT_MANNEQUIN")
