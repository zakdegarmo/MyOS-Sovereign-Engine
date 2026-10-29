import bpy

blend_file = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\mannequin_and_mage_scene.blend"
bpy.ops.wm.open_mainfile(filepath=blend_file)

# The Mage mesh object is 'char1'
mage = bpy.data.objects.get('char1')
if mage:
    # Ensure it's in the active Scene Collection
    if mage.name not in bpy.context.scene.collection.objects:
        bpy.context.scene.collection.objects.link(mage)
    
    mage.hide_viewport = False
    mage.hide_render = False
    mage.hide_set(False)
    mage.location = (0.9, 0, 0)
    mage.scale = (1, 1, 1)

# Ensure Mannequin mesh is also unhidden
mannequin = bpy.data.objects.get('Mannequin')
if mannequin:
    mannequin.hide_viewport = False
    mannequin.hide_render = False
    mannequin.hide_set(False)

# Frame both in Viewport
for area in bpy.context.screen.areas:
    if area.type == 'VIEW_3D':
        for space in area.spaces:
            if space.type == 'VIEW_3D':
                space.shading.type = 'MATERIAL'

bpy.ops.wm.save_as_mainfile(filepath=blend_file)
print("✅ Ensured char1 (Mage) is linked to active Scene Collection and 100% visible!")
