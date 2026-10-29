import bpy, mathutils

arm = bpy.data.objects['Armature']
hair = bpy.data.objects['Modular_Hair_Adventurer']

arm.data.pose_position = 'REST'
bpy.context.view_layer.update()

# Clamp any hair vertex above Z = 1.235 down into the skull so it stays inside the hat cone!
mw = hair.matrix_world
mw_inv = mw.inverted()

for v in hair.data.vertices:
    wco = mw @ v.co
    if wco.z > 1.230:
        # Flatten the crown to sit snugly under the brim
        wco.z = 1.225 + (wco.z - 1.230) * 0.15
        # Taper slightly inward
        wco.x = 0.007 + (wco.x - 0.007) * 0.85
        wco.y = 1.241 + (wco.y - 1.241) * 0.85
        v.co = mw_inv @ wco

hair.data.update()
bpy.ops.wm.save_as_mainfile(filepath='mannequin_chibi_basic_rigTest3.blend')
print('Tucked hair crown under hat!')
