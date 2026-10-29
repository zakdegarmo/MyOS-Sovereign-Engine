import bpy

arm = bpy.data.objects['Armature']
man = bpy.data.objects['Mannequin']
print('rigTest2 Armature location:', arm.location)
print('rigTest2 Mannequin location:', man.location)
print('rigTest2 Mannequin matrix_world:\n', man.matrix_world)
for b in ['Hips', 'Spine', 'neck', 'Head']:
    pb = arm.pose.bones.get(b)
    if pb:
        h = arm.matrix_world @ pb.head
        print(f'rigTest2 pose {b}: head=({h.x:.3f}, {h.y:.3f}, {h.z:.3f})')
