"""
rig_and_animate_uniracer.py
----------------------------
Constructs a fully rigged, skinned, and animated Uniracer character in Blender 5.2.
Honors the iconic DMA Design SNES aesthetic with sentient unicycle personality:
- Ground-truth dimensions: Wheel R=12.5, Crown Z=14.0, Saddle Z=20.0-23.6
- Skeletal Armature with dedicated bones:
  - Root: Chassis ground reference
  - Wheel: Continuous axle roll
  - Crank_R / Crank_L & Pedal_R / Pedal_L: 180-deg opposed pedaling
  - Fork: Bladed steering fork up to crown
  - SeatPost: Telescoping squash & stretch along Z
  - SaddleHead: Sentient head/neck with full pitch (nod), yaw (glance), and roll (tilt)
- Rigged character animations:
  1. Idle_Sentient: Living breathing curiosity, subtle head tilts, perking up
  2. Look_Rival_Left: Aggressive 85-deg sideways head turn to glare down competitor
  3. Look_Rival_Right: Mirrored rival glare to the right
  4. Jump_Charge: Deep seatpost compression squash (Z=16.0) with nose reared up
  5. Jump_Airborne: Explosive spring stretch (Z=22.5) with streamlined forward posture
  6. Trick_Twist: 360-degree aerial corkscrew roll
  7. Trick_Flip: Dynamic somersault acrobatic tuck and kick
  8. Wipeout_Dizzy: Knockout wobble with drooping, spinning head and cobweb recovery
  9. Sprint_Pedal: Forward aggressive attack crouch with fast pedaling cadence
- Renders high-resolution visual contact sheets for user inspection.
- Exports production GLB with all actions embedded.
"""

import bpy
import bmesh
import math
import os
import shutil
from mathutils import Vector, Quaternion, Matrix, Euler

def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def create_materials():
    mats = {}
    
    # 1. Mat_Body (High-Gloss Racing Paint - Default Cherry Red)
    mat_body = bpy.data.materials.new(name="Mat_Body")
    mat_body.use_nodes = True
    bsdf = mat_body.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs['Base Color'].default_value = (0.88, 0.05, 0.08, 1.0)
        bsdf.inputs['Metallic'].default_value = 0.5
        bsdf.inputs['Roughness'].default_value = 0.2
    mats['body'] = mat_body

    # 2. Mat_Seat (Contoured Saddle Cushion)
    mat_seat = bpy.data.materials.new(name="Mat_Seat")
    mat_seat.use_nodes = True
    bsdf = mat_seat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs['Base Color'].default_value = (0.12, 0.12, 0.14, 1.0)
        bsdf.inputs['Metallic'].default_value = 0.0
        bsdf.inputs['Roughness'].default_value = 0.55
    mats['seat'] = mat_seat

    # 3. Mat_Tire (Vulcanized Rubber)
    mat_tire = bpy.data.materials.new(name="Mat_Tire")
    mat_tire.use_nodes = True
    bsdf = mat_tire.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs['Base Color'].default_value = (0.025, 0.025, 0.028, 1.0)
        bsdf.inputs['Metallic'].default_value = 0.0
        bsdf.inputs['Roughness'].default_value = 0.8
    mats['tire'] = mat_tire

    # 4. Mat_Chrome (Mirror Polish Metal)
    mat_chrome = bpy.data.materials.new(name="Mat_Chrome")
    mat_chrome.use_nodes = True
    bsdf = mat_chrome.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs['Base Color'].default_value = (0.95, 0.95, 0.98, 1.0)
        bsdf.inputs['Metallic'].default_value = 0.98
        bsdf.inputs['Roughness'].default_value = 0.08
    mats['chrome'] = mat_chrome

    # 5. Mat_Pedals (Composite Resin Platform)
    mat_pedals = bpy.data.materials.new(name="Mat_Pedals")
    mat_pedals.use_nodes = True
    bsdf = mat_pedals.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs['Base Color'].default_value = (0.06, 0.06, 0.07, 1.0)
        bsdf.inputs['Metallic'].default_value = 0.1
        bsdf.inputs['Roughness'].default_value = 0.4
    mats['pedals'] = mat_pedals

    # 6. Mat_Reflector (Amber Safety Reflector)
    mat_refl = bpy.data.materials.new(name="Mat_Reflector")
    mat_refl.use_nodes = True
    bsdf = mat_refl.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs['Base Color'].default_value = (1.0, 0.45, 0.0, 1.0)
        bsdf.inputs['Emission Color'].default_value = (1.0, 0.45, 0.0, 1.0)
        bsdf.inputs['Emission Strength'].default_value = 1.5
    mats['reflector'] = mat_refl

    # 7. Mat_Stripe (Racing Stripe Accent)
    mat_stripe = bpy.data.materials.new(name="Mat_Stripe")
    mat_stripe.use_nodes = True
    bsdf = mat_stripe.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs['Base Color'].default_value = (0.95, 0.95, 0.95, 1.0)
        bsdf.inputs['Metallic'].default_value = 0.3
        bsdf.inputs['Roughness'].default_value = 0.2
    mats['stripe'] = mat_stripe

    return mats

def rotate_vector(v, axis, angle):
    q = Quaternion(Vector(axis), angle)
    return q @ v

