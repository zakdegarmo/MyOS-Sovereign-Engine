"""
build_uniracer_model.py
-----------------------
Constructs a high-detail 3D Uniracer unicycle model honoring DMA Design's classic
SNES aesthetic (aerodynamic banana saddle, racing stripes, bladed chrome fork,
deep-dish rim with radial spokes, directional treaded tire, chrome cranks and
pedals with amber reflectors), while strictly maintaining the reference dimensions
of the user's original handcrafted model:
- Center origin at (0, 0, 0)
- Outer tire diameter: 25.0 (Radius = 12.5)
- Spindle width: ~4.8 (-2.4 to +2.4)
- Fork crown height: Z = 14.0
- Saddle height: Z ~ 21.0 - 23.5

Exports to:
- apps/web/public/integrations/integrations/glyphrider-rail-racer (43)/uni.glb
- packages/glyphrider/uni.glb
- apps/web/public/assets/models/uni.glb
And renders inspection previews to brain.
"""

import bpy
import bmesh
import math
import os
import shutil

def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def create_materials():
    mats = {}
    
    # 1. Mat_Body (High-Gloss Racing Paint - Default Cherry Red)
    mat_body = bpy.data.materials.new(name="Mat_Body")
    mat_body.use_nodes = True
    bsdf = mat_body.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs['Base Color'].default_value = (0.85, 0.05, 0.08, 1.0)
        bsdf.inputs['Metallic'].default_value = 0.5
        bsdf.inputs['Roughness'].default_value = 0.2
        if 'Clearcoat' in bsdf.inputs:
            bsdf.inputs['Clearcoat'].default_value = 1.0
        if 'Clearcoat Roughness' in bsdf.inputs:
            bsdf.inputs['Clearcoat Roughness'].default_value = 0.05
    mats['body'] = mat_body

    # 2. Mat_Seat (Contoured Saddle Cushion / Leather)
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
        bsdf.inputs['Roughness'].default_value = 0.2
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

