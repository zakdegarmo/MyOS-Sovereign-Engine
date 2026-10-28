import bpy

print("--- BUILDING SIDE-BY-SIDE SCENE ---")

# 1. Open the original clean native mannequin blend file
mannequin_blend = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\models\mannequin\human_mannequin_native_bald.blend"
bpy.ops.wm.open_mainfile(filepath=mannequin_blend)

# 2. Import the Moonlit Mage GLB
mage_glb = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\models\meshy ai glb\rigged\Meshy_AI_Moonlit_Mage_biped\Meshy_AI_Moonlit_Mage_biped\Meshy_AI_Moonlit_Mage_biped_Character_output.glb"
bpy.ops.import_scene.gltf(filepath=mage_glb)

# 3. Remove the icosphere bubble from the Mage
for obj in list(bpy.data.objects):
    if 'icosphere' in obj.name.lower():
        bpy.data.objects.remove(obj, do_unlink=True)

# 4. Position the Mage to the right (+1.0m on X)
for obj in bpy.context.selected_objects:
    obj.location.x += 1.0

# 5. Hide crazy bone displays
for obj in bpy.data.objects:
    if obj.type == 'ARMATURE':
        obj.show_in_front = False
        obj.data.display_type = 'STICK'

# 6. Save as ready-to-open blend file
out_blend = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\mannequin_and_mage_scene.blend"
bpy.ops.wm.save_as_mainfile(filepath=out_blend)

print(f"✅ Saved perfectly prepared scene to: {out_blend}")
