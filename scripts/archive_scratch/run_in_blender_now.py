"""
run_in_blender_now.py

Paste this exact script into Blender's Text Editor and click 'Run Script' (Alt+P):
1. Scales down the mannequin by 0.75x to match chibi height
2. Imports the Moonlit Mage Character GLB right next to it
3. Deletes any icosphere bounding bubble
4. Sets bone display to clean sticks and turns on Material Preview
"""

import bpy

print("--- RUNNING SETUP DIRECTLY IN BLENDER ---")

# 1. Scale down the mannequin by 0.75x
for obj in bpy.data.objects:
    if obj.type == 'ARMATURE' or 'mannequin' in obj.name.lower() or obj.name == 'Cylinder':
        obj.scale = (0.75, 0.75, 0.75)

# 2. Import the Moonlit Mage GLB right beside it (+1.2m on X)
mage_path = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\models\meshy ai glb\rigged\Meshy_AI_Moonlit_Mage_biped\Meshy_AI_Moonlit_Mage_biped\Meshy_AI_Moonlit_Mage_biped_Character_output.glb"
bpy.ops.import_scene.gltf(filepath=mage_path)

# Delete icosphere bounding bubble from GLB
for obj in list(bpy.data.objects):
    if 'icosphere' in obj.name.lower():
        bpy.data.objects.remove(obj, do_unlink=True)

# Offset newly imported Mage to the right
for obj in bpy.context.selected_objects:
    obj.location.x += 1.2

# 3. Clean up bone display & enable Material Preview Shading
for obj in bpy.data.objects:
    if obj.type == 'ARMATURE':
        obj.show_in_front = False
        obj.data.display_type = 'STICK'

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

print("✨ Setup complete! Mannequin scaled & Moonlit Mage loaded beside it!")