def build_wheel_and_tire(mats):
    # 1. Tire Body: Torus centered at (0,0,0) with axle along X-axis
    # Major radius 10.5, Minor radius 2.0 -> Outer radius = 12.5, width in X = 4.0 (-2.0 to +2.0)
    bpy.ops.mesh.primitive_torus_add(
        major_radius=10.5,
        minor_radius=2.0,
        major_segments=64,
        minor_segments=32,
        location=(0, 0, 0),
        rotation=(0, math.radians(90), 0) # Normal along X-axis!
    )
    tire = bpy.context.active_object
    tire.name = "Tire"
    tire.data.materials.append(mats['tire'])
    bpy.ops.object.shade_smooth()

    # 2. Tire Tread Lugs (Directional Racing Grooves on YZ perimeter)
    tread_mesh = bpy.data.meshes.new("TreadRibs")
    tread_obj = bpy.data.objects.new("TreadRibs", tread_mesh)
    bpy.context.scene.collection.objects.link(tread_obj)
    
    bm = bmesh.new()
    num_lugs = 48
    for i in range(num_lugs):
        angle = (i / num_lugs) * math.tau
        ca, sa = math.cos(angle), math.sin(angle)
        
        # Center of lug at outer perimeter in YZ plane
        cy = 12.45 * ca
        cz = 12.45 * sa
        
        tangent_y, tangent_z = -sa, ca
        normal_y, normal_z = ca, sa
        
        w_half = 1.1 # width across X
        l_half = 0.22 # length along tangent
        h = 0.16 # height outward
        
        # Create angled chevron box along YZ
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
    bpy.context.view_layer.objects.active = tread_obj
    bpy.ops.object.shade_smooth()

    # 3. Deep-Dish Chrome Rim: Cylinder at R=9.3, inner recess R=8.5, width X in [-1.5, +1.5]
    bpy.ops.mesh.primitive_cylinder_add(
        radius=9.3,
        depth=3.0,
        vertices=36,
        location=(0, 0, 0),
        rotation=(0, math.radians(90), 0)
    )
    rim = bpy.context.active_object
    rim.name = "Rim"
    rim.data.materials.append(mats['chrome'])
    bpy.ops.object.shade_smooth()

    # Hollow out inner rim
    bpy.ops.mesh.primitive_cylinder_add(
        radius=8.6,
        depth=3.2,
        vertices=36,
        location=(0, 0, 0),
        rotation=(0, math.radians(90), 0)
    )
    rim_inner = bpy.context.active_object
    rim_inner.name = "RimInnerHole"
    
    mod_bool = rim.modifiers.new(name="RimHollow", type='BOOLEAN')
    mod_bool.operation = 'DIFFERENCE'
    mod_bool.object = rim_inner
    bpy.context.view_layer.objects.active = rim
    bpy.ops.object.modifier_apply(modifier="RimHollow")
    bpy.data.objects.remove(rim_inner, do_unlink=True)

    # 4. Wheel Hub: Central cylinder along X
    bpy.ops.mesh.primitive_cylinder_add(
        radius=1.3,
        depth=4.8, # X from -2.4 to +2.4
        vertices=24,
        location=(0, 0, 0),
        rotation=(0, math.radians(90), 0)
    )
    hub = bpy.context.active_object
    hub.name = "WheelHub"
    hub.data.materials.append(mats['chrome'])
    bpy.ops.object.shade_smooth()

    # Hub Flanges (left & right spoke anchor rings)
    for x_flange in [-1.9, 1.9]:
        bpy.ops.mesh.primitive_cylinder_add(
            radius=1.8,
            depth=0.35,
            vertices=24,
            location=(x_flange, 0, 0),
            rotation=(0, math.radians(90), 0)
        )
        flange = bpy.context.active_object
        flange.name = f"HubFlange_{x_flange}"
        flange.data.materials.append(mats['chrome'])
        bpy.ops.object.shade_smooth()

    # 5. Spokes: High-tension radial spokes
    spoke_mesh = bpy.data.meshes.new("SpokesMesh")
    spoke_obj = bpy.data.objects.new("Spokes", spoke_mesh)
    bpy.context.scene.collection.objects.link(spoke_obj)
    
    bm_spokes = bmesh.new()
    num_spokes = 20
    spoke_radius = 0.065
    
    for side in [-1, 1]:
        hub_x = 1.9 * side
        rim_x = 0.3 * side
        for i in range(num_spokes):
            angle = (i / num_spokes) * math.tau + (0.05 * side)
            hy = 1.6 * math.cos(angle)
            hz = 1.6 * math.sin(angle)
            
            # Cross lacing angle on rim
            cross_angle = angle + (math.radians(18) * side)
            ry = 8.6 * math.cos(cross_angle)
            rz = 8.6 * math.sin(cross_angle)
            
            # Vector from hub to rim
            v_dir = (rim_x - hub_x, ry - hy, rz - hz)
            length = math.sqrt(v_dir[0]**2 + v_dir[1]**2 + v_dir[2]**2)
            
            # Create cylinder along vector
            # Bmesh cylinder
            tmat = bmesh.ops.create_cone(
                bm_spokes,
                cap_ends=True,
                cap_tris=False,
                segments=6,
                radius1=spoke_radius,
                radius2=spoke_radius,
                depth=length
            )
            verts = tmat['verts']
            
            # Align cylinder to direction
            mid_pt = ((hub_x + rim_x) / 2, (hy + ry) / 2, (hz + rz) / 2)
            u_dir = (v_dir[0] / length, v_dir[1] / length, v_dir[2] / length)
            
            # Rotate from Z-axis (default cone axis) to u_dir
            z_axis = (0, 0, 1)
            # Cross product
            cx = z_axis[1] * u_dir[2] - z_axis[2] * u_dir[1]
            cy = z_axis[2] * u_dir[0] - z_axis[0] * u_dir[2]
            cz = z_axis[0] * u_dir[1] - z_axis[1] * u_dir[0]
            sin_a = math.sqrt(cx**2 + cy**2 + cz**2)
            cos_a = z_axis[0] * u_dir[0] + z_axis[1] * u_dir[1] + z_axis[2] * u_dir[2]
            
            if sin_a > 1e-5:
                ax = (cx / sin_a, cy / sin_a, cz / sin_a)
                rot_mat = (
                    bmesh.types.BMVert, # placeholder
                )
                # Apply rotation & translation
                rot_quat = (ax, math.atan2(sin_a, cos_a))
                # Rotate vertices
                for v in verts:
                    # Euler Rodrigues rotation
                    p = v.co
                    v.co = rotate_vector(p, ax, math.atan2(sin_a, cos_a))
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
    bpy.context.view_layer.objects.active = spoke_obj
    bpy.ops.object.shade_smooth()

