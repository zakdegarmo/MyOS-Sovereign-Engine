import bpy

blend_path = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\flesh_base_comic.blend"
bpy.ops.wm.open_mainfile(filepath=blend_path)

arm = bpy.data.objects['Armature']
for bname in ['Hips', 'LeftUpLeg', 'LeftLeg', 'LeftFoot', 'LeftToeBase']:
    b = arm.data.bones.get(bname)
    if b:
        print(f"Bone {bname}: head=({b.head_local.x:.3f}, {b.head_local.y:.3f}, {b.head_local.z:.3f}) tail=({b.tail_local.x:.3f}, {b.tail_local.y:.3f}, {b.tail_local.z:.3f}) length={b.length:.3f}")
