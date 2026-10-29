import bpy

man = bpy.data.objects['Mannequin']
arm = bpy.data.objects['Armature']

# Let's inspect where the Armature bones are in world space:
print('--- POSE BONES (FRAME 0) ---')
for bname in ['LeftShoulder', 'LeftArm', 'RightShoulder', 'RightArm']:
    pb = arm.pose.bones.get(bname)
    if pb:
        h = arm.matrix_world @ pb.head
        t = arm.matrix_world @ pb.tail
        print(f'{bname}: head=({h.x:.3f}, {h.y:.3f}, {h.z:.3f}), tail=({t.x:.3f}, {t.y:.3f}, {t.z:.3f})')

print('--- REST BONES (DATA BONES) ---')
for bname in ['LeftShoulder', 'LeftArm', 'RightShoulder', 'RightArm']:
    db = arm.data.bones.get(bname)
    if db:
        h = arm.matrix_world @ db.head_local
        t = arm.matrix_world @ db.tail_local
        print(f'{bname}: head_local=({h.x:.3f}, {h.y:.3f}, {h.z:.3f}), tail_local=({t.x:.3f}, {t.y:.3f}, {t.z:.3f})')
