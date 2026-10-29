import bpy

for obj in bpy.data.objects:
    if any(k in obj.name.lower() for k in ['sword', 'shield', 'weapon', 'prop']):
        print(f"Weapon: {obj.name}, parent={obj.parent.name if obj.parent else 'None'}, type={obj.type}")