def rotate_vector(v, axis, angle):
    # Rodrigues formula
    import mathutils
    q = mathutils.Quaternion(mathutils.Vector(axis), angle)
    return q @ v

def build_fork_and_frame(mats):
    # 1. Bladed Fork Legs at X = -3.03 and +3.03
    # Height from Z = 0 (axle) to Z = 14.0 (crown)
    # Streamlined teardrop/oval cross-section
    for side in [-1, 1]:
        x_pos = 3.03 * side
        bpy.ops.mesh.primitive_cylinder_add(
            radius=0.75,
            depth=14.0,
            vertices=20,
            location=(x_pos, 0, 7.0)
        )
        leg = bpy.context.active_object
        leg.name = f"ForkLeg_{side}"
        leg.scale = (0.75, 1.35, 1.0) # aerodynamic blade shape
        leg.data.materials.append(mats['chrome'])
        bpy.ops.object.shade_smooth()

        # Axle Dropout Clamp at Z = 0
        bpy.ops.mesh.primitive_cylinder_add(
            radius=1.1,
            depth=1.2,
            vertices=16,
            location=(x_pos, 0, 0),
            rotation=(0, math.radians(90), 0)
        )
        dropout = bpy.context.active_object
        dropout.name = f"Dropout_{side}"
        dropout.data.materials.append(mats['chrome'])
        bpy.ops.object.shade_smooth()

    # 2. Structural Fork Crown: Arched bridge bridging legs over tire (Z = 13.5 to 14.6)
    # Creates an arched bracket matching the reference width ~8.4
    crown_mesh = bpy.data.meshes.new("ForkCrownMesh")
    crown_obj = bpy.data.objects.new("ForkCrown", crown_mesh)
    bpy.context.scene.collection.objects.link(crown_obj)
    
    bm = bmesh.new()
    # Arch vertices from -3.03 to +3.03
    steps = 14
    rows = []
    for i in range(steps + 1):
        t = i / steps
        x = -3.2 + t * 6.4
        # Arch height curve over tire
        arch_z = 13.6 + 0.9 * math.sin(t * math.pi)
        
        # 4 corners of cross section
        dy = 0.9
        dz = 0.55
        v1 = bm.verts.new((x, -dy, arch_z - dz))
        v2 = bm.verts.new((x, dy, arch_z - dz))
        v3 = bm.verts.new((x, dy * 0.85, arch_z + dz))
        v4 = bm.verts.new((x, -dy * 0.85, arch_z + dz))
        curr_row = [v1, v2, v3, v4]
        rows.append(curr_row)
        
        if i > 0:
            # Connect to previous 4 verts
            prev_row = rows[i - 1]
            bm.faces.new((prev_row[0], prev_row[1], v2, v1))
            bm.faces.new((prev_row[1], prev_row[2], v3, v2))
            bm.faces.new((prev_row[2], prev_row[3], v4, v3))
            bm.faces.new((prev_row[3], prev_row[0], v1, v4))

    # Cap ends
    bm.faces.new((rows[0][0], rows[0][1], rows[0][2], rows[0][3]))
    bm.faces.new((rows[-1][3], rows[-1][2], rows[-1][1], rows[-1][0]))

    bm.to_mesh(crown_mesh)
    bm.free()
    crown_obj.data.materials.append(mats['chrome'])
    bpy.context.view_layer.objects.active = crown_obj
    bpy.ops.object.shade_smooth()

    # 3. Quick-Release Seatpost Clamp at Z = 14.5
    bpy.ops.mesh.primitive_cylinder_add(
        radius=1.35,
        depth=0.9,
        vertices=24,
        location=(0, 0, 14.65)
    )
    clamp = bpy.context.active_object
    clamp.name = "SeatClamp"
    clamp.data.materials.append(mats['body']) # Painted accent clamp
    bpy.ops.object.shade_smooth()

    # Cam Lever for quick release
    bpy.ops.mesh.primitive_cylinder_add(
        radius=0.22,
        depth=1.8,
        vertices=12,
        location=(1.4, -0.6, 14.65),
        rotation=(math.radians(20), math.radians(45), 0)
    )
    lever = bpy.context.active_object
    lever.name = "ClampLever"
    lever.data.materials.append(mats['chrome'])

    # 4. Seatpost: Chrome tube rising from Z = 14.5 to Z = 20.2
    bpy.ops.mesh.primitive_cylinder_add(
        radius=0.92,
        depth=5.8,
        vertices=24,
        location=(0, 0, 17.5)
    )
    post = bpy.context.active_object
    post.name = "Seatpost"
    post.data.materials.append(mats['chrome'])
    bpy.ops.object.shade_smooth()

