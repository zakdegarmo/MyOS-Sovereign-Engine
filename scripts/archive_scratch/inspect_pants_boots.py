import bpy

pants = bpy.data.objects.get('Modular_Adventurer_Pants')
boots = bpy.data.objects.get('Modular_Adventurer_Boots')
man = bpy.data.objects['Mannequin']

print("Pants vertices below z=0.25:")
for v in pants.data.vertices:
    if v.co.z < 0.22:
        print(f"Pants cuff: x={v.co.x:.3f}, y={v.co.y:.3f}, z={v.co.z:.3f}")

print("\nBoots top vertices above z=0.20:")
for v in boots.data.vertices:
    if v.co.z > 0.25:
        print(f"Boot top: x={v.co.x:.3f}, y={v.co.y:.3f}, z={v.co.z:.3f}")
