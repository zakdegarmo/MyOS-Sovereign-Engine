import bpy

arm = bpy.data.objects['Armature']
man = bpy.data.objects['Mannequin']

arm.data.pose_position = 'REST'
bpy.context.view_layer.update()

for b in ['Hips', 'Spine', 'neck', 'Head']:
    pb = arm.pose.bones.get(b)
    if pb:
        h = arm.matrix_world @ pb.head
        print(f'rigTest2 REST {b}: head=({h.x:.3f}, {h.y:.3f}, {h.z:.3f})')
