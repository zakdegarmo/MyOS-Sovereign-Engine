import bpy

print("--- RESTORING ORIGINAL PRISTINE MANNEQUIN & MAGE ---")

# 1. Open the original pristine blend file directly
mannequin_blend = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\models\mannequin\human_mannequin_native_bald.blend"
bpy.ops.wm.open_mainfile(filepath=mannequin_blend)

# 2. Import the Moonlit Mage GLB
mage_glb = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\models\meshy ai glb\rigged\Meshy_AI_Moonlit_Mage_biped\Meshy_AI_Moonlit_Mage_biped\Meshy_AI_Moonlit_Mage_biped_Character_output.glb"
bpy.ops.import_scene.gltf(filepath=mage_glb)

# 3. Clean up the GLB: Remove icosphere and broken Armature.001
for obj in list(bpy.data.objects):
    if 'icosphere' in obj.name.lower():
        bpy.data.objects.remove(obj, do_unlink=True)
    elif obj.name == 'Armature.001':
        bpy.data.objects.remove(obj, do_unlink=True)

# 4. Position the Mage mesh right next to the mannequin (+1.0m X)
for obj in bpy.context.selected_objects:
    if obj.type == 'MESH':
        obj.location.x += 1.0
        # Clear parent / armature modifier
        obj.parent = None
        for mod in list(obj.modifiers):
            if mod.type == 'ARMATURE':
                obj.modifiers.remove(mod)

# 5. Hide the native armature so zero bones/lines show
for obj in bpy.data.objects:
    if obj.type == 'ARMATURE':
        obj.hide_viewport = True
        obj.show_in_front = False

# 6. Save back to mannequin_and_mage_scene.blend
out_blend = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\mannequin_and_mage_scene.blend"
bpy.ops.wm.save_as_mainfile(filepath=out_blend)
print("✅ Restored original pristine un-deformed mannequin and Mage!")
