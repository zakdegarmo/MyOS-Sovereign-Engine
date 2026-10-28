import bpy, os

man = bpy.data.objects['Mannequin']
mw = man.matrix_world
CX = 0.007
grp_vis = man.vertex_groups['Body_Visible']

for v in man.data.vertices:
    wco = mw @ v.co
    x, y, z = wco.x, wco.y, wco.z
    dx = abs(x - CX)

    # Head: all above chin
    is_head = (z >= 1.04)
    # Neck: full 360 degree neck down to z=0.92 (dx <= 0.11, y in [1.14, 1.42])
    is_neck = (z >= 0.92 and dx <= 0.11 and 1.14 <= y <= 1.42)
    # Arms: forearm, hand, and bicep inside cuff
    vg_fa_l = man.vertex_groups.get('LeftForeArm')
    vg_fa_r = man.vertex_groups.get('RightForeArm')
    vg_hand_l = man.vertex_groups.get('LeftHand')
    vg_hand_r = man.vertex_groups.get('RightHand')
    
    def get_w(vg):
        if not vg: return 0.0
        for g in v.groups:
            if g.group == vg.index: return g.weight
        return 0.0
        
    is_hand_fa = (get_w(vg_fa_l) > 0.15 or get_w(vg_fa_r) > 0.15 or get_w(vg_hand_l) > 0.15 or get_w(vg_hand_r) > 0.15)
    is_bicep = (dx >= 0.24 and z <= 0.90 and z >= 0.65)
    is_arm = (is_hand_fa or is_bicep)

    # Lower legs & feet: completely solid below z=0.30!
    is_lower_leg = (z <= 0.30)

    if is_head or is_neck or is_arm or is_lower_leg:
        grp_vis.add([v.index], 1.0, 'REPLACE')
    else:
        grp_vis.add([v.index], 0.0, 'REPLACE')

bpy.ops.wm.save_as_mainfile(filepath='mannequin_chibi_basic_rigTest4.blend')
print('Updated Body_Visible mask on rigTest4!')
