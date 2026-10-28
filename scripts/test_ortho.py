import bpy, os
blend_path = os.path.abspath(r"apps\web\public\actions\hemp_crew\frankie_humanoid_master.blend")
bpy.ops.wm.open_mainfile(filepath=blend_path)

cam = bpy.data.objects.get("RenderCam")
cam.data.type = 'ORTHO'
cam.data.ortho_scale = 2.45
cam.location = (0.007, 1.241 - 3.6, 1.02)

target = bpy.data.objects.get("CamTarget")
target.location = (0.007, 1.241, 1.02)

arm = bpy.data.objects.get("Armature")
act = bpy.data.actions.get("Idle_Talking_Loop")
if arm and act:
    arm.data.pose_position = 'POSE'
    arm.animation_data_create()
    arm.animation_data.action = act
    bpy.context.scene.frame_set(12)
    bpy.context.view_layer.update()

scene = bpy.context.scene
out_test = os.path.abspath(r"apps\web\public\actions\hemp_crew\frankie_ortho_test.png")
scene.render.filepath = out_test
bpy.ops.render.render(write_still=True)
print(f"Rendered Ortho Test to: {out_test}")
