import bpy

print("All lights:")
for o in bpy.data.objects:
    if o.type == 'LIGHT':
        print(f"  {o.name}: type={o.data.type}, energy={o.data.energy}, color={list(o.data.color)}, loc={list(o.location)}")
