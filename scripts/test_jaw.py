import bpy, math, os
bpy.ops.wm.open_mainfile(filepath=r"apps\web\public\actions\hemp_crew\frankie_actor_master.blend")
arm = bpy.data.objects["Frankie_Armature"]
pb_jaw = arm.pose.bones["Jaw"]
pb_jaw.rotation_mode = 'XYZ'
pb_jaw.rotation_euler = (math.radians(-14), 0, 0)
scene = bpy.context.scene
scene.render.filepath = r"apps\web\public\actions\hemp_crew\test_jaw_open.png"
bpy.ops.render.render(write_still=True)
print("Rendered jaw open test")
