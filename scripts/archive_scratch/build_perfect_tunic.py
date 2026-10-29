import bpy, bmesh, mathutils, math, os

arm = bpy.data.objects['Armature']
col_clothes = bpy.data.collections.get('Clothes') or bpy.context.scene.collection
CX = 0.007

# Remove existing tunic
old_tunic = bpy.data.objects.get('Modular_Adventurer_Tunic')
if old_tunic:
    bpy.data.objects.remove(old_tunic, do_unlink=True)

bm_t = bmesh.new()
N_CIRC = 24

torso_profiles = [
    # (z, cy, rx, ry, w_head, w_sp01, w_sp, w_hips)
    (0.98, 1.280, 0.082, 0.088, 0.40, 0.60, 0.00, 0.00), # Collar rim (snug around neck)
    (0.95, 1.276, 0.105, 0.105, 0.20, 0.80, 0.00, 0.00), # Collar stand
    (0.92, 1.268, 0.145, 0.125, 0.00, 1.00, 0.00, 0.00), # Broad shoulders / upper chest
    (0.86, 1.256, 0.148, 0.120, 0.00, 0.80, 0.20, 0.00), # Mid chest
    (0.78, 1.244, 0.138, 0.110, 0.00, 0.35, 0.65, 0.00), # Lower ribcage
    (0.70, 1.252, 0.132, 0.108, 0.00, 0.10, 0.80, 0.10), # Waist
    (0.64, 1.256, 0.136, 0.112, 0.00, 0.00, 0.40, 0.60), # Belt line
    (0.58, 1.256, 0.165, 0.130, 0.00, 0.00, 0.15, 0.85), # Flared skirt upper
    (0.52, 1.252, 0.195, 0.150, 0.00, 0.00, 0.05, 0.95), # Flared skirt mid
    (0.46, 1.250, 0.225, 0.175, 0.00, 0.00, 0.00, 1.00), # Flared skirt hem
]

t_rings = []
t_weights = []
t_faces = []

for z, cy, rx, ry, whead, wsp01, wsp, whip in torso_profiles:
    ring = []
    v_coord = (z - 0.46) / (0.98 - 0.46)

    for i in range(N_CIRC):
        # ang = pi/2 is front center
        ang = (math.pi / 2.0) - (i / float(N_CIRC)) * 2.0 * math.pi
        vx = CX + math.cos(ang) * rx
        vy = cy + math.sin(ang) * ry
        vz = z
        v = bm_t.verts.new(mathutils.Vector((vx, vy, vz)))

        u_coord = (i / float(N_CIRC)) * 0.65

        # Kinematic Skirt Sway
        w_left_leg = 0.0
        w_right_leg = 0.0
        cur_whip = whip
        if z <= 0.52 and vy < cy:
            if vx > CX + 0.02:
                w_left_leg = 0.30 * (1.0 - (z - 0.46) / 0.08)
                cur_whip -= w_left_leg
            elif vx < CX - 0.02:
                w_right_leg = 0.30 * (1.0 - (z - 0.46) / 0.08)
                cur_whip -= w_right_leg

        weights = {
            'Head': whead,
            'Spine01': wsp01,
            'Spine': wsp,
            'Hips': cur_whip,
            'LeftUpLeg': w_left_leg,
            'RightUpLeg': w_right_leg
        }
        ring.append((v, u_coord, v_coord))
        t_weights.append((v, weights))
    t_rings.append(ring)

for r in range(len(t_rings) - 1):
    r0 = t_rings[r]
    r1 = t_rings[r + 1]
    for i in range(N_CIRC):
        i_next = (i + 1) % N_CIRC
        f = bm_t.faces.new([r0[i][0], r0[i_next][0], r1[i_next][0], r1[i][0]])
        
        u0 = r0[i][1]
        u1 = r0[i_next][1] if i_next != 0 else 0.65
        v0 = r0[i][2]
        v1 = r1[i][2]
        uvs = [(u0, v0), (u1, v0), (u1, v1), (u0, v1)]
        t_faces.append((f, uvs))

# SLEEVES: seamless bridge into shoulder and down to meet forearm
N_SLEEVE = 16
sleeve_steps = [
    # (u_offset, radius, wsp01, wsh, warm)
    (-0.02, 0.105, 0.40, 0.50, 0.10), # Deep inside shoulder
    (0.03, 0.115, 0.20, 0.50, 0.30),  # Puff apex
    (0.09, 0.112, 0.05, 0.35, 0.60),  # Mid bicep
    (0.15, 0.100, 0.00, 0.10, 0.90),  # Lower bicep
    (0.20, 0.090, 0.00, 0.00, 1.00),  # Cuff meeting forearm
]

