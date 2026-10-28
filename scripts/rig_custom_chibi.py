import bpy
import math
import numpy as np
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

def rig_custom_chibi(blend_path):
    bpy.ops.wm.open_mainfile(filepath=blend_path)
    
    m = bpy.data.objects.get('Mannequin')
    if not m:
        raise ValueError("Mannequin not found!")

    print("Target Mesh to Rig:")
    print("  Name:", m.name)
    print("  Materials:", [mat.name for mat in m.data.materials if mat])
    print("  Vertices:", len(m.data.vertices))
    print("  Scale:", m.scale)
    print("  Location:", m.location)
    print("  Dimensions:", m.dimensions)

    # 1. Clean up old armatures
    for o in list(bpy.data.objects):
        if o.type == 'ARMATURE':
            bpy.data.objects.remove(o, do_unlink=True)

    # 2. Get mesh vertex world coordinates (DO NOT TOUCH OR MODIFY MESH)
    mw = m.matrix_world
    pts = [mw @ v.co for v in m.data.vertices]
    xs = [p.x for p in pts]; ys = [p.y for p in pts]; zs = [p.z for p in pts]
    
    mid_x = (min(xs) + max(xs)) / 2.0
    mid_y = (min(ys) + max(ys)) / 2.0
    min_z = min(zs)
    max_z = max(zs)
    print(f"Mesh World Bounds: X[{min(xs):.3f}..{max(xs):.3f}], Y[{min(ys):.3f}..{max(ys):.3f}], Z[{min_z:.3f}..{max_z:.3f}]")
    print(f"Center X={mid_x:.3f}, Center Y={mid_y:.3f}, Height={max_z-min_z:.3f}m")

    # 3. Create Armature object in world space (0,0,0) scale (1,1,1)
    arm_data = bpy.data.armatures.new('ChibiArmature')
    arm_obj = bpy.data.objects.new('Armature', arm_data)
    bpy.context.collection.objects.link(arm_obj)
    
    bpy.context.view_layer.objects.active = arm_obj
    arm_obj.select_set(True)
    arm_data.display_type = 'OCTAHEDRAL'
    arm_obj.show_in_front = True

    bpy.ops.object.mode_set(mode='EDIT')
    eb = arm_data.edit_bones

    # Build bones matching the exact chibi anatomy:
    # Hips / Pelvis
    b_hips = eb.new('Hips')
    b_hips.head = (mid_x, mid_y, min_z + 0.58)
    b_hips.tail = (mid_x, mid_y, min_z + 0.68)

    # Spine
    b_spine = eb.new('Spine')
    b_spine.head = (mid_x, mid_y, min_z + 0.68)
    b_spine.tail = (mid_x, mid_y, min_z + 0.78)
    b_spine.parent = b_hips

    # Spine01 (Chest)
    b_spine1 = eb.new('Spine01')
    b_spine1.head = (mid_x, mid_y, min_z + 0.78)
    b_spine1.tail = (mid_x, mid_y, min_z + 0.90)
    b_spine1.parent = b_spine

    # Neck
    b_neck = eb.new('neck')
    b_neck.head = (mid_x, mid_y, min_z + 0.90)
    b_neck.tail = (mid_x, mid_y, min_z + 0.98)
    b_neck.parent = b_spine1

    # Head (Big chibi head!)
    b_head = eb.new('Head')
    b_head.head = (mid_x, mid_y, min_z + 0.98)
    b_head.tail = (mid_x, mid_y, max_z)
    b_head.parent = b_neck

    def build_limbs(prefix, sign):
        # Shoulder / Clavicle
        sh = eb.new(f'{prefix}Shoulder')
        sh.head = (mid_x + sign * 0.04, mid_y, min_z + 0.94)
        sh.tail = (mid_x + sign * 0.14, mid_y + 0.03, min_z + 0.98)
        sh.parent = b_spine1

        # Upper Arm
        ua = eb.new(f'{prefix}Arm')
        ua.head = (mid_x + sign * 0.14, mid_y + 0.03, min_z + 0.98)
        ua.tail = (mid_x + sign * 0.34, mid_y + 0.05, min_z + 0.98)
        ua.parent = sh

        # Forearm
        fa = eb.new(f'{prefix}ForeArm')
        fa.head = (mid_x + sign * 0.34, mid_y + 0.05, min_z + 0.98)
        fa.tail = (mid_x + sign * 0.50, mid_y + 0.05, min_z + 0.98)
        fa.parent = ua

        # Hand
        hd = eb.new(f'{prefix}Hand')
        hd.head = (mid_x + sign * 0.50, mid_y + 0.05, min_z + 0.98)
        hd.tail = (mid_x + sign * 0.65, mid_y + 0.05, min_z + 0.98)
        hd.parent = fa

        # Leg
        th = eb.new(f'{prefix}UpLeg')
        th.head = (mid_x + sign * 0.11, mid_y, min_z + 0.58)
        th.tail = (mid_x + sign * 0.11, mid_y + 0.01, min_z + 0.35)
        th.parent = b_hips

        # Shin
        sn = eb.new(f'{prefix}Leg')
        sn.head = (mid_x + sign * 0.11, mid_y + 0.01, min_z + 0.35)
        sn.tail = (mid_x + sign * 0.11, mid_y + 0.02, min_z + 0.08)
        sn.parent = th

        # Foot
        ft = eb.new(f'{prefix}Foot')
        ft.head = (mid_x + sign * 0.11, mid_y + 0.02, min_z + 0.08)
        ft.tail = (mid_x + sign * 0.11, mid_y - 0.06, min_z + 0.02)
        ft.parent = sn

        # ToeBase
        to = eb.new(f'{prefix}ToeBase')
        to.head = (mid_x + sign * 0.11, mid_y - 0.06, min_z + 0.02)
        to.tail = (mid_x + sign * 0.11, mid_y - 0.14, min_z + 0.01)
        to.parent = ft

    build_limbs('Left', 1.0)
    build_limbs('Right', -1.0)

    # Cache bone segments
    bone_segments = {b.name: (Vector(b.head), Vector(b.tail)) for b in eb}

    bpy.ops.object.mode_set(mode='OBJECT')

    # 4. Bind Mannequin to Armature (WITHOUT CHANGING MESH SCORDS/TRANSFORMS)
    for mod in list(m.modifiers):
        m.modifiers.remove(mod)

    m.parent = arm_obj
    # Ensure matrix_parent_inverse accounts for mesh existing transform
    m.matrix_parent_inverse = arm_obj.matrix_world.inverted()

    mod = m.modifiers.new('Armature', 'ARMATURE')
    mod.object = arm_obj

    # 5. Clear old vertex groups and assign precision weights to every bone
    m.vertex_groups.clear()
    vgs = {bname: m.vertex_groups.new(name=bname) for bname in bone_segments.keys()}

    print("Skinning all vertices to exact chibi bones...")
    for v in m.data.vertices:
        p = mw @ v.co
        weights = {}
        for bname, (head, tail) in bone_segments.items():
            if bname.startswith('Left') and (p.x - mid_x) < -0.01:
                continue
            if bname.startswith('Right') and (p.x - mid_x) > 0.01:
                continue
            
            d = dist_to_segment(p, head, tail)
            bone_len = (tail - head).length
            effective_d = d / max(0.04, bone_len)
            weight = 1.0 / (effective_d**4 + 1e-4)
            weights[bname] = weight

        sorted_bones = sorted(weights.items(), key=lambda kv: kv[1], reverse=True)[:3]
        total_w = sum(w for _, w in sorted_bones)
        for bname, w in sorted_bones:
            normalized_w = w / total_w
            if normalized_w > 0.01:
                vgs[bname].add([v.index], normalized_w, 'REPLACE')

    print("Precision skinning complete!")

    # Verify mesh is completely unchanged
    print("POST-RIG VERIFICATION:")
    print("  Mesh dimensions:", m.dimensions)
    print("  Mesh scale:", m.scale)
    print("  Mesh location:", m.location)
    print("  Materials:", [mat.name for mat in m.data.materials if mat])

    # Render verification frame
    scene = bpy.context.scene
    scene.render.filepath = r'c:\Users\zakde\Desktop\AntiGravity projects\MyOS\chibi_rigged_verified.png'
    bpy.ops.render.render(write_still=True)

    bpy.ops.wm.save_mainfile(filepath=blend_path)
    print(f"Rigged file saved to {blend_path}!")

if __name__ == '__main__':
    rig_custom_chibi(r'c:\Users\zakde\Desktop\AntiGravity projects\MyOS\mannequin_chibi_basic_rigTest1.blend')
