import bpy, bmesh, mathutils, math

def test_closed_tunic():
    CX = 0.007
    CY = 1.241
    
    bm = bmesh.new()
    
    # 1. Collar ring (12 vertices at Z = 0.96m around the neck)
    N_COL = 12
    collar = []
    w_collar = []
    for i in range(N_COL):
        ang = (i / float(N_COL)) * 2.0 * math.pi
        vx = CX + math.cos(ang) * 0.065
        vy = CY + math.sin(ang) * 0.060
        vz = 0.96
        v = bm.verts.new(mathutils.Vector((vx, vy, vz)))
        collar.append(v)
        w_collar.append((v, {'neck': 0.6, 'Spine01': 0.4}))
        
    # 2. Chest & Back Ring (16 vertices at Z = 0.88m)
    N_CHEST = 16
    chest = []
    w_chest = []
    for i in range(N_CHEST):
        ang = (i / float(N_CHEST)) * 2.0 * math.pi
        vx = CX + math.cos(ang) * 0.145
        vy = CY + math.sin(ang) * 0.118
        vz = 0.88
        v = bm.verts.new(mathutils.Vector((vx, vy, vz)))
        chest.append(v)
        w_chest.append((v, {'Spine01': 0.85, 'Spine': 0.15}))
        
    # 3. Left & Right Armholes (8 vertices each at X = +/- 0.12m)
    # Left armhole centered at (0.125, CY, 0.93)
    # Right armhole centered at (-0.115, CY, 0.93)
    N_ARM = 8
    armhole_l = []
    w_arm_l = []
    for i in range(N_ARM):
        ang = (i / float(N_ARM)) * 2.0 * math.pi
        vy = CY + math.cos(ang) * 0.115
        vz = 0.93 + math.sin(ang) * 0.115
        vx = 0.130
        v = bm.verts.new(mathutils.Vector((vx, vy, vz)))
        armhole_l.append(v)
        w_arm_l.append((v, {'Spine01': 0.3, 'LeftShoulder': 0.7}))
        
    armhole_r = []
    w_arm_r = []
    for i in range(N_ARM):
        ang = (i / float(N_ARM)) * 2.0 * math.pi
        vy = CY + math.cos(ang) * 0.115
        vz = 0.93 + math.sin(ang) * 0.115
        vx = -0.120
        v = bm.verts.new(mathutils.Vector((vx, vy, vz)))
        armhole_r.append(v)
        w_arm_r.append((v, {'Spine01': 0.3, 'RightShoulder': 0.7}))
        
    print(f'Created {len(collar)} collar, {len(chest)} chest, {len(armhole_l)} armhole_l, {len(armhole_r)} armhole_r verts')
    bm.free()

test_closed_tunic()
