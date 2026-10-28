import bpy, math, os
import mathutils

p = os.path.abspath("mannequin_chibi_basic_rigTest2.blend")
with bpy.data.libraries.load(p) as (df, dt):
    dt.objects = ["Modular_Hair_Adventurer"]
hair = bpy.data.objects["Modular_Hair_Adventurer"]
bpy.context.scene.collection.objects.link(hair)
hair.hide_render = False
hair.hide_viewport = False

# The rotation from rigTest2 was approx -112.5 degrees around X
# Let's test euler: X = -112.5 deg (or -1.963 rad)
hair.rotation_euler = (math.radians(-112.5), 0, 0)
# And let's place it at top of head: cranium center is Z = 1.04, top is Z = 1.26
hair.location = (0.0, -0.01, 1.08)
hair.scale = (1.55, 1.55, 1.55)

scene = bpy.context.scene
scene.render.filepath = os.path.abspath("artifacts/verification/test_hair_fitted2.png")
bpy.ops.render.render(write_still=True)
