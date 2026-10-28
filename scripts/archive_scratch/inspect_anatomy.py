import bpy

man = bpy.data.objects['Mannequin']
arm = bpy.data.objects['Armature']

print('--- MANNEQUIN MATERIALS ---')
for i, m in enumerate(man.data.materials):
    print(f'Slot {i}: {m.name if m else "None"}')

print('--- BONE HEAD/TAIL POSITIONS (WORLD) ---')
for b in arm.pose.bones:
    if any(k in b.name.lower() for k in ['head', 'neck', 'spine', 'chest', 'shoulder', 'arm', 'leg', 'knee']):
        h = arm.matrix_world @ b.head
        t = arm.matrix_world @ b.tail
        print(f'{b.name}: head=({h.x:.3f}, {h.y:.3f}, {h.z:.3f}), tail=({t.x:.3f}, {t.y:.3f}, {t.z:.3f})')

print('--- MANNEQUIN VERTEX BOUNDS ---')
mw = man.matrix_world
zs = [(mw @ v.co).z for v in man.data.vertices]
ys = [(mw @ v.co).y for v in man.data.vertices]
xs = [(mw @ v.co).x for v in man.data.vertices]
print(f'X: [{min(xs):.3f}, {max(xs):.3f}], Y: [{min(ys):.3f}, {max(ys):.3f}], Z: [{min(zs):.3f}, {max(zs):.3f}]')

head_v_zs = [(mw @ v.co).z for v in man.data.vertices if (mw @ v.co).z > 1.0]
print(f'Head Z range: [{min(head_v_zs):.3f}, {max(head_v_zs):.3f}]')

neck_v_zs = [(mw @ v.co).z for v in man.data.vertices if 0.90 <= (mw @ v.co).z <= 1.15]
print(f'Neck/Shoulder Z range: [{min(neck_v_zs):.3f}, {max(neck_v_zs):.3f}]')
