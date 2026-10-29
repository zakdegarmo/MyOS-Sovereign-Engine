import bpy

man = bpy.data.objects['Mannequin']
mw = man.matrix_world
CX = 0.007
grp_vis = man.vertex_groups['Body_Visible']

# Pre-fetch vertex groups
vg_head = man.vertex_groups.get('Head')
vg_sp01 = man.vertex_groups.get('Spine01')
vg_lsh = man.vertex_groups.get('LeftShoulder')
vg_rsh = man.vertex_groups.get('RightShoulder')
vg_larm = man.vertex_groups.get('LeftArm')
vg_rarm = man.vertex_groups.get('RightArm')
vg_lfa = man.vertex_groups.get('LeftForeArm')
vg_rfa = man.vertex_groups.get('RightForeArm')
vg_lh = man.vertex_groups.get('LeftHand')
vg_rh = man.vertex_groups.get('RightHand')

vg_lleg = man.vertex_groups.get('LeftLeg')
vg_rleg = man.vertex_groups.get('RightLeg')
vg_lfoot = man.vertex_groups.get('LeftFoot')
vg_rfoot = man.vertex_groups.get('RightFoot')
vg_ltoe = man.vertex_groups.get('LeftToeBase')
vg_rtoe = man.vertex_groups.get('RightToeBase')

def get_weight(v, vg):
    if not vg: return 0.0
    for g in v.groups:
        if g.group == vg.index: return g.weight
    return 0.0

vis_count = 0
for v in man.data.vertices:
    wco = mw @ v.co
    x, y, z = wco.x, wco.y, wco.z
    dx = abs(x - CX)

    # 1. Head & Face (above chin)
    is_head = (z >= 1.04)

    # 2. Neck & Trapezius / Nape down into tunic collar:
    # Tunic collar starts at z=0.86, so any neck/nape/throat vert down to z=0.84 within neck width
    # Front throat: y in [1.14, 1.25], Back nape: y in [1.25, 1.42]
    # Keep neck width dx <= 0.11
    # Ensure shoulder joints (lsh, rsh) are NOT visible so they don't poke through sleeves
    w_sh = max(get_weight(v, vg_lsh), get_weight(v, vg_rsh))
    is_neck_throat = (z >= 0.84 and dx <= 0.11 and 1.14 <= y <= 1.42 and w_sh < 0.25)

    # 3. Forearms & Hands: fully visible
    w_fa = max(get_weight(v, vg_lfa), get_weight(v, vg_rfa), get_weight(v, vg_lh), get_weight(v, vg_rh))
    is_arm_exposed = (w_fa > 0.10)
    # Also exposed lower bicep near cuff
    is_bicep_cuff = (dx >= 0.24 and 0.65 <= z <= 0.88 and w_sh < 0.10)
    is_arm = (is_arm_exposed or is_bicep_cuff)

    # 4. Legs:
    # Shin, calf, knee must be completely solid to prevent any gap between pants and boots!
    # But feet and toes must be hidden so they don't poke through boots during animation!
    w_leg = max(get_weight(v, vg_lleg), get_weight(v, vg_rleg))
    w_foot = max(get_weight(v, vg_lfoot), get_weight(v, vg_rfoot), get_weight(v, vg_ltoe), get_weight(v, vg_rtoe))
    
    # Solid lower leg: z in [0.08, 0.40], not in foot/toe
    is_leg_solid = (0.08 <= z <= 0.40 and w_foot < 0.35 and dx > 0.02)

    if is_head or is_neck_throat or is_arm or is_leg_solid:
        grp_vis.add([v.index], 1.0, 'REPLACE')
        vis_count += 1
    else:
        grp_vis.add([v.index], 0.0, 'REPLACE')

# Ensure Body_Mask modifier is enabled
mask_mod = man.modifiers.get('Body_Mask')
if not mask_mod:
    mask_mod = man.modifiers.new('Body_Mask', 'MASK')
    mask_mod.vertex_group = 'Body_Visible'
mask_mod.show_viewport = True
mask_mod.show_render = True

bpy.ops.wm.save_as_mainfile(filepath='mannequin_chibi_basic_rigTest4.blend')
print(f"Updated Body_Visible mask: {vis_count} visible vertices saved in mannequin_chibi_basic_rigTest4.blend!")