def build_sleeve(bm, is_left):
    sign = 1.0 if is_left else -1.0
    sh_bone = 'LeftShoulder' if is_left else 'RightShoulder'
    arm_bone = 'LeftArm' if is_left else 'RightArm'
    sh_cx = 0.110 if is_left else -0.096
    sh_cy = 1.270
    sh_cz = 0.950

    v_base = 0.52 if is_left else 0.04
    v_span = 0.44

    s_rings = []
    for s_idx, (u, r, wsp, wsh, warm) in enumerate(sleeve_steps):
        ring = []
        cx = sh_cx + sign * u
        cy = sh_cy
        cz = sh_cz - (u * 0.05)
        v_coord = v_base + (s_idx / float(len(sleeve_steps) - 1)) * v_span

        for i in range(N_SLEEVE):
            ang = (i / float(N_SLEEVE)) * 2.0 * math.pi
            vy = cy + math.cos(ang) * r
            vz = cz + math.sin(ang) * r
            vx = cx
            v = bm.verts.new(mathutils.Vector((vx, vy, vz)))
            u_coord = 0.69 + (i / float(N_SLEEVE)) * 0.30
            ring.append((v, u_coord, v_coord))
            t_weights.append((v, {'Spine01': wsp, sh_bone: wsh, arm_bone: warm}))
        s_rings.append(ring)

    s_faces = []
    for r_idx in range(len(s_rings) - 1):
        r0 = s_rings[r_idx]
        r1 = s_rings[r_idx + 1]
        for i in range(N_SLEEVE):
            i_next = (i + 1) % N_SLEEVE
            f = bm.faces.new([r0[i][0], r0[i_next][0], r1[i_next][0], r1[i][0]])
            u0 = r0[i][1]
            u1 = r0[i_next][1] if i_next != 0 else 0.99
            v0 = r0[i][2]
            v1 = r1[i][2]
            uvs = [(u0, v0), (u1, v0), (u1, v1), (u0, v1)]
            s_faces.append((f, uvs))
    return s_rings, s_faces

s_l_rings, s_l_faces = build_sleeve(bm_t, True)
s_r_rings, s_r_faces = build_sleeve(bm_t, False)

bm_t.verts.index_update()
bm_t.verts.ensure_lookup_table()
tunic_v_weights = [(v.index, w) for v, w in t_weights]

uv_layer_t = bm_t.loops.layers.uv.new('UVMap')
for f, uvs in (t_faces + s_l_faces + s_r_faces):
    for loop, uv in zip(f.loops, uvs):
        loop[uv_layer_t].uv = uv

mesh_tunic = bpy.data.meshes.new('Modular_Adventurer_Tunic_Mesh')
bm_t.to_mesh(mesh_tunic)
bm_t.free()

obj_tunic = bpy.data.objects.new('Modular_Adventurer_Tunic', mesh_tunic)
col_clothes.objects.link(obj_tunic)
obj_tunic.parent = arm
obj_tunic.parent_type = 'OBJECT'
obj_tunic.matrix_world = mathutils.Matrix.Identity(4)

mod_t = obj_tunic.modifiers.new('Armature', 'ARMATURE')
mod_t.object = arm

for b in ['Head', 'Spine01', 'Spine', 'Hips', 'LeftUpLeg', 'RightUpLeg', 
          'LeftShoulder', 'LeftArm', 'RightShoulder', 'RightArm']:
    obj_tunic.vertex_groups.new(name=b)
for v_idx, weights in tunic_v_weights:
    for b_name, weight in weights.items():
        if weight > 0.001:
            obj_tunic.vertex_groups[b_name].add([v_idx], weight, 'REPLACE')

mat_tunic = bpy.data.materials.get('M_Adventurer_Tunic')
if mat_tunic:
    obj_tunic.data.materials.append(mat_tunic)

for p in obj_tunic.data.polygons: p.use_smooth = True

# Update mannequin mask:
# Keep biceps (15, 42) visible because the new longer, wider sleeves house them cleanly!
# Also keep forearms, shins/calves, head & neck
man = bpy.data.objects['Mannequin']
mw_man = man.matrix_world
bm_man = bmesh.new()
bm_man.from_mesh(man.data)

visited = set()
islands = []
for v in bm_man.verts:
    if v in visited: continue
    island = []
    queue = [v]
    visited.add(v)
    while queue:
        curr = queue.pop()
        island.append(curr)
        for e in curr.link_edges:
            other = e.other_vert(curr)
            if other not in visited:
                visited.add(other)
                queue.append(other)
    islands.append(island)

grp_vis = man.vertex_groups['Body_Visible']
for v in man.data.vertices: grp_vis.add([v.index], 0.0, 'REPLACE')

for idx, island in enumerate(islands):
    zs = [(mw_man @ v.co).z for v in island]
    xs = [(mw_man @ v.co).x for v in island]
    z_min, z_max = min(zs), max(zs)
    dx_max = max(abs(x - CX) for x in xs)
    
    # 1. Head & Neck:
    is_head_neck = (z_max >= 0.88 and dx_max <= 0.16 and idx not in [14, 41])
    
    # 2. Arms (forearm, hand, and bicep now cleanly inside sleeve):
    is_arm_part = (dx_max > 0.28 and z_min >= 0.85 and idx not in [14, 41])
    
    # 3. Lower Leg (Shin / Calf):
    is_shin_calf = (z_min >= 0.07 and z_max <= 0.42 and 0.02 < dx_max < 0.16 and idx not in [5, 40])
    
    if is_head_neck or is_arm_part or is_shin_calf:
        vert_indices = [v.index for v in island]
        grp_vis.add(vert_indices, 1.0, 'REPLACE')

bpy.ops.wm.save_as_mainfile(filepath='mannequin_chibi_basic_rigTest4.blend')
print("Successfully built perfected watertight tunic and island mask!")
