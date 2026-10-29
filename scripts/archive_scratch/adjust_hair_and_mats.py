import bpy, mathutils

arm = bpy.data.objects['Armature']
hair = bpy.data.objects['Modular_Hair_Adventurer']

# Lower hair mesh by 0.16m in its local bone space
for v in hair.data.vertices:
    v.co.y -= 0.165
    v.co.z -= 0.015

# Set rich materials
def set_color(mat_name, color, roughness, metallic=0.0):
    mat = bpy.data.materials.get(mat_name)
    if mat:
        bsdf = mat.node_tree.nodes.get('Principled BSDF')
        if bsdf:
            bsdf.inputs['Base Color'].default_value = color
            bsdf.inputs['Roughness'].default_value = roughness
            bsdf.inputs['Metallic'].default_value = metallic

# Rich adventurer palette:
# Forest green tunic with gold trim
set_color('M_Adventurer_Tunic', (0.04, 0.28, 0.12, 1.0), 0.55)
# Chocolate leather belt
set_color('M_Adventurer_Belt', (0.18, 0.08, 0.03, 1.0), 0.35)
# Shiny brass buckle
set_color('M_Adventurer_Buckle', (0.95, 0.78, 0.15, 1.0), 0.20, metallic=0.9)
# Deep slate traveler breeches
set_color('M_Adventurer_Pants', (0.14, 0.16, 0.22, 1.0), 0.65)
# Dark oiled leather boots
set_color('M_Adventurer_Boots', (0.20, 0.10, 0.05, 1.0), 0.45)
# Tan cuff fold
set_color('M_Adventurer_BootCuff', (0.65, 0.48, 0.30, 1.0), 0.55)
# Warm anime chestnut blonde hair
set_color('M_Hair_Adventurer', (0.80, 0.50, 0.18, 1.0), 0.40)

# Unhide sword and shield
sword = bpy.data.objects.get('Modular_1H_Sword')
if sword:
    sword.hide_render = False
    sword.hide_viewport = False
    
shield = bpy.data.objects.get('Modular_Round_Shield')
if shield:
    shield.hide_render = False
    shield.hide_viewport = False

bpy.ops.wm.save_as_mainfile(filepath='mannequin_chibi_basic_rigTest2.blend')
print('Adjusted hair and materials!')