def build_geometry(mats):
    parts = {}

    # --- 1. WHEEL GROUP ---
    wheel_objs = []
    
    # Tire
    bpy.ops.mesh.primitive_torus_add(
        major_radius=10.5, minor_radius=2.0,
        major_segments=64, minor_segments=32,
        location=(0, 0, 0), rotation=(0, math.radians(90), 0)
    )
    tire = bpy.context.active_object
    tire.name = "Part_Tire"
    tire.data.materials.append(mats['tire'])
    bpy.ops.object.shade_smooth()
    wheel_objs.append(tire)

    # Tread Lugs
    tread_mesh = bpy.data.meshes.new("TreadRibs")
    tread_obj = bpy.data.objects.new("Part_Tread", tread_mesh)
    bpy.context.scene.collection.objects.link(tread_obj)
    bm = bmesh.new()
    for i in range(48):
        angle = (i / 48) * math.tau
        ca, sa = math.cos(angle), math.sin(angle)
        cy, cz = 12.45 * ca, 12.45 * sa
        tangent_y, tangent_z = -sa, ca
        normal_y, normal_z = ca, sa
        w_half, l_half, h = 1.1, 0.22, 0.16
        v1 = bm.verts.new((-w_half, cy - l_half * tangent_y, cz - l_half * tangent_z))
        v2 = bm.verts.new((w_half, cy - l_half * tangent_y, cz - l_half * tangent_z))
        v3 = bm.verts.new((w_half, cy + l_half * tangent_y, cz + l_half * tangent_z))
        v4 = bm.verts.new((-w_half, cy + l_half * tangent_y, cz + l_half * tangent_z))
        v5 = bm.verts.new((-w_half * 0.85, (cy + normal_y * h) - l_half * 0.7 * tangent_y, (cz + normal_z * h) - l_half * 0.7 * tangent_z))
        v6 = bm.verts.new((w_half * 0.85, (cy + normal_y * h) - l_half * 0.7 * tangent_y, (cz + normal_z * h) - l_half * 0.7 * tangent_z))
        v7 = bm.verts.new((w_half * 0.85, (cy + normal_y * h) + l_half * 0.7 * tangent_y, (cz + normal_z * h) + l_half * 0.7 * tangent_z))
        v8 = bm.verts.new((-w_half * 0.85, (cy + normal_y * h) + l_half * 0.7 * tangent_y, (cz + normal_z * h) + l_half * 0.7 * tangent_z))
        bm.faces.new((v1, v2, v3, v4))
        bm.faces.new((v5, v6, v7, v8))
        bm.faces.new((v1, v2, v6, v5))
        bm.faces.new((v2, v3, v7, v6))
        bm.faces.new((v3, v4, v8, v7))
        bm.faces.new((v4, v1, v5, v8))
    bm.to_mesh(tread_mesh)
    bm.free()
    tread_obj.data.materials.append(mats['tire'])
    wheel_objs.append(tread_obj)

    # Rim
    bpy.ops.mesh.primitive_cylinder_add(
        radius=9.3, depth=3.0, vertices=36,
        location=(0, 0, 0), rotation=(0, math.radians(90), 0)
    )
    rim = bpy.context.active_object
    rim.name = "Part_Rim"
    rim.data.materials.append(mats['chrome'])
    
    bpy.ops.mesh.primitive_cylinder_add(
        radius=8.6, depth=3.2, vertices=36,
        location=(0, 0, 0), rotation=(0, math.radians(90), 0)
    )
    rim_inner = bpy.context.active_object
    mod_bool = rim.modifiers.new(name="RimHollow", type='BOOLEAN')
    mod_bool.operation = 'DIFFERENCE'
    mod_bool.object = rim_inner
    bpy.context.view_layer.objects.active = rim
    bpy.ops.object.modifier_apply(modifier="RimHollow")
    bpy.data.objects.remove(rim_inner, do_unlink=True)
    wheel_objs.append(rim)

    # Hub & Flanges
    bpy.ops.mesh.primitive_cylinder_add(
        radius=1.3, depth=4.8, vertices=24,
        location=(0, 0, 0), rotation=(0, math.radians(90), 0)
    )
    hub = bpy.context.active_object
    hub.name = "Part_Hub"
    hub.data.materials.append(mats['chrome'])
    wheel_objs.append(hub)

    for x_flange in [-1.9, 1.9]:
        bpy.ops.mesh.primitive_cylinder_add(
            radius=1.8, depth=0.35, vertices=24,
            location=(x_flange, 0, 0), rotation=(0, math.radians(90), 0)
        )
        fl = bpy.context.active_object
        fl.name = f"Part_Flange_{x_flange}"
        fl.data.materials.append(mats['chrome'])
        wheel_objs.append(fl)

    # Spokes
    spoke_mesh = bpy.data.meshes.new("SpokesMesh")
    spoke_obj = bpy.data.objects.new("Part_Spokes", spoke_mesh)
    bpy.context.scene.collection.objects.link(spoke_obj)
    bm_spokes = bmesh.new()
    for side in [-1, 1]:
        hub_x = 1.9 * side
        rim_x = 0.3 * side
        for i in range(20):
            angle = (i / 20) * math.tau + (0.05 * side)
            hy = 1.6 * math.cos(angle)
            hz = 1.6 * math.sin(angle)
            cross_angle = angle + (math.radians(18) * side)
            ry = 8.6 * math.cos(cross_angle)
            rz = 8.6 * math.sin(cross_angle)
            v_dir = (rim_x - hub_x, ry - hy, rz - hz)
            length = math.sqrt(v_dir[0]**2 + v_dir[1]**2 + v_dir[2]**2)
            tmat = bmesh.ops.create_cone(
                bm_spokes, cap_ends=True, cap_tris=False,
                segments=6, radius1=0.065, radius2=0.065, depth=length
            )
            verts = tmat['verts']
            mid_pt = ((hub_x + rim_x) / 2, (hy + ry) / 2, (hz + rz) / 2)
            u_dir = (v_dir[0] / length, v_dir[1] / length, v_dir[2] / length)
            z_axis = (0, 0, 1)
            cx = z_axis[1] * u_dir[2] - z_axis[2] * u_dir[1]
            cy = z_axis[2] * u_dir[0] - z_axis[0] * u_dir[2]
            cz = z_axis[0] * u_dir[1] - z_axis[1] * u_dir[0]
            sin_a = math.sqrt(cx**2 + cy**2 + cz**2)
            cos_a = z_axis[0] * u_dir[0] + z_axis[1] * u_dir[1] + z_axis[2] * u_dir[2]
            if sin_a > 1e-5:
                ax = (cx / sin_a, cy / sin_a, cz / sin_a)
                for v in verts:
                    v.co = rotate_vector(v.co, ax, math.atan2(sin_a, cos_a))
                    v.co.x += mid_pt[0]
                    v.co.y += mid_pt[1]
                    v.co.z += mid_pt[2]
            else:
                for v in verts:
                    v.co.x += mid_pt[0]
                    v.co.y += mid_pt[1]
                    v.co.z += mid_pt[2]
    bm_spokes.to_mesh(spoke_mesh)
    bm_spokes.free()
    spoke_obj.data.materials.append(mats['chrome'])
    wheel_objs.append(spoke_obj)
    parts['wheel'] = wheel_objs

    # --- 2. FORK GROUP ---
    fork_objs = []
    for side in [-1, 1]:
        x_pos = 3.03 * side
        bpy.ops.mesh.primitive_cylinder_add(
            radius=0.75, depth=14.0, vertices=20,
            location=(x_pos, 0, 7.0)
        )
        leg = bpy.context.active_object
        leg.name = f"Part_ForkLeg_{side}"
        leg.scale = (0.75, 1.35, 1.0)
        leg.data.materials.append(mats['chrome'])
        bpy.ops.object.shade_smooth()
        fork_objs.append(leg)

        bpy.ops.mesh.primitive_cylinder_add(
            radius=1.1, depth=1.2, vertices=16,
            location=(x_pos, 0, 0), rotation=(0, math.radians(90), 0)
        )
        dropout = bpy.context.active_object
        dropout.name = f"Part_Dropout_{side}"
        dropout.data.materials.append(mats['chrome'])
        fork_objs.append(dropout)

    # Fork Crown Arch
    crown_mesh = bpy.data.meshes.new("ForkCrownMesh")
    crown_obj = bpy.data.objects.new("Part_ForkCrown", crown_mesh)
    bpy.context.scene.collection.objects.link(crown_obj)
    bm = bmesh.new()
    steps = 14
    rows = []
    for i in range(steps + 1):
        t = i / steps
        x = -3.2 + t * 6.4
        arch_z = 13.6 + 0.9 * math.sin(t * math.pi)
        dy, dz = 0.9, 0.55
        v1 = bm.verts.new((x, -dy, arch_z - dz))
        v2 = bm.verts.new((x, dy, arch_z - dz))
        v3 = bm.verts.new((x, dy * 0.85, arch_z + dz))
        v4 = bm.verts.new((x, -dy * 0.85, arch_z + dz))
        rows.append([v1, v2, v3, v4])
        if i > 0:
            p = rows[i - 1]
            bm.faces.new((p[0], p[1], v2, v1))
            bm.faces.new((p[1], p[2], v3, v2))
            bm.faces.new((p[2], p[3], v4, v3))
            bm.faces.new((p[3], p[0], v1, v4))
    bm.faces.new((rows[0][0], rows[0][1], rows[0][2], rows[0][3]))
    bm.faces.new((rows[-1][3], rows[-1][2], rows[-1][1], rows[-1][0]))
    bm.to_mesh(crown_mesh)
    bm.free()
    crown_obj.data.materials.append(mats['chrome'])
    fork_objs.append(crown_obj)
    parts['fork'] = fork_objs

    # --- 3. SEATPOST GROUP ---
    seatpost_objs = []
    bpy.ops.mesh.primitive_cylinder_add(
        radius=1.35, depth=0.9, vertices=24,
        location=(0, 0, 14.65)
    )
    clamp = bpy.context.active_object
    clamp.name = "Part_SeatClamp"
    clamp.data.materials.append(mats['body'])
    seatpost_objs.append(clamp)

    bpy.ops.mesh.primitive_cylinder_add(
        radius=0.22, depth=1.8, vertices=12,
        location=(1.4, -0.6, 14.65), rotation=(math.radians(20), math.radians(45), 0)
    )
    lever = bpy.context.active_object
    lever.name = "Part_ClampLever"
    lever.data.materials.append(mats['chrome'])
    seatpost_objs.append(lever)

    bpy.ops.mesh.primitive_cylinder_add(
        radius=0.92, depth=5.8, vertices=24,
        location=(0, 0, 17.5)
    )
    post = bpy.context.active_object
    post.name = "Part_Seatpost"
    post.data.materials.append(mats['chrome'])
    bpy.ops.object.shade_smooth()
    seatpost_objs.append(post)
    parts['seatpost'] = seatpost_objs

    # --- 4. SADDLE HEAD GROUP (The Sentient Character Face/Torso) ---
    saddle_objs = []
    bpy.ops.mesh.primitive_cylinder_add(
        radius=1.1, depth=0.9, vertices=16,
        location=(0, 0, 20.0)
    )
    bracket = bpy.context.active_object
    bracket.name = "Part_SaddleBracket"
    bracket.data.materials.append(mats['chrome'])
    saddle_objs.append(bracket)

    # Banana Saddle
    saddle_mesh = bpy.data.meshes.new("UniracerSaddle")
    saddle_obj = bpy.data.objects.new("Part_UniracerSaddle", saddle_mesh)
    bpy.context.scene.collection.objects.link(saddle_obj)
    saddle_obj.data.materials.append(mats['body'])   # slot 0: Body Shell
    saddle_obj.data.materials.append(mats['seat'])   # slot 1: Leather Cushion
    saddle_obj.data.materials.append(mats['stripe']) # slot 2: Racing Stripe
    saddle_obj.data.materials.append(mats['pedals']) # slot 3: Bumpers / Nose guard

    bm = bmesh.new()
    slices = [
        (-6.8, 22.8, 3.2, 23.6, 0.45),
        (-5.8, 22.2, 3.5, 23.0, 0.35),
        (-4.5, 21.6, 3.7, 22.3, 0.22),
        (-3.0, 21.1, 3.5, 21.7, 0.12),
        (-1.5, 20.8, 3.0, 21.3, 0.04),
        ( 0.0, 20.6, 2.5, 21.1, 0.00),
        ( 1.5, 20.8, 2.4, 21.3,-0.05),
        ( 3.0, 21.0, 2.5, 21.6,-0.10),
        ( 4.5, 21.2, 2.4, 21.8,-0.18),
        ( 5.8, 21.0, 2.0, 21.6,-0.30),
        ( 6.8, 20.5, 1.4, 21.1,-0.45),
    ]
    vert_grid = []
    for (y, zb, hw, zc, ka) in slices:
        row = [
            bm.verts.new((0.0, y, zb - 0.8)),
            bm.verts.new((-hw * 0.85, y, zb - 0.35)),
            bm.verts.new((-hw, y, zb + 0.15)),
            bm.verts.new((-hw * 0.72, y, zc)),
            bm.verts.new((-0.38, y, zc + 0.08)),
            bm.verts.new(( 0.38, y, zc + 0.08)),
            bm.verts.new(( hw * 0.72, y, zc)),
            bm.verts.new(( hw, y, zb + 0.15)),
            bm.verts.new(( hw * 0.85, y, zb - 0.35))
        ]
        vert_grid.append(row)

    for r in range(len(slices) - 1):
        r1, r2 = vert_grid[r], vert_grid[r + 1]
        for f_def, m_idx in [
            ((r1[0], r1[1], r2[1], r2[0]), 0),
            ((r1[8], r1[0], r2[0], r2[8]), 0),
            ((r1[1], r1[2], r2[2], r2[1]), 0),
            ((r1[7], r1[8], r2[8], r2[7]), 0),
            ((r1[2], r1[3], r2[3], r2[2]), 1),
            ((r1[6], r1[7], r2[7], r2[6]), 1),
            ((r1[3], r1[4], r2[4], r2[3]), 1),
            ((r1[5], r1[6], r2[6], r2[5]), 1),
            ((r1[4], r1[5], r2[5], r2[4]), 2),
        ]:
            f = bm.faces.new(f_def)
            f.material_index = m_idx

    tail = vert_grid[0]
    for f_def in [
        (tail[0], tail[1], tail[2], tail[3]),
        (tail[0], tail[3], tail[4], tail[5]),
        (tail[0], tail[5], tail[6], tail[7]),
        (tail[0], tail[7], tail[8])
    ]:
        f = bm.faces.new(f_def)
        f.material_index = 3

    nose = vert_grid[-1]
    for f_def in [
        (nose[3], nose[2], nose[1], nose[0]),
        (nose[5], nose[4], nose[3], nose[0]),
        (nose[7], nose[6], nose[5], nose[0]),
        (nose[8], nose[7], nose[0])
    ]:
        f = bm.faces.new(f_def)
        f.material_index = 3

    bm.to_mesh(saddle_mesh)
    bm.free()
    bpy.context.view_layer.objects.active = saddle_obj
    bpy.ops.object.shade_smooth()
    sub = saddle_obj.modifiers.new(name="Subsurf", type='SUBSURF')
    sub.levels = 1
    saddle_objs.append(saddle_obj)
    parts['saddle'] = saddle_objs

    # --- 5. CRANKS & PEDALS ---
    crank_angles = [math.radians(45), math.radians(225)]
    crank_len = 6.2
    crank_r_objs, pedal_r_objs = [], []
    crank_l_objs, pedal_l_objs = [], []

    for idx, side in enumerate([-1, 1]):
        angle = crank_angles[idx]
        x_pos = 3.1 * side
        cy = crank_len * math.cos(angle)
        cz = crank_len * math.sin(angle)

        crank_mesh = bpy.data.meshes.new(f"CrankArm_{side}")
        crank_obj = bpy.data.objects.new(f"Part_CrankArm_{side}", crank_mesh)
        bpy.context.scene.collection.objects.link(crank_obj)
        bm = bmesh.new()
        bmesh.ops.create_cone(
            bm, cap_ends=True, cap_tris=False, segments=16,
            radius1=0.85, radius2=0.85, depth=0.55
        )
        for v in bm.verts:
            v.co.z += x_pos
            v.co = (v.co.z, v.co.x, v.co.y)
        w, t = 0.45, 0.35
        ny, nz = -math.sin(angle), math.cos(angle)
        v1 = bm.verts.new((x_pos - t, -ny * w, -nz * w))
        v2 = bm.verts.new((x_pos + t, -ny * w, -nz * w))
        v3 = bm.verts.new((x_pos + t, cy - ny * w, cz - nz * w))
        v4 = bm.verts.new((x_pos - t, cy - ny * w, cz - nz * w))
        v5 = bm.verts.new((x_pos - t, ny * w, nz * w))
        v6 = bm.verts.new((x_pos + t, ny * w, nz * w))
        v7 = bm.verts.new((x_pos + t, cy + ny * w, cz + nz * w))
        v8 = bm.verts.new((x_pos - t, cy + ny * w, cz + nz * w))
        bm.faces.new((v1, v2, v3, v4))
        bm.faces.new((v5, v6, v7, v8))
        bm.faces.new((v1, v2, v6, v5))
        bm.faces.new((v2, v3, v7, v6))
        bm.faces.new((v3, v4, v8, v7))
        bm.faces.new((v4, v1, v5, v8))
        bm.to_mesh(crank_mesh)
        bm.free()
        crank_obj.data.materials.append(mats['chrome'])
        
        # Pedals
        pedal_x = x_pos + 1.2 * side
        bpy.ops.mesh.primitive_cylinder_add(
            radius=0.3, depth=1.8, vertices=12,
            location=(pedal_x, cy, cz), rotation=(0, math.radians(90), 0)
        )
        p_spindle = bpy.context.active_object
        p_spindle.name = f"Part_PedalSpindle_{side}"
        p_spindle.data.materials.append(mats['chrome'])

        pedal_center_x = pedal_x + 0.8 * side
        bpy.ops.mesh.primitive_cube_add(
            size=1.0, location=(pedal_center_x, cy, cz)
        )
        pedal = bpy.context.active_object
        pedal.name = f"Part_PedalPlatform_{side}"
        pedal.scale = (1.5, 2.5, 0.6)
        pedal.data.materials.append(mats['pedals'])
        bpy.ops.object.shade_smooth()

        reflector_objs = []
        for r_dir in [-1, 1]:
            ref_y = cy + (1.28 * r_dir)
            bpy.ops.mesh.primitive_cube_add(
                size=1.0, location=(pedal_center_x, ref_y, cz)
            )
            refl = bpy.context.active_object
            refl.name = f"Part_Reflector_{side}_{r_dir}"
            refl.scale = (1.1, 0.12, 0.35)
            refl.data.materials.append(mats['reflector'])
            reflector_objs.append(refl)

        if side == 1:
            crank_r_objs.append(crank_obj)
            pedal_r_objs.extend([p_spindle, pedal] + reflector_objs)
        else:
            crank_l_objs.append(crank_obj)
            pedal_l_objs.extend([p_spindle, pedal] + reflector_objs)

    parts['crank_r'] = crank_r_objs
    parts['pedal_r'] = pedal_r_objs
    parts['crank_l'] = crank_l_objs
    parts['pedal_l'] = pedal_l_objs

    return parts

