"""
test_bank_render.py
-------------------
Renders uniracer_model.blend banked at 20 degrees (steer bank) to verify that
the wheel, tire, and frame uprights stay completely aligned with zero clipping.
"""

import bpy
import math
import os

def render_bank():
    artifact_dir = r"C:\Users\zakde\.gemini\antigravity\brain\5d778f69-db13-4232-9d87-80fc4f0ece4e"
    scene = bpy.context.scene

    arm = bpy.data.objects.get('Uniracer_Rig')
    bpy.context.view_layer.objects.active = arm

    # Test bank: tilt Root or Frame+Wheel by 20 deg
    bpy.ops.object.mode_set(mode='POSE')
    pb = arm.pose.bones
    pb['Bone_Frame'].rotation_mode = 'ZYX'
    pb['Bone_Wheel'].rotation_mode = 'ZYX'

    bank_angle = math.radians(20) # 20 degree bank
    pb['Bone_Frame'].rotation_euler.z = bank_angle
    pb['Bone_Wheel'].rotation_euler.z = bank_angle
    bpy.ops.object.mode_set(mode='OBJECT')

    # Create aim target
    aim_obj = bpy.data.objects.get("AimTarget")
    if not aim_obj:
        aim_obj = bpy.data.objects.new("AimTarget", None)
        bpy.context.scene.collection.objects.link(aim_obj)
    aim_obj.location = (0, 0, 10)

    cam_obj = bpy.data.objects.get("InspectCam")
    if not cam_obj:
        cam_data = bpy.data.cameras.new(name="InspectCam")
        cam_obj = bpy.data.objects.new(name="InspectCam", object_data=cam_data)
        bpy.context.scene.collection.objects.link(cam_obj)
    scene.camera = cam_obj
    cam_obj.data.lens = 45

    cam_obj.constraints.clear()
    track = cam_obj.constraints.new(type='TRACK_TO')
    track.target = aim_obj
    track.track_axis = 'TRACK_NEGATIVE_Z'
    track.up_axis = 'UP_Y'

    # Front Camera
    cam_obj.location = (0, 45, 10)
    bpy.context.view_layer.update()

    out_file = os.path.join(artifact_dir, "uniracer_banked_front_inspection.png")
    scene.render.filepath = out_file
    bpy.ops.render.render(write_still=True)
    print("Rendered banked front inspection to:", out_file)

    # Reset pose
    bpy.ops.object.mode_set(mode='POSE')
    pb['Bone_Frame'].rotation_euler.z = 0
    pb['Bone_Wheel'].rotation_euler.z = 0
    bpy.ops.object.mode_set(mode='OBJECT')

if __name__ == '__main__':
    render_bank()
