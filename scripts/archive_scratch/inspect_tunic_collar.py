import bpy

tunic = bpy.data.objects['Modular_Adventurer_Tunic']
mw = tunic.matrix_world
zs = []
for v in tunic.data.vertices:
    wco = mw @ v.co
    if wco.z > 0.85:
        zs.append((wco.x, wco.y, wco.z))

print(f"Tunic high verts: {len(zs)}")
# Back verts have higher Y (or lower Y? Let's check front/back of tunic)
for x, y, z in sorted(zs, key=lambda p: p[2], reverse=True)[:15]:
    print(f"x={x:.3f}, y={y:.3f}, z={z:.3f}")

print("\nLowest collar verts at the back and front:")
# Let's check min Z for verts above 0.85
back_collar = [p for p in zs if p[1] > 1.27]
front_collar = [p for p in zs if p[1] < 1.27]
if back_collar:
    print("Back collar min Z:", min(p[2] for p in back_collar), "max Z:", max(p[2] for p in back_collar))
if front_collar:
    print("Front collar min Z:", min(p[2] for p in front_collar), "max Z:", max(p[2] for p in front_collar))
