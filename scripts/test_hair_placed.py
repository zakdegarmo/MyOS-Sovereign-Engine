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

hair.rotation_euler = (math.radians(90), 0, 0)
hair.location = (0.0, 0.02, 1.22)
hair.scale = (1.65, 1.65, 1.65)

scene = bpy.context.scene
scene.render.filepath = os.path.abspath("artifacts/verification/test_hair_placed.png")
bpy.ops.render.render(write_still=True)
