import bpy

hair_names = [
    'Modular_Hair_Spiky_Hero',
    'Modular_Hair_Rogue_Ponytail',
    'Modular_Hair_Mage_Bob',
    'Modular_Hair_Barbarian_Mane',
    'Modular_Hair_Elf_TwinTails'
]

for name in hair_names:
    obj = bpy.data.objects.get(name)
    if obj:
        # Shift vertices down along Z by 0.085m and slightly forward along Y by 0.015m
        for v in obj.data.vertices:
            v.co.z -= 0.085
            v.co.y -= 0.012
        obj.data.update()
        print(f'Lowered and fitted {name} to skull contour.')

bpy.ops.wm.save_as_mainfile(filepath='mannequin_chibi_basic_rigTest3.blend')