def build_cranks_and_pedals(mats):
    # Crank length 6.2, offset along X at +-3.1
    # Right Crank: points forward-down (+45 deg from horizontal)
    # Left Crank: points back-up (+225 deg)
    crank_angles = [math.radians(45), math.radians(225)]
    crank_len = 6.2
    
    for idx, side in enumerate([-1, 1]):
        angle = crank_angles[idx]
        x_pos = 3.1 * side
        cy = crank_len * math.cos(angle)
        cz = crank_len * math.sin(angle)
        
        # Crank Arm: beveled box
        crank_mesh = bpy.data.meshes.new(f"CrankArm_{side}")
        crank_obj = bpy.data.objects.new(f"CrankArm_{side}", crank_mesh)
        bpy.context.scene.collection.objects.link(crank_obj)
        
        bm = bmesh.new()
        # Boss at axle
        bmesh.ops.create_cone(
            bm,
            cap_ends=True,
            cap_tris=False,
            segments=16,
            radius1=0.85,
            radius2=0.85,
            depth=0.55
        )
        # Shift to x_pos
        for v in bm.verts:
            v.co.z = v.co.z + x_pos # cylinder default along Z
        # Rotate to X-axis
        for v in bm.verts:
            v.co = (v.co.z, v.co.x, v.co.y)
            
        # Arm beam from (x_pos, 0, 0) to (x_pos, cy, cz)
        w = 0.45
        t = 0.35
        # Direction
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
        bpy.context.view_layer.objects.active = crank_obj
        bpy.ops.object.shade_smooth()

        # Pedal Spindle extending outward along X
        pedal_x = x_pos + 1.2 * side
        bpy.ops.mesh.primitive_cylinder_add(
            radius=0.3,
            depth=1.8,
            vertices=12,
            location=(pedal_x, cy, cz),
            rotation=(0, math.radians(90), 0)
        )
        p_spindle = bpy.context.active_object
        p_spindle.name = f"PedalSpindle_{side}"
        p_spindle.data.materials.append(mats['chrome'])

        # Pedal Platform (Body)
        # Platform dimensions: X=1.6, Y=2.6, Z=0.65
        pedal_center_x = pedal_x + 0.8 * side
        bpy.ops.mesh.primitive_cube_add(
            size=1.0,
            location=(pedal_center_x, cy, cz)
        )
        pedal = bpy.context.active_object
        pedal.name = f"PedalPlatform_{side}"
        pedal.scale = (1.5, 2.5, 0.6)
        pedal.data.materials.append(mats['pedals'])
        bpy.ops.object.shade_smooth()

        # Amber Safety Reflectors (Front & Back of pedal)
        for r_dir in [-1, 1]:
            ref_y = cy + (1.28 * r_dir)
            bpy.ops.mesh.primitive_cube_add(
                size=1.0,
                location=(pedal_center_x, ref_y, cz)
            )
            refl = bpy.context.active_object
            refl.name = f"Reflector_{side}_{r_dir}"
            refl.scale = (1.1, 0.12, 0.35)
            refl.data.materials.append(mats['reflector'])