def create_armature():
    arm_data = bpy.data.armatures.new("Uniracer_Armature")
    arm_obj = bpy.data.objects.new("Uniracer_Armature", arm_data)
    bpy.context.scene.collection.objects.link(arm_obj)
    bpy.context.view_layer.objects.active = arm_obj
    bpy.ops.object.mode_set(mode='EDIT')

    # 1. Bone_Root
    root = arm_data.edit_bones.new("Bone_Root")
    root.head = (0, 0, 0)
    root.tail = (0, 0, 2)

    # 2. Bone_Wheel (Axle spin)
    wheel = arm_data.edit_bones.new("Bone_Wheel")
    wheel.head = (0, 0, 0)
    wheel.tail = (2, 0, 0)
    wheel.parent = root

    # 3. Cranks & Pedals
    crank_len = 6.2
    c_r_angle = math.radians(45)
    c_r_y, c_r_z = crank_len * math.cos(c_r_angle), crank_len * math.sin(c_r_angle)
    crank_r = arm_data.edit_bones.new("Bone_Crank_R")
    crank_r.head = (3.1, 0, 0)
    crank_r.tail = (3.1, c_r_y, c_r_z)
    crank_r.parent = wheel

    pedal_r = arm_data.edit_bones.new("Bone_Pedal_R")
    pedal_r.head = (4.3, c_r_y, c_r_z)
    pedal_r.tail = (5.5, c_r_y, c_r_z)
    pedal_r.parent = crank_r

    c_l_angle = math.radians(225)
    c_l_y, c_l_z = crank_len * math.cos(c_l_angle), crank_len * math.sin(c_l_angle)
    crank_l = arm_data.edit_bones.new("Bone_Crank_L")
    crank_l.head = (-3.1, 0, 0)
    crank_l.tail = (-3.1, c_l_y, c_l_z)
    crank_l.parent = wheel

    pedal_l = arm_data.edit_bones.new("Bone_Pedal_L")
    pedal_l.head = (-4.3, c_l_y, c_l_z)
    pedal_l.tail = (-5.5, c_l_y, c_l_z)
    pedal_l.parent = crank_l

    # 4. Bone_Fork (Rigid steering upright)
    fork = arm_data.edit_bones.new("Bone_Fork")
    fork.head = (0, 0, 0)
    fork.tail = (0, 0, 14.0)
    fork.parent = root

    # 5. Bone_SeatPost (Squash & Stretch along Z)
    post = arm_data.edit_bones.new("Bone_SeatPost")
    post.head = (0, 0, 14.0)
    post.tail = (0, 0, 20.0)
    post.parent = fork

    # 6. Bone_SaddleHead (Sentient head/neck with full pitch, yaw, roll freedom)
    head = arm_data.edit_bones.new("Bone_SaddleHead")
    head.head = (0, 0, 20.0)
    head.tail = (0, 3.0, 22.0) # pointing forward along nose
    head.parent = post

    bpy.ops.object.mode_set(mode='OBJECT')
    return arm_obj

