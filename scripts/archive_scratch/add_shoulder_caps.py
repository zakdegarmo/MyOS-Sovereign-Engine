import bpy, bmesh, mathutils, math

arm = bpy.data.objects['Armature']
tunic = bpy.data.objects['Modular_Adventurer_Tunic']

# Let's inspect tunic vertices near the shoulder
bm = bmesh.new()
bm.from_mesh(tunic.data)

print(f'Tunic vertex count: {len(bm.verts)}')
shoulder_verts_l = [v for v in bm.verts if v.co.x > 0.06 and v.co.z > 0.90]
shoulder_verts_r = [v for v in bm.verts if v.co.x < -0.05 and v.co.z > 0.90]
print(f'Left shoulder verts: {len(shoulder_verts_l)}')
print(f'Right shoulder verts: {len(shoulder_verts_r)}')

# Add shoulder mantle quads to bridge over the shoulder balls
# Left shoulder ball apex is at (0.147, 1.271, 1.020)
# Right shoulder ball apex is at (-0.133, 1.271, 1.020)

def add_shoulder_cap(bm, is_left):
    sign = 1.0 if is_left else -1.0
    sh_bone = 'LeftShoulder' if is_left else 'RightShoulder'
    arm_bone = 'LeftArm' if is_left else 'RightArm'
    
    # Grid of 4x3 quads curving over the shoulder ball
    # u spans from neck (X=0.07) to outer sleeve (X=0.20)
    # v spans from front chest (Y=1.16) to back (Y=1.34)
    grid = []
    w_list = []
    
    u_steps = [0.06, 0.10, 0.15, 0.20]
    v_steps = [1.16, 1.22, 1.28, 1.34]
    
    for u in u_steps:
        row = []
        x = sign * u
        w_arm = max(0.0, (u - 0.10) / 0.10) * 0.7
        w_sh = 1.0 - w_arm
        for y in v_steps:
            # Dome height over shoulder ball
            # Apex at u=0.14, y=1.26, z=1.035
            du = (u - 0.14) / 0.08
            dy = (y - 1.26) / 0.08
            dist_sq = du*du + dy*dy
            z = 1.035 - (0.045 * dist_sq)
            if z < 0.94: z = 0.94
            
            v = bm.verts.new(mathutils.Vector((x, y, z)))
            row.append(v)
            w_list.append((v, {'Spine1': 0.2 if u < 0.10 else 0.0, sh_bone: w_sh, arm_bone: w_arm}))
        grid.append(row)
        
    for i in range(len(u_steps) - 1):
        for j in range(len(v_steps) - 1):
            bm.faces.new([
                grid[i][j],
                grid[i+1][j],
                grid[i+1][j+1],
                grid[i][j+1]
            ])
    return w_list

w_l = add_shoulder_cap(bm, True)
w_r = add_shoulder_cap(bm, False)

bm.verts.index_update()
bm.verts.ensure_lookup_table()

new_w = [(v.index, w) for v, w in w_l + w_r]

bm.to_mesh(tunic.data)
bm.free()

for v_idx, weights in new_w:
    for b_name, weight in weights.items():
        if weight > 0.001:
            if b_name not in tunic.vertex_groups:
                tunic.vertex_groups.new(name=b_name)
            tunic.vertex_groups[b_name].add([v_idx], weight, 'REPLACE')

bpy.ops.wm.save_as_mainfile(filepath='mannequin_chibi_basic_rigTest3.blend')
print('SUCCESS: Added shoulder caps!')
