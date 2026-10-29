import socket

code = """
import bpy

# Open the authentic human_mannequin_native_bald.blend directly into Blender
blend_file = r"c:\\Users\\zakde\\Desktop\\AntiGravity projects\\MyOS\\apps\\web\\public\\models\\mannequin\\human_mannequin_native_bald.blend"
bpy.ops.wm.open_mainfile(filepath=blend_file)

# Import the Moonlit Mage right alongside it
mage_glb = r"c:\\Users\\zakde\\Desktop\\AntiGravity projects\\MyOS\\apps\\web\\public\\models\\meshy ai glb\\rigged\\Meshy_AI_Moonlit_Mage_biped\\Meshy_AI_Moonlit_Mage_biped\\Meshy_AI_Moonlit_Mage_biped_Character_output.glb"
bpy.ops.import_scene.gltf(filepath=mage_glb)

# Remove any icosphere from the mage GLB
for obj in list(bpy.data.objects):
    if 'icosphere' in obj.name.lower():
        bpy.data.objects.remove(obj, do_unlink=True)

# Offset mage slightly to the right (+1.0m X)
for obj in bpy.context.selected_objects:
    obj.location.x += 1.0

# Set shading to Material Preview
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

print("Opened authentic human_mannequin_native_bald.blend cleanly with Moonlit Mage beside it!")
"""

s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.connect(('127.0.0.1', 9876))
s.sendall(code.encode('utf-8'))
s.close()
print("OPENED_CLEAN_ORIGINAL_BLEND")
