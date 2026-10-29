import bpy

hair = bpy.data.objects.get('Modular_Hair_Adventurer')
if hair:
    for v in hair.data.vertices:
        # If vertex is in the front bangs (z < 0.08)
        if v.co.y < 0:
            if v.co.z < 0.08:
                v.co.z += 0.045
                v.co.y += 0.02
        # Taper crown slightly
        if v.co.z > 0.15:
            v.co.z *= 0.92

bpy.ops.wm.save_as_mainfile(filepath='mannequin_chibi_basic_rigTest2.blend')
print('Polished hair bangs and crown!')
