import bpy

man = bpy.data.objects['Mannequin']
tunic = bpy.data.objects.get('Modular_Adventurer_Tunic')
pants = bpy.data.objects.get('Modular_Adventurer_Pants')
boots = bpy.data.objects.get('Modular_Adventurer_Boots')

print("Mannequin verts:", len(man.data.vertices))
print("Tunic verts:", len(tunic.data.vertices))
print("Pants verts:", len(pants.data.vertices))
print("Boots verts:", len(boots.data.vertices))

# Let's check tunic collar z and radii
tunic_zs = [v.co.z for v in tunic.data.vertices]
print("Tunic Z range:", min(tunic_zs), "to", max(tunic_zs))

pants_zs = [v.co.z for v in pants.data.vertices]
print("Pants Z range:", min(pants_zs), "to", max(pants_zs))

boots_zs = [v.co.z for v in boots.data.vertices]
print("Boots Z range:", min(boots_zs), "to", max(boots_zs))
