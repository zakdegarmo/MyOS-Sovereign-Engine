import bpy, os

# Calibrate studio lighting
key = bpy.data.lights.get('KeyLight')
if key:
    key.energy = 150.0
    key.color = (1.0, 0.96, 0.92) # Soft warm key

fill = bpy.data.lights.get('VioletFill')
if fill:
    fill.energy = 50.0
    fill.color = (0.85, 0.88, 1.0) # Soft cool fill

rim = bpy.data.lights.get('RimLight')
if rim:
    rim.energy = 80.0
    rim.color = (1.0, 1.0, 1.0) # Clean white rim

# Ensure mannequin skin has beautiful warm anime tone
skin_mat = bpy.data.materials.get('Native_Anime_Skin_Base')
if skin_mat:
    bsdf = skin_mat.node_tree.nodes.get('Principled BSDF')
    if bsdf:
        bsdf.inputs['Base Color'].default_value = (0.95, 0.82, 0.74, 1.0)
        bsdf.inputs['Roughness'].default_value = 0.45

bpy.ops.wm.save_as_mainfile(filepath='mannequin_chibi_basic_rigTest2.blend')
print('Calibrated lights and skin material!')
