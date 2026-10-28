import bpy

hair = bpy.data.objects.get('Modular_Hair_Adventurer')
if hair:
    for v in hair.data.vertices:
        # If vertex is in the front bangs (z < 0.05 in local space and y near front)
        if v.co.y < 0 and v.co.z < 0.02:
            v.co.z += 0.035
            v.co.y += 0.015

bpy.ops.wm.save_as_mainfile(filepath='mannequin_chibi_basic_rigTest2.blend')
print('Lifted bangs slightly to reveal anime eyes!')