def build_uniracer_saddle(mats):
    """
    Constructs the iconic aerodynamic Uniracers banana saddle:
    - High-kick rear spoiler lip (Y = -6.5, Z = 23.2)
    - Ergonomic dipped waist (Y = -1.0 to +1.0, Z = 20.8)
    - Down-curved aerodynamic nose (Y = +6.5, Z = 21.4)
    - Dual racing stripe geometry along center spine
    - Discrete Mat_Body and Mat_Seat assignments
    """
    saddle_mesh = bpy.data.meshes.new("UniracerSaddle")
    saddle_obj = bpy.data.objects.new("UniracerSaddle", saddle_mesh)
    bpy.context.scene.collection.objects.link(saddle_obj)
    
    # Saddle Materials
    saddle_obj.data.materials.append(mats['body'])   # slot 0: Body Shell & Stripes
    saddle_obj.data.materials.append(mats['seat'])   # slot 1: Leather Cushion
    saddle_obj.data.materials.append(mats['stripe']) # slot 2: Racing Stripe
    saddle_obj.data.materials.append(mats['pedals']) # slot 3: Bumpers / Nose guard

    bm = bmesh.new()

    # Generate cross-sectional ribs along Y from -6.8 (rear tail) to +6.8 (front nose)
    # 13 slices along Y
    slices = [
        # (y, z_base, half_w, z_cushion, kick_angle)
        (-6.8, 22.8, 3.2, 23.6, 0.45), # High-kick rear spoiler tip
        (-5.8, 22.2, 3.5, 23.0, 0.35), # Rear tail transition
        (-4.5, 21.6, 3.7, 22.3, 0.22), # Rear seat support
        (-3.0, 21.1, 3.5, 21.7, 0.12), # Hip cradle
        (-1.5, 20.8, 3.0, 21.3, 0.04), # Ergonomic depression
        ( 0.0, 20.6, 2.5, 21.1, 0.00), # Center waist (narrowest)
        ( 1.5, 20.8, 2.4, 21.3,-0.05), # Forward transition
        ( 3.0, 21.0, 2.5, 21.6,-0.10), # Forward rise
        ( 4.5, 21.2, 2.4, 21.8,-0.18), # Nose cradle
        ( 5.8, 21.0, 2.0, 21.6,-0.30), # Downward hooking nose
        ( 6.8, 20.5, 1.4, 21.1,-0.45), # Nose tip bumper
    ]

    # For each slice, create 8 vertices across X:
    # 0: bottom keel center (0, y, z_base - 0.7)
    # 1: bottom left edge (-w*0.85, y, z_base - 0.3)
    # 2: top left outer flare (-w, y, z_base + 0.1)
    # 3: cushion left shoulder (-w*0.7, y, z_cushion)
    # 4: stripe left (-0.35, y, z_cushion + 0.1)
    # 5: stripe right (+0.35, y, z_cushion + 0.1)
    # 6: cushion right shoulder (+w*0.7, y, z_cushion)
    # 7: top right outer flare (+w, y, z_base + 0.1)
    # 8: bottom right edge (+w*0.85, y, z_base - 0.3)

    vert_grid = []
    for (y, zb, hw, zc, ka) in slices:
        row = []
        # Bottom keel
        row.append(bm.verts.new((0.0, y, zb - 0.8)))
        # Left shell
        row.append(bm.verts.new((-hw * 0.85, y, zb - 0.35)))
        row.append(bm.verts.new((-hw, y, zb + 0.15)))
        # Left cushion
        row.append(bm.verts.new((-hw * 0.72, y, zc)))
        # Racing stripe spine
        row.append(bm.verts.new((-0.38, y, zc + 0.08)))
        row.append(bm.verts.new(( 0.38, y, zc + 0.08)))
        # Right cushion
        row.append(bm.verts.new(( hw * 0.72, y, zc)))
        # Right shell
        row.append(bm.verts.new(( hw, y, zb + 0.15)))
        row.append(bm.verts.new(( hw * 0.85, y, zb - 0.35)))
        vert_grid.append(row)

    # Build faces between consecutive slices
    num_rows = len(slices)
    num_cols = len(vert_grid[0]) # 9 vertices per slice

    for r in range(num_rows - 1):
        r1 = vert_grid[r]
        r2 = vert_grid[r + 1]
        
        # Bottom shell: (0, 1) and (8, 0)
        f = bm.faces.new((r1[0], r1[1], r2[1], r2[0]))
        f.material_index = 0 # Body
        
        f = bm.faces.new((r1[8], r1[0], r2[0], r2[8]))
        f.material_index = 0 # Body

        # Side flare: (1, 2) and (7, 8)
        f = bm.faces.new((r1[1], r1[2], r2[2], r2[1]))
        f.material_index = 0 # Body

        f = bm.faces.new((r1[7], r1[8], r2[8], r2[7]))
        f.material_index = 0 # Body

        # Outer rim transition: (2, 3) and (6, 7)
        f = bm.faces.new((r1[2], r1[3], r2[3], r2[2]))
        f.material_index = 1 # Seat cushion

        f = bm.faces.new((r1[6], r1[7], r2[7], r2[6]))
        f.material_index = 1 # Seat cushion

        # Main Cushion Deck: (3, 4) and (5, 6)
        f = bm.faces.new((r1[3], r1[4], r2[4], r2[3]))
        f.material_index = 1 # Seat cushion

        f = bm.faces.new((r1[5], r1[6], r2[6], r2[5]))
        f.material_index = 1 # Seat cushion

        # Center Racing Stripe: (4, 5)
        f = bm.faces.new((r1[4], r1[5], r2[5], r2[4]))
        f.material_index = 2 # Stripe!

    # Cap Rear Tail Lip (Row 0)
    tail = vert_grid[0]
    # Triangle fan or quad caps
    f_tail1 = bm.faces.new((tail[0], tail[1], tail[2], tail[3]))
    f_tail1.material_index = 3 # Rear bumper
    f_tail2 = bm.faces.new((tail[0], tail[3], tail[4], tail[5]))
    f_tail2.material_index = 3
    f_tail3 = bm.faces.new((tail[0], tail[5], tail[6], tail[7]))
    f_tail3.material_index = 3
    f_tail4 = bm.faces.new((tail[0], tail[7], tail[8]))
    f_tail4.material_index = 3

    # Cap Front Nose (Row -1)
    nose = vert_grid[-1]
    f_nose1 = bm.faces.new((nose[3], nose[2], nose[1], nose[0]))
    f_nose1.material_index = 3 # Nose guard
    f_nose2 = bm.faces.new((nose[5], nose[4], nose[3], nose[0]))
    f_nose2.material_index = 3
    f_nose3 = bm.faces.new((nose[7], nose[6], nose[5], nose[0]))
    f_nose3.material_index = 3
    f_nose4 = bm.faces.new((nose[8], nose[7], nose[0]))
    f_nose4.material_index = 3

    bm.to_mesh(saddle_mesh)
    bm.free()

    bpy.context.view_layer.objects.active = saddle_obj
    bpy.ops.object.shade_smooth()

    # Add Subdivision Surface Modifier for silky smooth contour
    sub_mod = saddle_obj.modifiers.new(name="Subdivision", type='SUBSURF')
    sub_mod.levels = 1
    sub_mod.render_levels = 2

    # Under-saddle Mounting Bracket (Connecting to Seatpost)
    bpy.ops.mesh.primitive_cylinder_add(
        radius=1.1,
        depth=0.9,
        vertices=16,
        location=(0, 0, 20.0)
    )
    bracket = bpy.context.active_object
    bracket.name = "SaddleMountBracket"
    bracket.data.materials.append(mats['chrome'])
    bpy.ops.object.shade_smooth()

