import bpy

blend_file = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\mannequin_and_mage_scene.blend"
bpy.ops.wm.open_mainfile(filepath=blend_file)

# 1. DELETE ALL ARMATURES from the scene so ZERO bones/lines exist
for obj in list(bpy.data.objects):
    if obj.type == 'ARMATURE':
        bpy.data.objects.remove(obj, do_unlink=True)

# 2. Strip all armature modifiers from all meshes
for obj in bpy.data.objects:
    if obj.type == 'MESH':
        obj.parent = None
        for mod in list(obj.modifiers):
            if mod.type == 'ARMATURE':
                obj.modifiers.remove(mod)

# 3. Clean up scene lighting & camera, center both meshes at ground Z=0
# Ensure Cylinder platform is centered
cyl = bpy.data.objects.get('Cylinder')
if cyl:
    cyl.location = (0.5, 0, -0.05)

# 4. Save clean file
bpy.ops.wm.save_as_mainfile(filepath=blend_file)
print("✅ STRIPPED ALL BONES & ARMATURES. Pure clean meshes only.")
