import bpy, math, os

flesh_base = os.path.abspath("flesh_base_mannequin.blend")
bpy.ops.wm.open_mainfile(filepath=flesh_base)

p = os.path.abspath("mannequin_chibi_basic_rigTest2.blend")
with bpy.data.libraries.load(p) as (df, dt):
    dt.objects = ["Modular_Hair_Adventurer"]
hair = bpy.data.objects["Modular_Hair_Adventurer"]
bpy.context.scene.collection.objects.link(hair)
hair.hide_render = False
hair.hide_viewport = False

# Rotate 90 around X so top is UP and opening is DOWN
hair.rotation_euler = (math.radians(90), 0, 0)
hair.location = (0.0, 0.02, 1.06)
hair.scale = (1.55, 1.55, 1.55)

scene = bpy.context.scene
scene.render.filepath = os.path.abspath("artifacts/verification/test_hair_rot90.png")
bpy.ops.render.render(write_still=True)