def setup_studio_lighting():
    # World Ambient Lighting (Critical for Chrome & Gloss reflections)
    world = bpy.data.worlds.new("StudioWorld")
    bpy.context.scene.world = world
    world.use_nodes = True
    bg_node = world.node_tree.nodes.get("Background")
    if bg_node:
        bg_node.inputs['Color'].default_value = (0.8, 0.85, 0.95, 1.0)
        bg_node.inputs['Strength'].default_value = 1.2

    # Key Sun Light (Warm energetic direct illumination)
    key_data = bpy.data.lights.new(name="StudioKey", type='SUN')
    key_data.energy = 5.0
    key_data.color = (1.0, 0.97, 0.92)
    key_obj = bpy.data.objects.new("StudioKey", key_data)
    key_obj.location = (20, -25, 25)
    bpy.context.scene.collection.objects.link(key_obj)

    # Fill Sun Light (Cool ambient fill)
    fill_data = bpy.data.lights.new(name="StudioFill", type='SUN')
    fill_data.energy = 2.5
    fill_data.color = (0.8, 0.9, 1.0)
    fill_obj = bpy.data.objects.new("StudioFill", fill_data)
    fill_obj.location = (-20, -20, 15)
    bpy.context.scene.collection.objects.link(fill_obj)

    # Rim Sun Light (Crisp edge highlight on chrome and rear spoiler)
    rim_data = bpy.data.lights.new(name="StudioRim", type='SUN')
    rim_data.energy = 4.0
    rim_data.color = (1.0, 1.0, 1.0)
    rim_obj = bpy.data.objects.new("StudioRim", rim_data)
    rim_obj.location = (0, 30, 25)
    bpy.context.scene.collection.objects.link(rim_obj)

    # Point lights towards center (0, 0, 11)
    target = bpy.data.objects.new("CenterTarget", None)
    target.location = (0, 0, 11)
    bpy.context.scene.collection.objects.link(target)
    for obj in [key_obj, fill_obj, rim_obj]:
        c = obj.constraints.new(type='TRACK_TO')
        c.track_axis = 'TRACK_NEGATIVE_Z'
        c.up_axis = 'UP_Y'
        c.target = target