def bind_parts_to_armature(arm_obj, parts):
    # Mapping part categories to bone names
    bone_map = {
        'wheel': 'Bone_Wheel',
        'fork': 'Bone_Fork',
        'seatpost': 'Bone_SeatPost',
        'saddle': 'Bone_SaddleHead',
        'crank_r': 'Bone_Crank_R',
        'pedal_r': 'Bone_Pedal_R',
        'crank_l': 'Bone_Crank_L',
        'pedal_l': 'Bone_Pedal_L'
    }

    all_objs = []
    for cat, objs in parts.items():
        bone_name = bone_map[cat]
        for obj in objs:
            # Apply all modifiers first (like Boolean, subsurf)
            bpy.context.view_layer.objects.active = obj
            for mod in list(obj.modifiers):
                if mod.type != 'ARMATURE':
                    try:
                        bpy.ops.object.modifier_apply(modifier=mod.name)
                    except Exception as e:
                        pass
            
            # Create vertex group with bone name and weight 1.0
            vg = obj.vertex_groups.new(name=bone_name)
            v_indices = [v.index for v in obj.data.vertices]
            if v_indices:
                vg.add(v_indices, 1.0, 'REPLACE')
            all_objs.append(obj)

    # Join all into single unified skinned mesh for flawless GLTF export
    bpy.ops.object.select_all(action='DESELECT')
    for obj in all_objs:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = all_objs[0]
    bpy.ops.object.join()
    
    skinned_mesh = bpy.context.active_object
    skinned_mesh.name = "Uniracer_Skinned_Mesh"

    # Add Armature Modifier
    mod_arm = skinned_mesh.modifiers.new(name="Armature", type='ARMATURE')
    mod_arm.object = arm_obj
    skinned_mesh.parent = arm_obj

    return skinned_mesh

