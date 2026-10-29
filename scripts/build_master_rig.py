import bpy
import numpy as np
import math
from mathutils import Vector

def dist_to_segment(p, a, b):
    ab = b - a
    ap = p - a
    ab_len_sq = ab.length_squared
    if ab_len_sq == 0.0:
        return (p - a).length
    t = max(0.0, min(1.0, ap.dot(ab) / ab_len_sq))
    proj = a + t * ab
    return (p - proj).length

def build_rig(filepath):
    # Open file
    bpy.ops.wm.open_mainfile(filepath=filepath)
    
    # 1. Clean up old armatures
    for o in list(bpy.data.objects):
        if o.type == 'ARMATURE':
            bpy.data.objects.remove(o, do_unlink=True)

    # 2. Get Mannequin mesh
    m = bpy.data.objects.get('Mannequin')
    if not m:
        raise ValueError("Mannequin object not found in blend file!")

    bpy.ops.object.select_all(action='DESELECT')
    bpy.context.view_layer.objects.active = m
    m.select_set(True)

    # Remove old modifiers and vertex groups
    for mod in list(m.modifiers):
        m.modifiers.remove(mod)
    m.vertex_groups.clear()

    # Bake matrix_world into vertex coordinates and center at (0, 0, 0)
    coords = np.array([list(m.matrix_world @ v.co) for v in m.data.vertices])
    mid_x = (coords[:,0].min() + coords[:,0].max()) / 2.0
    mid_y = (coords[:,1].min() + coords[:,1].max()) / 2.0
    min_z = coords[:,2].min()

    for v in m.data.vertices:
        w = m.matrix_world @ v.co
        v.co.x = w.x - mid_x
        v.co.y = w.y - mid_y
        v.co.z = w.z - min_z

    m.location = (0, 0, 0)
    m.rotation_euler = (0, 0, 0)
    m.scale = (1, 1, 1)
    m.data.update()

    # 3. Create Master Armature
    arm_data = bpy.data.armatures.new('MasterArmature')
    arm_obj = bpy.data.objects.new('Armature', arm_data)
    bpy.context.collection.objects.link(arm_obj)
    
    bpy.ops.object.select_all(action='DESELECT')
    bpy.context.view_layer.objects.active = arm_obj
    arm_obj.select_set(True)
    
    arm_data.display_type = 'OCTAHEDRAL'
    arm_obj.show_in_front = True

    bpy.ops.object.mode_set(mode='EDIT')
    eb = arm_data.edit_bones

    # --- Hierarchy ---
    # Root (Master control at floor, non-deforming)
    b_root = eb.new('root')
    b_root.head = (0, 0, 0)
    b_root.tail = (0, 0.12, 0)
    b_root.use_deform = False

    # Pelvis / Hips (Dantian)
    b_pelvis = eb.new('pelvis')
    b_pelvis.head = (0, 0, 0.58)
    b_pelvis.tail = (0, 0, 0.68)
    b_pelvis.parent = b_root

    # Spine
    b_spine = eb.new('spine')
    b_spine.head = (0, 0, 0.68)
    b_spine.tail = (0, 0, 0.80)
    b_spine.parent = b_pelvis

    # Chest
    b_chest = eb.new('chest')
    b_chest.head = (0, 0, 0.80)
    b_chest.tail = (0, 0, 0.94)
    b_chest.parent = b_spine

    # Neck
    b_neck = eb.new('neck')
    b_neck.head = (0, 0, 0.94)
    b_neck.tail = (0, 0, 1.02)
    b_neck.parent = b_chest

    # Head
    b_head = eb.new('head')
    b_head.head = (0, 0, 1.02)
    b_head.tail = (0, 0, 1.28)
    b_head.parent = b_neck

    def create_limbs(side_name, sign):
        # Shoulder
        sh = eb.new(f'shoulder.{side_name}')
        sh.head = (sign * 0.04, 0, 0.94)
        sh.tail = (sign * 0.14, 0, 0.98)
        sh.parent = b_chest

        # Upper Arm
        ua = eb.new(f'upper_arm.{side_name}')
        ua.head = (sign * 0.14, 0, 0.98)
        ua.tail = (sign * 0.34, 0.015, 0.98)
        ua.parent = sh

        # Forearm
        fa = eb.new(f'forearm.{side_name}')
        fa.head = (sign * 0.34, 0.015, 0.98)
        fa.tail = (sign * 0.50, 0, 0.98)
        fa.parent = ua

        # Hand
        hd = eb.new(f'hand.{side_name}')
        hd.head = (sign * 0.50, 0, 0.98)
        hd.tail = (sign * 0.66, 0, 0.98)
        hd.parent = fa

        # Thigh
        th = eb.new(f'thigh.{side_name}')
        th.head = (sign * 0.11, 0, 0.58)
        th.tail = (sign * 0.11, -0.015, 0.30)
        th.parent = b_pelvis

        # Shin
        sn = eb.new(f'shin.{side_name}')
        sn.head = (sign * 0.11, -0.015, 0.30)
        sn.tail = (sign * 0.11, 0, 0.08)
        sn.parent = th

        # Foot
        ft = eb.new(f'foot.{side_name}')
        ft.head = (sign * 0.11, 0, 0.08)
        ft.tail = (sign * 0.11, -0.08, 0.02)
        ft.parent = sn

        # Toe
        to = eb.new(f'toe.{side_name}')
        to.head = (sign * 0.11, -0.08, 0.02)
        to.tail = (sign * 0.11, -0.16, 0.01)
        to.parent = ft

        # IK Controls (use_deform = False)
        ik_ft = eb.new(f'IK_foot.{side_name}')
        ik_ft.head = (sign * 0.11, 0, 0.08)
        ik_ft.tail = (sign * 0.11, -0.08, 0.02)
        ik_ft.parent = b_root
        ik_ft.use_deform = False

        pk = eb.new(f'pole_knee.{side_name}')
        pk.head = (sign * 0.11, -0.45, 0.30)
        pk.tail = (sign * 0.11, -0.52, 0.30)
        pk.parent = b_root
        pk.use_deform = False

        ik_hd = eb.new(f'IK_hand.{side_name}')
        ik_hd.head = (sign * 0.50, 0, 0.98)
        ik_hd.tail = (sign * 0.66, 0, 0.98)
        ik_hd.parent = b_root
        ik_hd.use_deform = False

        pe = eb.new(f'pole_elbow.{side_name}')
        pe.head = (sign * 0.34, 0.40, 0.98)
        pe.tail = (sign * 0.34, 0.47, 0.98)
        pe.parent = b_root
        pe.use_deform = False

    create_limbs('L', 1.0)
    create_limbs('R', -1.0)

    # Cache bone segments for geometric weight skinning
    bone_segments = {}
    for b in eb:
        if b.use_deform:
            bone_segments[b.name] = (Vector(b.head), Vector(b.tail))

    bpy.ops.object.mode_set(mode='POSE')
    pb = arm_obj.pose.bones

    # Add IK Constraints with zero-twist calibrated pole angles
    for side_name, sign in [('L', 1.0), ('R', -1.0)]:
        # Shin Leg IK: -90 deg pole angle eliminates all twist in rest pose
        ik_c = pb[f'shin.{side_name}'].constraints.new('IK')
        ik_c.name = f'IK_Leg.{side_name}'
        ik_c.target = arm_obj
        ik_c.subtarget = f'IK_foot.{side_name}'
        ik_c.pole_target = arm_obj
        ik_c.pole_subtarget = f'pole_knee.{side_name}'
        ik_c.pole_angle = math.radians(-90.0)
        ik_c.chain_count = 2

        # Arm IK: L is -180 deg, R is 0 deg for zero-twist rest pose
        ik_a = pb[f'forearm.{side_name}'].constraints.new('IK')
        ik_a.name = f'IK_Arm.{side_name}'
        ik_a.target = arm_obj
        ik_a.subtarget = f'IK_hand.{side_name}'
        ik_a.pole_target = arm_obj
        ik_a.pole_subtarget = f'pole_elbow.{side_name}'
        ik_a.pole_angle = math.radians(-180.0 if side_name == 'L' else 0.0)
        ik_a.chain_count = 2

    bpy.ops.object.mode_set(mode='OBJECT')

    # 4. Bind Mesh to Armature
    m.parent = arm_obj
    mod = m.modifiers.new('Armature', 'ARMATURE')
    mod.object = arm_obj

    # Create vertex groups for all deform bones
    vgs = {bname: m.vertex_groups.new(name=bname) for bname in bone_segments.keys()}

    # Compute proximity skinning for segmented mannequin
    print("Computing precision anatomical vertex weights...")
    for v in m.data.vertices:
        p = Vector(v.co)
        weights = {}
        for bname, (head, tail) in bone_segments.items():
            if bname.endswith('.L') and p.x < -0.01:
                continue
            if bname.endswith('.R') and p.x > 0.01:
                continue
            
            d = dist_to_segment(p, head, tail)
            bone_len = (tail - head).length
            effective_d = d / max(0.05, bone_len)
            weight = 1.0 / (effective_d**4 + 1e-4)
            weights[bname] = weight

        sorted_bones = sorted(weights.items(), key=lambda kv: kv[1], reverse=True)[:3]
        total_w = sum(w for _, w in sorted_bones)
        for bname, w in sorted_bones:
            normalized_w = w / total_w
            if normalized_w > 0.01:
                vgs[bname].add([v.index], normalized_w, 'REPLACE')

    print("All vertices successfully weighted!")

    # 5. Framing Camera
    cam_target = bpy.data.objects.get('CamTarget')
    if cam_target:
        cam_target.location = (0, 0, 0.65)

    bpy.ops.wm.save_mainfile(filepath=filepath)
    print(f"Rigged file saved to {filepath}")

if __name__ == '__main__':
    build_rig('mannequin_chibi_basic_rigTest1.blend')
