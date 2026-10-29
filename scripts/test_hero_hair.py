import bpy, os

flesh_base = os.path.abspath("flesh_base_mannequin.blend")
bpy.ops.wm.open_mainfile(filepath=flesh_base)

p = os.path.abspath("apps/web/dist/models/outfitted_jrpg_hero_1.blend")
with bpy.data.libraries.load(p) as (df, dt):
    dt.objects = ["Hero_Meshy_Chunky_Hair"]

hair = bpy.data.objects.get("Hero_Meshy_Chunky_Hair")
bpy.context.scene.collection.objects.link(hair)
hair.hide_render = False
hair.hide_viewport = False
hair.location = (0.0, 0.0, 1.04)

# Scale hair to fit head
# Head cranium radius rx=0.25, ry=0.23, rz=0.22
hair.scale = (0.50, 0.50, 0.50)

scene = bpy.context.scene
scene.render.filepath = os.path.abspath("artifacts/verification/test_hero_hair.png")
bpy.ops.render.render(write_still=True)