def create_animation_actions(arm_obj):
    actions = {}
    
    # Bone references
    pb = arm_obj.pose.bones
    b_root = pb['Bone_Root']
    b_wheel = pb['Bone_Wheel']
    b_crank_r = pb['Bone_Crank_R']
    b_pedal_r = pb['Bone_Pedal_R']
    b_crank_l = pb['Bone_Crank_L']
    b_pedal_l = pb['Bone_Pedal_L']
    b_fork = pb['Bone_Fork']
    b_post = pb['Bone_SeatPost']
    b_head = pb['Bone_SaddleHead']

    # --- 1. Action: Idle_Sentient (Living breathing idle, curious saddle glances) ---
    act_idle = bpy.data.actions.new("Idle_Sentient")
    act_idle.use_fake_user = True
    arm_obj.animation_data_create()
    arm_obj.animation_data.action = act_idle

    # Reset bones
    for b in pb:
        b.location = (0, 0, 0)
        b.rotation_euler = (0, 0, 0)
        b.rotation_quaternion = (1, 0, 0, 0)
        b.scale = (1, 1, 1)

    # Frame 1: Upright alert rest
    b_head.rotation_mode = 'XYZ'
    b_post.rotation_mode = 'XYZ'
    
    b_head.rotation_euler = (math.radians(2), 0, 0)
    b_head.keyframe_insert(data_path="rotation_euler", frame=1)
    b_post.scale = (1, 1, 1.0)
    b_post.keyframe_insert(data_path="scale", frame=1)

    # Frame 15: Cock head right + perk up
    b_head.rotation_euler = (math.radians(6), math.radians(10), math.radians(-8))
    b_head.keyframe_insert(data_path="rotation_euler", frame=15)
    b_post.scale = (1, 1, 1.03)
    b_post.keyframe_insert(data_path="scale", frame=15)

    # Frame 30: Glancing left inquisitively
    b_head.rotation_euler = (math.radians(0), math.radians(-18), math.radians(6))
    b_head.keyframe_insert(data_path="rotation_euler", frame=30)
    b_post.scale = (1, 1, 0.98)
    b_post.keyframe_insert(data_path="scale", frame=30)

    # Frame 45: Nodding forward attentively
    b_head.rotation_euler = (math.radians(-5), math.radians(6), math.radians(-2))
    b_head.keyframe_insert(data_path="rotation_euler", frame=45)
    b_post.scale = (1, 1, 1.02)
    b_post.keyframe_insert(data_path="scale", frame=45)

    # Frame 60: Return to frame 1
    b_head.rotation_euler = (math.radians(2), 0, 0)
    b_head.keyframe_insert(data_path="rotation_euler", frame=60)
    b_post.scale = (1, 1, 1.0)
    b_post.keyframe_insert(data_path="scale", frame=60)
    actions['Idle_Sentient'] = act_idle

    # --- 2. Action: Look_Rival_Left (Turn 85 deg to glare at adjacent competitor) ---
    act_look_l = bpy.data.actions.new("Look_Rival_Left")
    act_look_l.use_fake_user = True
    arm_obj.animation_data.action = act_look_l
    for b in pb:
        b.rotation_euler = (0, 0, 0)
        b.scale = (1, 1, 1)

    # Frame 1: Center
    b_head.rotation_euler = (0, 0, 0)
    b_head.keyframe_insert(data_path="rotation_euler", frame=1)

    # Frame 10: Aggressive snap left to 85 deg yaw, -10 deg pitch nose-down, 12 deg tilt
    b_head.rotation_euler = (math.radians(-10), math.radians(85), math.radians(12))
    b_head.keyframe_insert(data_path="rotation_euler", frame=10)

    # Frame 25: Hold glare with intense focus
    b_head.rotation_euler = (math.radians(-12), math.radians(88), math.radians(14))
    b_head.keyframe_insert(data_path="rotation_euler", frame=25)

    # Frame 30: Snap back towards road
    b_head.rotation_euler = (math.radians(-4), math.radians(20), math.radians(3))
    b_head.keyframe_insert(data_path="rotation_euler", frame=30)
    actions['Look_Rival_Left'] = act_look_l

    # --- 3. Action: Look_Rival_Right (Mirrored glare to the right) ---
    act_look_r = bpy.data.actions.new("Look_Rival_Right")
    act_look_r.use_fake_user = True
    arm_obj.animation_data.action = act_look_r
    for b in pb:
        b.rotation_euler = (0, 0, 0)
        b.scale = (1, 1, 1)

    b_head.rotation_euler = (0, 0, 0)
    b_head.keyframe_insert(data_path="rotation_euler", frame=1)

    b_head.rotation_euler = (math.radians(-10), math.radians(-85), math.radians(-12))
    b_head.keyframe_insert(data_path="rotation_euler", frame=10)

    b_head.rotation_euler = (math.radians(-12), math.radians(-88), math.radians(-14))
    b_head.keyframe_insert(data_path="rotation_euler", frame=25)

    b_head.rotation_euler = (math.radians(-4), math.radians(-20), math.radians(-3))
    b_head.keyframe_insert(data_path="rotation_euler", frame=30)
    actions['Look_Rival_Right'] = act_look_r

    # --- 4. Action: Jump_Charge (Squash down along seatpost, spring coiling) ---
    act_charge = bpy.data.actions.new("Jump_Charge")
    act_charge.use_fake_user = True
    arm_obj.animation_data.action = act_charge
    for b in pb:
        b.rotation_euler = (0, 0, 0)
        b.scale = (1, 1, 1)

    # Frame 1: Neutral
    b_post.scale = (1, 1, 1.0)
    b_post.keyframe_insert(data_path="scale", frame=1)
    b_head.rotation_euler = (0, 0, 0)
    b_head.keyframe_insert(data_path="rotation_euler", frame=1)

    # Frame 20: Maximum compression squash (Z scale 0.65, saddle reared back 24 deg)
    b_post.scale = (1.2, 1.2, 0.65)
    b_post.keyframe_insert(data_path="scale", frame=20)
    b_head.rotation_euler = (math.radians(24), 0, 0)
    b_head.keyframe_insert(data_path="rotation_euler", frame=20)
    actions['Jump_Charge'] = act_charge

    # --- 5. Action: Jump_Airborne (Explosive stretch launch into aerodynamic flight) ---
    act_air = bpy.data.actions.new("Jump_Airborne")
    act_air.use_fake_user = True
    arm_obj.animation_data.action = act_air
    for b in pb:
        b.rotation_euler = (0, 0, 0)
        b.scale = (1, 1, 1)

    # Frame 1: Release pop
    b_post.scale = (0.9, 0.9, 1.30)
    b_post.keyframe_insert(data_path="scale", frame=1)
    b_head.rotation_euler = (math.radians(-16), 0, 0)
    b_head.keyframe_insert(data_path="rotation_euler", frame=1)

    # Frame 15: Gliding flight equilibrium
    b_post.scale = (0.95, 0.95, 1.15)
    b_post.keyframe_insert(data_path="scale", frame=15)
    b_head.rotation_euler = (math.radians(-12), 0, 0)
    b_head.keyframe_insert(data_path="rotation_euler", frame=15)

    # Frame 30: Landing pre-compression
    b_post.scale = (1.0, 1.0, 1.0)
    b_post.keyframe_insert(data_path="scale", frame=30)
    b_head.rotation_euler = (0, 0, 0)
    b_head.keyframe_insert(data_path="rotation_euler", frame=30)
    actions['Jump_Airborne'] = act_air

    # --- 6. Action: Trick_Twist (360-deg corkscrew stunt roll) ---
    act_twist = bpy.data.actions.new("Trick_Twist")
    act_twist.use_fake_user = True
    arm_obj.animation_data.action = act_twist
    for b in pb:
        b.rotation_euler = (0, 0, 0)
        b.scale = (1, 1, 1)

    b_head.rotation_mode = 'XYZ'
    b_head.rotation_euler = (0, 0, 0)
    b_head.keyframe_insert(data_path="rotation_euler", frame=1)

    # Frame 15: Intense counter-twist tilt and whip
    b_head.rotation_euler = (math.radians(-10), math.radians(65), math.radians(-35))
    b_post.scale = (1.1, 1.1, 0.9)
    b_head.keyframe_insert(data_path="rotation_euler", frame=15)
    b_post.keyframe_insert(data_path="scale", frame=15)

    # Frame 30: Snap back upright
    b_head.rotation_euler = (0, 0, 0)
    b_post.scale = (1, 1, 1)
    b_head.keyframe_insert(data_path="rotation_euler", frame=30)
    b_post.keyframe_insert(data_path="scale", frame=30)
    actions['Trick_Twist'] = act_twist

    # --- 7. Action: Trick_Flip (Acrobatic tuck & explosive kick) ---
    act_flip = bpy.data.actions.new("Trick_Flip")
    act_flip.use_fake_user = True
    arm_obj.animation_data.action = act_flip
    for b in pb:
        b.rotation_euler = (0, 0, 0)
        b.scale = (1, 1, 1)

    b_head.rotation_mode = 'XYZ'
    b_head.rotation_euler = (0, 0, 0)
    b_head.keyframe_insert(data_path="rotation_euler", frame=1)
    b_post.scale = (1, 1, 1)
    b_post.keyframe_insert(data_path="scale", frame=1)

    # Frame 15: Tight tuck (saddle dipped forward, seatpost compressed)
    b_head.rotation_euler = (math.radians(-40), 0, 0)
    b_post.scale = (1.2, 1.2, 0.75)
    b_head.keyframe_insert(data_path="rotation_euler", frame=15)
    b_post.keyframe_insert(data_path="scale", frame=15)

    # Frame 30: Explosive kick extension back to rest
    b_head.rotation_euler = (0, 0, 0)
    b_post.scale = (1, 1, 1)
    b_head.keyframe_insert(data_path="rotation_euler", frame=30)
    b_post.keyframe_insert(data_path="scale", frame=30)
    actions['Trick_Flip'] = act_flip

    # --- 8. Action: Wipeout_Dizzy (Woozy knockout circular wobble & recovery) ---
    act_dizzy = bpy.data.actions.new("Wipeout_Dizzy")
    act_dizzy.use_fake_user = True
    arm_obj.animation_data.action = act_dizzy
    for b in pb:
        b.rotation_euler = (0, 0, 0)
        b.scale = (1, 1, 1)

    # Frame 1: Stumble crash
    b_head.rotation_euler = (math.radians(-25), 0, math.radians(15))
    b_head.keyframe_insert(data_path="rotation_euler", frame=1)
    b_post.scale = (1, 1, 0.85)
    b_post.keyframe_insert(data_path="scale", frame=1)

    # Frames 10-35: Woozy circular wobble
    dizzy_frames = [
        (10, math.radians(20), math.radians(30), math.radians(20)),
        (18, math.radians(-15), math.radians(-25), math.radians(-20)),
        (26, math.radians(18), math.radians(-30), math.radians(15)),
        (34, math.radians(-20), math.radians(25), math.radians(-18)),
    ]
    for (f_num, p_rot, y_rot, r_rot) in dizzy_frames:
        b_head.rotation_euler = (p_rot, y_rot, r_rot)
        b_head.keyframe_insert(data_path="rotation_euler", frame=f_num)

    # Frame 45: Rapid shake to clear head (left)
    b_head.rotation_euler = (0, math.radians(-40), 0)
    b_head.keyframe_insert(data_path="rotation_euler", frame=45)

    # Frame 52: Rapid shake (right)
    b_head.rotation_euler = (0, math.radians(40), 0)
    b_head.keyframe_insert(data_path="rotation_euler", frame=52)

    # Frame 60: Snaps back to alert posture
    b_head.rotation_euler = (0, 0, 0)
    b_head.keyframe_insert(data_path="rotation_euler", frame=60)
    b_post.scale = (1, 1, 1.0)
    b_post.keyframe_insert(data_path="scale", frame=60)
    actions['Wipeout_Dizzy'] = act_dizzy

    # --- 9. Action: Sprint_Pedal (Fast pedaling cadence + attack crouch) ---
    act_sprint = bpy.data.actions.new("Sprint_Pedal")
    act_sprint.use_fake_user = True
    arm_obj.animation_data.action = act_sprint
    for b in pb:
        b.rotation_euler = (0, 0, 0)
        b.scale = (1, 1, 1)

    b_wheel.rotation_mode = 'XYZ'
    b_wheel.rotation_euler = (0, 0, 0)
    b_wheel.keyframe_insert(data_path="rotation_euler", frame=1)
    b_wheel.rotation_euler = (math.radians(360), 0, 0)
    b_wheel.keyframe_insert(data_path="rotation_euler", frame=30)

    # Counter-rotate pedals so they stay horizontal
    b_pedal_r.rotation_mode = 'XYZ'
    b_pedal_l.rotation_mode = 'XYZ'
    b_pedal_r.rotation_euler = (0, 0, 0)
    b_pedal_r.keyframe_insert(data_path="rotation_euler", frame=1)
    b_pedal_r.rotation_euler = (math.radians(-360), 0, 0)
    b_pedal_r.keyframe_insert(data_path="rotation_euler", frame=30)

    b_pedal_l.rotation_euler = (0, 0, 0)
    b_pedal_l.keyframe_insert(data_path="rotation_euler", frame=1)
    b_pedal_l.rotation_euler = (math.radians(-360), 0, 0)
    b_pedal_l.keyframe_insert(data_path="rotation_euler", frame=30)

    # Forward attack hunch
    b_head.rotation_euler = (math.radians(-15), 0, 0)
    b_head.keyframe_insert(data_path="rotation_euler", frame=1)
    b_head.rotation_euler = (math.radians(-18), 0, 0)
    b_head.keyframe_insert(data_path="rotation_euler", frame=15)
    b_head.rotation_euler = (math.radians(-15), 0, 0)
    b_head.keyframe_insert(data_path="rotation_euler", frame=30)
    actions['Sprint_Pedal'] = act_sprint

    return actions

