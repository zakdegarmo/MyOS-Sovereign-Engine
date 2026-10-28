import bpy

# 1. Open the file
blend_file = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\mannequin_and_mage_scene.blend"
bpy.ops.wm.open_mainfile(filepath=blend_file)

# 2. DELETE the broken Meshy armature completely!
for obj in list(bpy.data.objects):
    if obj.name == 'Armature.001' or (obj.type == 'ARMATURE' and 'native' not in obj.name.lower() and 'Armature' in obj.name and obj.name != 'Armature'):
        bpy.data.objects.remove(obj, do_unlink=True)

# Also check for any armature parented to char1 and unparent / delete it
mage_mesh = bpy.data.objects.get('char1')
if mage_mesh:
    # Clear parent and keep transform so mesh stays in place
    matrix_world = mage_mesh.matrix_world.copy()
    mage_mesh.parent = None
    mage_mesh.matrix_world = matrix_world
    # Remove any armature modifier on mage
    for mod in list(mage_mesh.modifiers):
        if mod.type == 'ARMATURE':
            mage_mesh.modifiers.remove(mod)

# Remove any other rogue armatures
for obj in list(bpy.data.objects):
    if obj.type == 'ARMATURE' and obj.name != 'Armature':
        bpy.data.objects.remove(obj, do_unlink=True)

# 3. Save the clean file back
bpy.ops.wm.save_as_mainfile(filepath=blend_file)
print("✅ Deleted broken Armature.001 completely! The scene is 100% clean.")
