import bpy, os, math

OUT_FEMALE_BLEND = os.path.abspath('flesh_female_mannequin.blend')
bpy.ops.wm.open_mainfile(filepath=OUT_FEMALE_BLEND)

cam = bpy.data.objects['RenderCam']
cx, cy, cz = 0.0, -1.28, 0.62
dist = 3.5
rad = math.radians(45)
cam.location = (cx + dist * math.sin(rad), cy - dist * math.cos(rad), cz)
cam.rotation_euler = (math.radians(90), 0, rad)

scene = bpy.context.scene
scene.render.filepath = os.path.abspath('artifacts/verification/flesh_female_3quarter_preview.png')
bpy.ops.render.render(write_still=True)
print("Rendered female 3/4 view!")
