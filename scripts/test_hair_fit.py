import bpy, os

flesh_base = os.path.abspath("flesh_base_mannequin.blend")
bpy.ops.wm.open_mainfile(filepath=flesh_base)

# Test appending Modular_Hair_Adventurer
p = os.path.abspath("mannequin_chibi_basic_rigTest2.blend")
with bpy.data.libraries.load(p) as (df, dt):
    dt.objects = ["Modular_Hair_Adventurer"]

hair = bpy.data.objects.get("Modular_Hair_Adventurer")
if hair:
    bpy.context.scene.collection.objects.link(hair)
    print("Hair bounds z:", [v.co.z for v in hair.data.vertices][:5])
    # Cranium is at loc=(0.0, 0.00, 1.04), rx=0.25, ry=0.23, rz=0.22 (top of head is ~1.26)
    # Check hair global coords
    print("Hair loc:", hair.location, "Hair dims:", hair.dimensions)