def render_preview(filepath, cam_pos, look_at, fov=45):
    cam_data = bpy.data.cameras.new(name="PreviewCam")
    cam_data.angle = math.radians(fov)
    cam_obj = bpy.data.objects.new("PreviewCam", cam_data)
    cam_obj.location = cam_pos
    bpy.context.scene.collection.objects.link(cam_obj)
    
    constraint = cam_obj.constraints.new(type='TRACK_TO')
    constraint.track_axis = 'TRACK_NEGATIVE_Z'
    constraint.up_axis = 'UP_Y'
    target = bpy.data.objects.new("CamTarget", None)
    target.location = look_at
    bpy.context.scene.collection.objects.link(target)
    constraint.target = target
    
    bpy.context.scene.camera = cam_obj
    bpy.context.scene.render.resolution_x = 800
    bpy.context.scene.render.resolution_y = 800
    bpy.context.scene.render.filepath = filepath
    bpy.context.scene.render.image_settings.file_format = 'PNG'
    bpy.context.scene.render.film_transparent = True
    
    bpy.ops.render.render(write_still=True)
    
    # Cleanup camera
    bpy.data.objects.remove(cam_obj, do_unlink=True)
    bpy.data.objects.remove(target, do_unlink=True)
    bpy.data.cameras.remove(cam_data, do_unlink=True)

def main():
    print("=== Constructing High-Detail 3D Uniracer Model ===")
    clear_scene()
    
    # 1. Materials
    mats = create_materials()
    
    # 2. Geometry
    build_wheel_and_tire(mats)
    build_fork_and_frame(mats)
    build_cranks_and_pedals(mats)
    build_uniracer_saddle(mats)
    
    # 3. Lighting & Inspection Previews
    setup_studio_lighting()
    
    brain_dir = os.path.abspath(r"C:\Users\zakde\.gemini\antigravity\brain\5d778f69-db13-4232-9d87-80fc4f0ece4e")
    
    # 1. Side Profile (Classic 2.5D View)
    side_path = os.path.join(brain_dir, "uniracer_side_25d.png")
    print(f"Rendering Classic 2.5D Side Profile to {side_path}...")
    render_preview(side_path, cam_pos=(55, 0, 11), look_at=(0, 0, 11), fov=35)
    
    # 2. Isometric 3/4 Perspective
    iso_path = os.path.join(brain_dir, "uniracer_perspective_34.png")
    print(f"Rendering 3/4 Perspective to {iso_path}...")
    render_preview(iso_path, cam_pos=(38, -38, 26), look_at=(0, 0, 11), fov=40)
    
    # 3. Front Action View
    front_path = os.path.join(brain_dir, "uniracer_front_action.png")
    print(f"Rendering Front Action View to {front_path}...")
    render_preview(front_path, cam_pos=(0, -48, 14), look_at=(0, 0, 11), fov=38)

    # 4. GLB Export
    # Export clean GLB with materials, vertex normals, and animation ready
    export_targets = [
        os.path.abspath(r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\integrations\integrations\glyphrider-rail-racer (43)\uni.glb"),
        os.path.abspath(r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\packages\glyphrider\uni.glb"),
        os.path.abspath(r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\assets\models\uni.glb")
    ]
    
    primary_export = export_targets[0]
    os.makedirs(os.path.dirname(primary_export), exist_ok=True)
    
    print(f"Exporting GLTF/GLB to {primary_export}...")
    # Select all mesh objects
    bpy.ops.object.select_all(action='DESELECT')
    for obj in bpy.context.scene.objects:
        if obj.type == 'MESH':
            obj.select_set(True)
            
    bpy.ops.export_scene.gltf(
        filepath=primary_export,
        export_format='GLB',
        use_selection=True,
        export_apply=True,
        export_materials='EXPORT',
        export_normals=True,
        export_tangents=True
    )
    
    # Copy to all target directories
    for target in export_targets[1:]:
        os.makedirs(os.path.dirname(target), exist_ok=True)
        shutil.copy2(primary_export, target)
        print(f"Synced model to: {target}")

    print("=== Uniracer 3D Model Generation Complete! ===")

if __name__ == "__main__":
    main()