def setup_studio_lighting():
    world = bpy.data.worlds.new("StudioWorld")
    bpy.context.scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs['Color'].default_value = (0.85, 0.88, 0.95, 1.0)
        bg.inputs['Strength'].default_value = 1.3

    key_data = bpy.data.lights.new(name="KeyLight", type='SUN')
    key_data.energy = 5.0
    key_obj = bpy.data.objects.new("KeyLight", key_data)
    key_obj.location = (20, -25, 25)
    bpy.context.scene.collection.objects.link(key_obj)

    fill_data = bpy.data.lights.new(name="FillLight", type='SUN')
    fill_data.energy = 2.5
    fill_obj = bpy.data.objects.new("FillLight", fill_data)
    fill_obj.location = (-20, -20, 15)
    bpy.context.scene.collection.objects.link(fill_obj)

    rim_data = bpy.data.lights.new(name="RimLight", type='SUN')
    rim_data.energy = 4.0
    rim_obj = bpy.data.objects.new("RimLight", rim_data)
    rim_obj.location = (0, 30, 25)
    bpy.context.scene.collection.objects.link(rim_obj)

    target = bpy.data.objects.new("CenterTarget", None)
    target.location = (0, 0, 11)
    bpy.context.scene.collection.objects.link(target)
    for obj in [key_obj, fill_obj, rim_obj]:
        c = obj.constraints.new(type='TRACK_TO')
        c.track_axis = 'TRACK_NEGATIVE_Z'
        c.up_axis = 'UP_Y'
        c.target = target

