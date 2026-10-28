import bpy, os, math

flesh_base = os.path.abspath("flesh_base_mannequin.blend")
bpy.ops.wm.open_mainfile(filepath=flesh_base)

p = os.path.abspath("mannequin_chibi_basic_rigTest2.blend")
with bpy.data.libraries.load(p) as (df, dt):
    dt.objects = ["Modular_Hair_Adventurer"]

hair = bpy.data.objects.get("Modular_Hair_Adventurer")
bpy.context.scene.collection.objects.link(hair)
hair.hide_render = False
hair.hide_viewport = False

min_z = min(v.co.z for v in hair.data.vertices)
mid_y = sum(v.co.y for v in hair.data.vertices) / len(hair.data.vertices)
mid_x = sum(v.co.x for v in hair.data.vertices) / len(hair.data.vertices)
for v in hair.data.vertices:
    v.co.x -= mid_x
    v.co.y -= mid_y
    v.co.z -= min_z

# In the previous render, rotation_euler = (-90, 0, 0) had the opening facing front (+Y).
# To make opening face DOWN (-Z), we rotate +90 around X from there: so rotation_euler = (0, 0, 0)!
# Let's test rotation_euler = (0, 0, 0)
hair.rotation_euler = (0, 0, 0)
hair.location = (0.0, -0.02, 0.96)
hair.scale = (1.65, 1.65, 1.65)

scene = bpy.context.scene
scene.render.filepath = os.path.abspath("artifacts/verification/test_adventurer_rot_0.png")
bpy.ops.render.render(write_still=True)
