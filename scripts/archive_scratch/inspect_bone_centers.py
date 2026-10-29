import bpy

arm = bpy.data.objects['Armature']
for bname in ['Hips', 'Spine', 'neck', 'Head']:
    pb = arm.pose.bones.get(bname)
    if pb:
        # World coordinate of bone head
        w_head = arm.matrix_world @ pb.head
        print(f"Bone {bname}: world={w_head}")