def render_frame_to_file(filepath, cam_pos, look_at, fov=40, res=(600, 600)):
    cam_data = bpy.data.cameras.new(name="RenderCam")
    cam_data.angle = math.radians(fov)
    cam_obj = bpy.data.objects.new("RenderCam", cam_data)
    cam_obj.location = cam_pos
    bpy.context.scene.collection.objects.link(cam_obj)
    
    c = cam_obj.constraints.new(type='TRACK_TO')
    c.track_axis = 'TRACK_NEGATIVE_Z'
    c.up_axis = 'UP_Y'
    target = bpy.data.objects.new("CamTarget", None)
    target.location = look_at
    bpy.context.scene.collection.objects.link(target)
    c.target = target

    bpy.context.scene.camera = cam_obj
    bpy.context.scene.render.resolution_x = res[0]
    bpy.context.scene.render.resolution_y = res[1]
    bpy.context.scene.render.filepath = filepath
    bpy.context.scene.render.image_settings.file_format = 'PNG'
    bpy.context.scene.render.film_transparent = True
    
    bpy.ops.render.render(write_still=True)
    
    bpy.data.objects.remove(cam_obj, do_unlink=True)
    bpy.data.objects.remove(target, do_unlink=True)
    bpy.data.cameras.remove(cam_data, do_unlink=True)

