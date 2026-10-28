import bpy, math

arm = bpy.data.objects['Armature']
for name in ['Mannequin', 'Modular_Adventurer_Tunic', 'Modular_Adventurer_Pants', 
             'Modular_Adventurer_Boots', 'Modular_Hair_Adventurer', 'Sword', 'Shield']:
    obj = bpy.data.objects.get(name)
    if obj:
        print(f"{name}: parent={obj.parent.name if obj.parent else 'None'}, parent_type={obj.parent_type}, parent_bone={obj.parent_bone}")
