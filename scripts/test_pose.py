import bpy, os
blend_path = os.path.abspath(r"apps\web\public\actions\hemp_crew\frankie_humanoid_master.blend")
bpy.ops.wm.open_mainfile(filepath=blend_path)

arm = bpy.data.objects.get("Armature")
act = bpy.data.actions.get("Idle_Talking_Loop")
if arm and act:
    arm.data.pose_position = 'POSE'
    arm.animation_data_create()
    arm.animation_data.action = act
    bpy.context.scene.frame_set(10)
    bpy.context.view_layer.update()

# Set camera distance 4.4m, lens 34mm for generous headroom & footroom
cam = bpy.data.objects.get("RenderCam")
cam.data.lens = 34
cam.data.sensor_fit = 'VERTICAL'
cam.data.sensor_height = 24.0
cam.location = (0.007, 1.241 - 4.4, 0.98)

scene = bpy.context.scene
out_test = os.path.abspath(r"apps\web\public\actions\hemp_crew\frankie_pose_test.png")
scene.render.filepath = out_test
bpy.ops.render.render(write_still=True)
print(f"Rendered Pose Test to: {out_test}")