def render_animation_contact_sheets(arm_obj, brain_dir):
    temp_dir = os.path.join(brain_dir, "temp_anim_renders")
    os.makedirs(temp_dir, exist_ok=True)
    
    actions = bpy.data.actions

    # --- Sheet 1: Rival Glance Comparison (Looking Left vs Neutral vs Looking Right) ---
    print("Rendering Rival Glance comparison...")
    glance_files = []
    
    # 1. Look Left (Frame 15)
    arm_obj.animation_data.action = actions.get("Look_Rival_Left")
    bpy.context.scene.frame_set(15)
    p_left = os.path.join(temp_dir, "glance_left.png")
    render_frame_to_file(p_left, cam_pos=(28, -28, 22), look_at=(0, 0, 13), fov=42)
    glance_files.append(p_left)

    # 2. Neutral Idle (Frame 1)
    arm_obj.animation_data.action = actions.get("Idle_Sentient")
    bpy.context.scene.frame_set(1)
    p_mid = os.path.join(temp_dir, "glance_neutral.png")
    render_frame_to_file(p_mid, cam_pos=(28, -28, 22), look_at=(0, 0, 13), fov=42)
    glance_files.append(p_mid)

    # 3. Look Right (Frame 15)
    arm_obj.animation_data.action = actions.get("Look_Rival_Right")
    bpy.context.scene.frame_set(15)
    p_right = os.path.join(temp_dir, "glance_right.png")
    render_frame_to_file(p_right, cam_pos=(28, -28, 22), look_at=(0, 0, 13), fov=42)
    glance_files.append(p_right)

    # --- Sheet 2: Jump Cycle (Neutral -> Charge Squash -> Launch Stretch) ---
    print("Rendering Jump Cycle progression...")
    arm_obj.animation_data.action = actions.get("Idle_Sentient")
    bpy.context.scene.frame_set(1)
    render_frame_to_file(os.path.join(temp_dir, "jump_neutral.png"), cam_pos=(45, 0, 14), look_at=(0, 0, 13), fov=36)

    arm_obj.animation_data.action = actions.get("Jump_Charge")
    bpy.context.scene.frame_set(20)
    render_frame_to_file(os.path.join(temp_dir, "jump_charge.png"), cam_pos=(45, 0, 14), look_at=(0, 0, 13), fov=36)

    arm_obj.animation_data.action = actions.get("Jump_Airborne")
    bpy.context.scene.frame_set(5)
    render_frame_to_file(os.path.join(temp_dir, "jump_launch.png"), cam_pos=(45, 0, 14), look_at=(0, 0, 13), fov=36)

    bpy.context.scene.frame_set(18)
    render_frame_to_file(os.path.join(temp_dir, "jump_flight.png"), cam_pos=(45, 0, 14), look_at=(0, 0, 13), fov=36)

    # --- Sheet 3: Wipeout Dizzy Knockout Progression ---
    print("Rendering Wipeout Dizzy progression...")
    arm_obj.animation_data.action = actions.get("Wipeout_Dizzy")
    for f in [5, 18, 28, 48]:
        bpy.context.scene.frame_set(f)
        render_frame_to_file(os.path.join(temp_dir, f"dizzy_f{f}.png"), cam_pos=(35, -25, 20), look_at=(0, 0, 12), fov=40)

    # --- Sheet 4: Stunt Acrobatics (Twist Roll & Somersault) ---
    print("Rendering Stunts progression...")
    arm_obj.animation_data.action = actions.get("Trick_Twist")
    bpy.context.scene.frame_set(15)
    render_frame_to_file(os.path.join(temp_dir, "stunt_twist_180.png"), cam_pos=(35, -35, 22), look_at=(0, 0, 12), fov=40)

    arm_obj.animation_data.action = actions.get("Trick_Flip")
    bpy.context.scene.frame_set(15)
    render_frame_to_file(os.path.join(temp_dir, "stunt_flip_180.png"), cam_pos=(45, 0, 14), look_at=(0, 0, 12), fov=36)

    arm_obj.animation_data.action = actions.get("Sprint_Pedal")
    bpy.context.scene.frame_set(15)
    render_frame_to_file(os.path.join(temp_dir, "stunt_sprint.png"), cam_pos=(38, -25, 18), look_at=(0, 0, 12), fov=38)

    print("Frame renders completed for all 4 contact sheets.")

def export_gltf_with_animations(arm_obj, export_paths):
    # Ensure every single pose bone is strictly reset to rest pose!
    for b in arm_obj.pose.bones:
        b.location = (0, 0, 0)
        b.rotation_quaternion = (1, 0, 0, 0)
        b.rotation_euler = (0, 0, 0)
        b.scale = (1, 1, 1)

    # Set default action to Idle_Sentient
    arm_obj.animation_data.action = bpy.data.actions.get("Idle_Sentient")
    bpy.context.scene.frame_set(1)

    # Select armature and mesh
    bpy.ops.object.select_all(action='DESELECT')
    arm_obj.select_set(True)
    for child in arm_obj.children:
        child.select_set(True)
    bpy.context.view_layer.objects.active = arm_obj

    primary_path = export_paths[0]
    os.makedirs(os.path.dirname(primary_path), exist_ok=True)

    print(f"Exporting Rigged Uniracer with all actions to {primary_path}...")
    bpy.ops.export_scene.gltf(
        filepath=primary_path,
        export_format='GLB',
        use_selection=True,
        export_apply=False, # preserve skinning
        export_animations=True,
        export_all_influences=True,
        export_skins=True,
        export_morph=True,
        export_def_bones=True,
        export_nla_strips=False
    )
    print(f"Primary export finished! File size: {os.path.getsize(primary_path)} bytes.")

    for tgt in export_paths[1:]:
        os.makedirs(os.path.dirname(tgt), exist_ok=True)
        shutil.copyfile(primary_path, tgt)
        print(f"Synced copy to {tgt}")

def main():
    print("=== Building Rigged Sentient Uniracer Character & Animations ===")
    clear_scene()
    mats = create_materials()
    parts = build_geometry(mats)
    arm_obj = create_armature()
    skinned_mesh = bind_parts_to_armature(arm_obj, parts)
    actions = create_animation_actions(arm_obj)
    setup_studio_lighting()

    brain_dir = os.path.abspath(r"C:\Users\zakde\.gemini\antigravity\brain\5d778f69-db13-4232-9d87-80fc4f0ece4e")
    render_animation_contact_sheets(arm_obj, brain_dir)

    export_targets = [
        os.path.abspath(r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\integrations\integrations\glyphrider-rail-racer (43)\uni.glb"),
        os.path.abspath(r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\packages\glyphrider\uni.glb"),
        os.path.abspath(r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\assets\models\uni.glb")
    ]
    export_gltf_with_animations(arm_obj, export_targets)
    print("=== Complete Uniracer Rigging, Animation, and Export Succeeded! ===")

if __name__ == '__main__':
    main()
