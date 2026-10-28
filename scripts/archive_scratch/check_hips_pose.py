import bpy

arm = bpy.data.objects['Armature']
man = bpy.data.objects['Mannequin']

for bname in ['Hips', 'Spine', 'Spine01', 'neck', 'Head']:
    pb = arm.pose.bones.get(bname)
    if pb:
        h = arm.matrix_world @ pb.head
        t = arm.matrix_world @ pb.tail
        print(f'Pose {bname}: head=({h.x:.3f}, {h.y:.3f}, {h.z:.3f})')
