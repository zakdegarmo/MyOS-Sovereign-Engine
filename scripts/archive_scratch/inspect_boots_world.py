import bpy

boots = bpy.data.objects.get('Modular_Adventurer_Boots')
mw = boots.matrix_world
print("Boots matrix_world translation:", mw.to_translation())

zs = [(mw @ v.co).z for v in boots.data.vertices]
print(f"Boots world Z range: {min(zs):.3f} to {max(zs):.3f}")

# Let us check the top of the boots in world coordinates
top_boots = [mw @ v.co for v in boots.data.vertices if (mw @ v.co).z > 0.20]
print(f"Boots top world Z max: {max(p.z for p in top_boots):.3f}, min: {min(p.z for p in top_boots):.3f}")
for p in top_boots[:6]:
    print(f"world: x={p.x:.3f}, y={p.y:.3f}, z={p.z:.3f}")
