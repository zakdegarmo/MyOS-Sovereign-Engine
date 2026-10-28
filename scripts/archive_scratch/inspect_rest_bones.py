import bpy

arm = bpy.data.objects['Armature']
man = bpy.data.objects['Mannequin']

arm.data.pose_position = 'REST'
bpy.context.view_layer.update()

for bname in ['Hips', 'Spine', 'Spine1', 'Neck', 'Head', 'LeftShoulder', 'LeftArm', 'LeftForeArm', 'RightShoulder', 'RightArm', 'RightForeArm', 'LeftUpLeg', 'LeftLeg', 'LeftFoot', 'RightUpLeg', 'RightLeg', 'RightFoot']:
    b = arm.pose.bones.get(bname)
    if b:
        h = arm.matrix_world @ b.head
        t = arm.matrix_world @ b.tail
        print(f'{bname:15}: head=({h.x:+.3f}, {h.y:+.3f}, {h.z:+.3f}), tail=({t.x:+.3f}, {t.y:+.3f}, {t.z:+.3f})')
