# scripts/tools/film_prologue_beat2.py
"""
film_prologue_beat2.py
----------------------
Films Beat 2 of the Intro Prologue: The Garage Room Sequence (Frames 1-720, 30.0s @ 24fps):
  - Shot 3 (F1-72, 3.0s): Low profile tracking across the garage doorway threshold.
  - Shot 4 (F73-250, 7.4s): OTS TV framing. Red rolls in background, hops on couch (zero clipping!),
                            clicks TV knob at F218, CRT screen flashes on with authentic 2-minute SNES Uniracers loop!
  - Shot 5 (F251-335, 3.5s): PTWANG! Spring bursts through cushion. Red pops up, shakes head 'no', rolls eyes.
  - Shot 5 -> 6 Orbit (F335-410, 3.1s): Majestic continuous 3D camera orbit pan sweeping around Red.
  - Shot 6 (F410-580, 7.1s): OTS 1/3 Rule framing (Red 1/3, glowing CRT 2/3).
                            Red scoots toward armrest, pedal-flicks vintage "OIL" tin can, balances on fork crown,
                            chugs 10W-40 with 3 satisfying gulps, sets can back down on armrest.
  - Shot 7 (F581-720, 5.8s): Noise outside! Red perches alert, hops off couch past base, pivots +X,
                            and rolls forward cleanly through doorway into scrap yard. Camera holds on empty room.
"""

import bpy
import math
import os
import sys
from mathutils import Vector, Euler

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except AttributeError:
        pass

WORKSPACE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
OUTPUT_DIR = os.path.join(WORKSPACE_ROOT, "temp_studio_frames", "prologue_beat2")
CANONICAL_BLEND = os.path.join(WORKSPACE_ROOT, "uniracer_model.blend")
POSTERS_DIR = os.path.join(WORKSPACE_ROOT, "apps", "web", "public", "textures", "posters")
CRT_DIR = os.path.join(WORKSPACE_ROOT, "apps", "web", "public", "textures", "crt_screens")
SCREENINGS_DIR = os.path.join(WORKSPACE_ROOT, "apps", "web", "public", "screenings")
TEXTURES_DIR = os.path.join(WORKSPACE_ROOT, "apps", "web", "public", "textures")

os.makedirs(OUTPUT_DIR, exist_ok=True)

def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def apply_bevel(obj, width=0.03, segments=2):
    mod = obj.modifiers.new(name="Bevel", type='BEVEL')
    mod.width = width
    mod.segments = segments
    mod.limit_method = 'ANGLE'

def create_mat(name, color, roughness=0.5, metalness=0.0, emission=None, emission_strength=1.0):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs['Base Color'].default_value = color
        bsdf.inputs['Roughness'].default_value = roughness
        bsdf.inputs['Metallic'].default_value = metalness
        if emission:
            try:
                bsdf.inputs['Emission Color'].default_value = emission
                bsdf.inputs['Emission Strength'].default_value = emission_strength
            except KeyError:
                pass
    return mat

def create_image_mat(name, img_path, roughness=0.4, is_emission=False, emission_strength=1.5):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nt = mat.node_tree
    nodes = nt.nodes
    links = nt.links
    bsdf = nodes.get("Principled BSDF")
    if os.path.exists(img_path):
        tex_node = nodes.new('ShaderNodeTexImage')
        tex_node.image = bpy.data.images.load(img_path)
        links.new(tex_node.outputs['Color'], bsdf.inputs['Base Color'])
        bsdf.inputs['Roughness'].default_value = roughness
        if is_emission:
            try:
                links.new(tex_node.outputs['Color'], bsdf.inputs['Emission Color'])
                bsdf.inputs['Emission Strength'].default_value = emission_strength
            except KeyError:
                pass
            try:
                bsdf.inputs['Specular IOR Level'].default_value = 0.0
            except KeyError:
                try:
                    bsdf.inputs['Specular'].default_value = 0.0
                except KeyError:
                    pass
    return mat

def build_tv_screen_movie_material():
    mat = bpy.data.materials.new(name="TVScreenSNESMovie")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    node_out = nodes.new('ShaderNodeOutputMaterial')
    node_bsdf = nodes.new('ShaderNodeBsdfPrincipled')
    links.new(node_bsdf.outputs['BSDF'], node_out.inputs['Surface'])

    movie_path = os.path.join(SCREENINGS_DIR, "2_min_uni_loop.mp4")
    tex_node = nodes.new('ShaderNodeTexImage')
    if os.path.exists(movie_path):
        movie_img = bpy.data.images.load(movie_path)
        tex_node.image = movie_img
        tex_node.image_user.frame_duration = 4008
        tex_node.image_user.frame_start = 218 # Video playback starts on TV turn-on at F218
        tex_node.image_user.use_auto_refresh = True
        tex_node.image_user.use_cyclic = True
        links.new(tex_node.outputs['Color'], node_bsdf.inputs['Base Color'])
        try:
            links.new(tex_node.outputs['Color'], node_bsdf.inputs['Emission Color'])
        except KeyError:
            pass

    node_bsdf.inputs['Roughness'].default_value = 0.35
    try:
        node_bsdf.inputs['Specular IOR Level'].default_value = 0.0
    except KeyError:
        try:
            node_bsdf.inputs['Specular'].default_value = 0.0
        except KeyError:
            pass
    try:
        node_bsdf.inputs['Emission Strength'].default_value = 0.0
    except KeyError:
        pass

    return mat, node_bsdf, tex_node

def build_vintage_oil_can_material():
    mat = bpy.data.materials.new(name="Mat_VintageOilCan")
    mat.use_nodes = True
    nt = mat.node_tree
    nodes = nt.nodes
    links = nt.links
    nodes.clear()

    node_out = nodes.new('ShaderNodeOutputMaterial')
    node_bsdf = nodes.new('ShaderNodeBsdfPrincipled')
    links.new(node_bsdf.outputs['BSDF'], node_out.inputs['Surface'])

    node_coord = nodes.new('ShaderNodeTexCoord')
    node_map = nodes.new('ShaderNodeMapping')
    node_map.inputs['Location'].default_value[0] = 0.12 # Center OIL stencil
    node_map.inputs['Location'].default_value[1] = 0.0
    node_map.inputs['Scale'].default_value[0] = 2.4
    node_map.inputs['Scale'].default_value[1] = 1.0
    links.new(node_coord.outputs['UV'], node_map.inputs['Vector'])

    tex_node = nodes.new('ShaderNodeTexImage')
    label_path = os.path.join(TEXTURES_DIR, "oil_can_label.png")
    if os.path.exists(label_path):
        tex_node.image = bpy.data.images.load(label_path)
        links.new(node_map.outputs['Vector'], tex_node.inputs['Vector'])

    # Geometry normal Z mask for tin caps vs labeled cylindrical side
    node_geom = nodes.new('ShaderNodeNewGeometry')
    node_sep = nodes.new('ShaderNodeSeparateXYZ')
    links.new(node_geom.outputs['Normal'], node_sep.inputs['Vector'])

    node_abs = nodes.new('ShaderNodeMath')
    node_abs.operation = 'ABSOLUTE'
    links.new(node_sep.outputs['Z'], node_abs.inputs[0])

    node_cap_mask = nodes.new('ShaderNodeMath')
    node_cap_mask.operation = 'GREATER_THAN'
    node_cap_mask.inputs[1].default_value = 0.6
    links.new(node_abs.outputs['Value'], node_cap_mask.inputs[0])

    # Mix label color with brushed tin caps
    node_mix_col = nodes.new('ShaderNodeMix')
    node_mix_col.data_type = 'RGBA'
    links.new(node_cap_mask.outputs['Value'], node_mix_col.inputs['Factor'])
    if tex_node.image:
        links.new(tex_node.outputs['Color'], node_mix_col.inputs['A'])
    else:
        node_mix_col.inputs['A'].default_value = (0.75, 0.03, 0.03, 1.0)
    node_mix_col.inputs['B'].default_value = (0.78, 0.80, 0.82, 1.0) # Tin cap
    links.new(node_mix_col.outputs['Result'], node_bsdf.inputs['Base Color'])

    node_bsdf.inputs['Metallic'].default_value = 0.85
    node_bsdf.inputs['Roughness'].default_value = 0.24

    return mat

def build_helical_spring_mesh(radius=0.10, height=0.75, turns=5):
    curve_data = bpy.data.curves.new(name="SpringCurve", type='CURVE')
    curve_data.dimensions = '3D'
    curve_data.bevel_depth = 0.016
    curve_data.bevel_resolution = 4
    curve_data.use_fill_caps = True
    polyline = curve_data.splines.new('POLY')
    steps = turns * 24
    polyline.points.add(steps - 1)
    for i in range(steps):
        t = i / float(steps)
        ang = t * turns * 2.0 * math.pi
        x = radius * math.cos(ang)
        y = radius * math.sin(ang)
        z = t * height
        polyline.points[i].co = (x, y, z, 1.0)
    spring_obj = bpy.data.objects.new("CoiledSpring", curve_data)
    bpy.context.scene.collection.objects.link(spring_obj)
    return spring_obj

def setup_garage_scene():
    reset_scene()
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_EEVEE'
    try:
        scene.eevee.use_raytracing = True
    except Exception:
        pass
    scene.render.resolution_x = 1280
    scene.render.resolution_y = 720
    scene.frame_start = 1
    scene.frame_end = 720

    scene.view_settings.view_transform = 'AgX'
    scene.view_settings.exposure = 0.05

    # World: Deep night with subtle sky fill
    world = scene.world or bpy.data.worlds.new("World")
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs[0].default_value = (0.02, 0.025, 0.04, 1.0)
        bg.inputs[1].default_value = 0.4

    # Materials
    m_floor = create_mat("GarageFloor", (0.07, 0.08, 0.09, 1.0), roughness=0.60, metalness=0.15)
    m_wall = create_mat("GarageBackWall", (0.08, 0.08, 0.09, 1.0), roughness=0.85)
    m_door_frame = create_mat("DoorFrame", (0.35, 0.25, 0.08, 1.0), roughness=0.55) # Rusted industrial yellow
    m_wood = create_mat("CrateWood", (0.18, 0.12, 0.07, 1.0), roughness=0.85)
    m_couch_body = create_mat("CouchBody", (0.05, 0.10, 0.06, 1.0), roughness=0.75)
    m_cushion = create_mat("CouchCushion", (0.07, 0.12, 0.08, 1.0), roughness=0.78)
    m_tv_chassis = create_mat("TVChassis", (0.04, 0.04, 0.05, 1.0), roughness=0.45, metalness=0.20)
    m_spring = create_mat("SpringSteel", (0.90, 0.92, 0.95, 1.0), roughness=0.12, metalness=0.98)
    m_tire = create_mat("TireRubber", (0.05, 0.05, 0.06, 1.0), roughness=0.88)
    m_rust = create_mat("RustedSteel", (0.28, 0.15, 0.08, 1.0), roughness=0.75, metalness=0.3)

    # 1. Garage Concrete Floor (24m x 24m)
    bpy.ops.mesh.primitive_plane_add(size=24.0, location=(0, 0, 0))
    floor = bpy.context.active_object
    floor.data.materials.append(m_floor)

    # 2. Garage Rug (centered in front of couch)
    rug_path = os.path.join(POSTERS_DIR, "rug_garage.png")
    m_rug = create_image_mat("RugMat", rug_path, roughness=0.9)
    bpy.ops.mesh.primitive_plane_add(size=1.0, location=(0, -1.0, 0.005))
    rug = bpy.context.active_object
    rug.scale = (3.8, 2.6, 1.0)
    rug.data.materials.append(m_rug)

    # 3. Back Wall behind couch (Y = 1.4)
    bpy.ops.mesh.primitive_plane_add(size=1.0, location=(0, 1.4, 2.0))
    wall = bpy.context.active_object
    wall.rotation_euler = (math.radians(90), 0, 0)
    wall.scale = (14.0, 4.0, 1.0)
    wall.data.materials.append(m_wall)

    # 4. Doorway Threshold Wall (X = 3.8)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(3.8, 1.4, 2.0))
    d_wall1 = bpy.context.active_object
    d_wall1.scale = (0.3, 1.0, 4.0)
    d_wall1.data.materials.append(m_wall)

    # Door Frame Header & Posts (runway centered at Y = 0.30)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(3.8, 0.30, 3.2))
    header = bpy.context.active_object
    header.scale = (0.35, 2.4, 0.3)
    header.data.materials.append(m_door_frame)

    # Outside scrap yard props visible through open doorway (placed safely clear of exit runway!):
    for sx, sy in [(6.2, 2.0), (6.5, -1.8)]:
        for tz in range(3):
            bpy.ops.mesh.primitive_torus_add(major_radius=0.75, minor_radius=0.28, location=(sx, sy, 0.28 + tz * 0.52))
            t_obj = bpy.context.active_object
            t_obj.data.materials.append(m_tire)

    bpy.ops.mesh.primitive_cylinder_add(radius=1.2, depth=0.15, location=(7.2, 2.5, 1.5))
    g_obj = bpy.context.active_object
    g_obj.rotation_euler = (0, math.radians(72), 0.3)
    g_obj.data.materials.append(m_rust)

    # Posters on back wall
    for p_name, p_loc, p_scale in [
        ("poster_cybercycle.png", (-2.6, 1.38, 2.2), (1.3, 1.9)),
        ("poster_glyphrider.png", (-0.9, 1.38, 2.3), (1.3, 1.9)),
        ("poster_outlaw.png", (0.9, 1.38, 2.3), (1.3, 1.9)),
    ]:
        p_path = os.path.join(POSTERS_DIR, p_name)
        p_mat = create_image_mat(f"Mat_{p_name}", p_path, roughness=0.35)
        bpy.ops.mesh.primitive_plane_add(size=1.0, location=p_loc)
        p_obj = bpy.context.active_object
        p_obj.rotation_euler = (math.radians(90), 0, 0)
        p_obj.scale = (p_scale[0], p_scale[1], 1.0)
        p_obj.data.materials.append(p_mat)

    # 5. Outlaw Couch
    # Base: Y from -0.60 to +0.60, Z from 0.06 to 0.30
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0.18))
    c_base = bpy.context.active_object
    c_base.scale = (2.8, 1.2, 0.24)
    apply_bevel(c_base, width=0.03)
    c_base.data.materials.append(m_couch_body)
    # Backrest: Y centered at 0.48, extends to Y=0.34 in front
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0.48, 0.68))
    c_back = bpy.context.active_object
    c_back.scale = (2.8, 0.28, 0.72)
    c_back.rotation_euler = (math.radians(-8), 0, 0)
    apply_bevel(c_back, width=0.05)
    c_back.data.materials.append(m_cushion)
    # Arms
    for sign in [-1, 1]:
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(sign * 1.48, 0.05, 0.52))
        arm = bpy.context.active_object
        arm.scale = (0.28, 1.15, 0.48)
        apply_bevel(arm, width=0.04)
        arm.data.materials.append(m_couch_body)
    # Left cushion
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-0.65, -0.06, 0.38))
    cush_l = bpy.context.active_object
    cush_l.scale = (1.2, 0.95, 0.18)
    apply_bevel(cush_l, width=0.04)
    cush_l.data.materials.append(m_cushion)
    # Right cushion (where spring hides!)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.65, -0.06, 0.40))
    cush_r = bpy.context.active_object
    cush_r.scale = (1.2, 0.95, 0.20)
    apply_bevel(cush_r, width=0.04)
    cush_r.data.materials.append(m_cushion)

    # 6. Dynamic Helical Spring inside right cushion (at X=0.98 so it pops beside Red)
    spring_obj = build_helical_spring_mesh(radius=0.10, height=0.72, turns=5)
    spring_obj.location = (0.98, -0.08, 0.42)
    spring_obj.rotation_euler = (math.radians(10), math.radians(-8), math.radians(12))
    spring_obj.data.materials.append(m_spring)

    # 7. CRT TV on crate stand: Located at (-1.6, -1.8, 0.34)
    yaw_tv = math.atan2(2.10, -1.74) # ~130.3 deg
    tv_u = (2.10 / math.hypot(2.10, 1.74), 1.74 / math.hypot(2.10, 1.74))

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-1.6, -1.8, 0.34))
    crate = bpy.context.active_object
    crate.scale = (1.1, 0.85, 0.68)
    crate.rotation_euler = (0, 0, yaw_tv)
    apply_bevel(crate, width=0.02)
    crate.data.materials.append(m_wood)

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-1.6, -1.8, 1.05))
    tv = bpy.context.active_object
    tv.scale = (1.0, 0.80, 0.70)
    tv.rotation_euler = (0, 0, yaw_tv)
    apply_bevel(tv, width=0.03)
    tv.data.materials.append(m_tv_chassis)

    # Place screen plane precisely on the front face of the TV chassis facing the couch
    screen_loc = (-1.6 + 0.405 * tv_u[0], -1.8 + 0.405 * tv_u[1], 1.05)
    bpy.ops.mesh.primitive_plane_add(size=1.0, location=screen_loc)
    screen = bpy.context.active_object
    screen.rotation_euler = (math.radians(90), 0, yaw_tv)
    screen.scale = (0.78, 0.58, 1.0) # Matches 4:3 CRT video aspect ratio

    # TV Screen Material with authentic 2-minute SNES Uniracers gameplay video loop!
    m_tv_screen, bsdf_tv, tex_tv = build_tv_screen_movie_material()
    screen.data.materials.append(m_tv_screen)

    # Rabbit Ear Antenna
    for sign in [-1, 1]:
        bpy.ops.mesh.primitive_cylinder_add(radius=0.007, depth=0.75, location=(-1.6 + sign * 0.14, -1.8, 1.68))
        ant = bpy.context.active_object
        ant.rotation_euler = (math.radians(15), sign * math.radians(-28), 0)
        ant.data.materials.append(m_spring)

    # 8. 10W-40 Vintage Oil Can (on couch right armrest, radius 0.07, depth 0.22)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.07, depth=0.22, location=(1.48, -0.15, 0.87))
    oil_can = bpy.context.active_object
    apply_bevel(oil_can, width=0.008)
    m_oil_label = build_vintage_oil_can_material()
    oil_can.data.materials.append(m_oil_label)

    # Spout on oil can (parented to oil_can for unified transforms)
    bpy.ops.mesh.primitive_cone_add(radius1=0.022, radius2=0.006, depth=0.08, location=(1.48, -0.15, 1.02))
    spout = bpy.context.active_object
    spout.rotation_euler = (math.radians(15), 0, 0)
    spout.data.materials.append(m_spring)
    spout.parent = oil_can

    # Lighting:
    # 1. Warm interior garage tungsten lamp (over couch) - soft, atmospheric
    tungsten_data = bpy.data.lights.new('TungstenLamp', 'POINT')
    tungsten_data.energy = 850.0
    tungsten_data.shadow_soft_size = 0.40
    tungsten_data.color = (1.0, 0.72, 0.42)
    tungsten_obj = bpy.data.objects.new('TungstenLamp', tungsten_data)
    tungsten_obj.location = (0.2, -0.6, 2.6)
    scene.collection.objects.link(tungsten_obj)

    # 2. Glowing CRT TV fill light (flickers onto Red!)
    tv_light_data = bpy.data.lights.new('TVGlow', 'POINT')
    tv_light_data.energy = 0.0 # Off until F218
    tv_light_data.shadow_soft_size = 0.35
    tv_light_data.color = (0.35, 0.75, 1.0)
    tv_light_obj = bpy.data.objects.new('TVGlow', tv_light_data)
    tv_light_obj.location = (-1.0, -1.5, 1.15)
    scene.collection.objects.link(tv_light_obj)

    # 3. Cold exterior moon fill coming through the doorway
    door_light_data = bpy.data.lights.new('DoorMoonFill', 'SPOT')
    door_light_data.energy = 3200.0
    door_light_data.color = (0.35, 0.55, 0.95)
    door_light_data.spot_size = math.radians(65)
    door_light_obj = bpy.data.objects.new('DoorMoonFill', door_light_data)
    door_light_obj.location = (5.5, 0.30, 2.4)
    door_light_obj.rotation_euler = (0, math.radians(-50), math.radians(180))
    scene.collection.objects.link(door_light_obj)

    # Camera
    cam_data = bpy.data.cameras.new("CinemaCamera")
    cam_data.sensor_width = 36
    cam_data.clip_start = 0.05
    cam_data.clip_end = 100.0
    cam_obj = bpy.data.objects.new("CinemaCamera", cam_data)
    scene.collection.objects.link(cam_obj)
    scene.camera = cam_obj

    # Camera Target Empty with TRACK_TO constraint
    cam_target = bpy.data.objects.new("CameraTarget", None)
    cam_target.empty_display_type = 'PLAIN_AXES'
    cam_target.empty_display_size = 0.2
    scene.collection.objects.link(cam_target)

    tt = cam_obj.constraints.new(type='TRACK_TO')
    tt.target = cam_target
    tt.track_axis = 'TRACK_NEGATIVE_Z'
    tt.up_axis = 'UP_Y'

    # Load Red from Canonical uniracer_model.blend
    print(f"Loading Red from canonical blend: {CANONICAL_BLEND}")
    with bpy.data.libraries.load(CANONICAL_BLEND, link=False) as (data_from, data_to):
        data_to.collections = ["New_Uniracer_Model"]

    red_col = data_to.collections[0]
    scene.collection.children.link(red_col)

    # Ensure Red's Frame is Candy Red!
    mat_body = bpy.data.materials.get("Mat_Body")
    if mat_body and mat_body.node_tree:
        bsdf = mat_body.node_tree.nodes.get("Principled BSDF")
        if bsdf:
            bsdf.inputs['Base Color'].default_value = (0.82, 0.015, 0.025, 1.0)
            if 'Metallic' in bsdf.inputs:
                bsdf.inputs['Metallic'].default_value = 0.85
            if 'Roughness' in bsdf.inputs:
                bsdf.inputs['Roughness'].default_value = 0.18

    frame_object_names = [
        "ForkLeg_1", "ForkLeg_-1", "ForkCrown", 
        "Dropout_1", "Dropout_-1", "SeatClamp"
    ]
    for obj in red_col.all_objects:
        if obj.name in frame_object_names and mat_body:
            obj.data.materials.clear()
            obj.data.materials.append(mat_body)

    red_rig = None
    for obj in red_col.all_objects:
        if obj.type == 'ARMATURE':
            red_rig = obj
            break

    if red_rig:
        scale_fac = 0.034
        red_rig.scale = (scale_fac, scale_fac, scale_fac)
        print("Scaled Red armature cleanly to 0.034")

    return cam_obj, cam_target, red_rig, spring_obj, screen, tv_light_data, oil_can, bsdf_tv

def animate_beat2(cam_obj, cam_target, red_rig, spring_obj, screen_obj, tv_light, oil_can, bsdf_tv):
    cam = cam_obj
    rig = red_rig

    pb_wheel = rig.pose.bones.get("Bone_Wheel")
    pb_crank_l = rig.pose.bones.get("Bone_Crank_L")
    pb_crank_r = rig.pose.bones.get("Bone_Crank_R")
    pb_pedal_l = rig.pose.bones.get("Bone_Pedal_L")
    pb_pedal_r = rig.pose.bones.get("Bone_Pedal_R")
    pb_saddle = rig.pose.bones.get("Bone_SaddleHead")
    pb_frame = rig.pose.bones.get("Bone_Frame")

    # =========================================================================
    # SHOT 3 (Frames 1-72, 3.0s): The Threshold Profile
    # Red rolls across the garage doorway threshold from right to left (-X)
    # =========================================================================
    cam.data.lens = 32
    cam.data.keyframe_insert(data_path="lens", frame=1)

    cam.location = (2.6, -1.8, 0.65)
    cam.keyframe_insert(data_path="location", frame=1)
    cam.location = (2.1, -1.7, 0.65)
    cam.keyframe_insert(data_path="location", frame=72)

    cam_target.location = (3.6, 0.30, 0.65)
    cam_target.keyframe_insert(data_path="location", frame=1)
    cam_target.location = (1.2, 0.30, 0.65)
    cam_target.keyframe_insert(data_path="location", frame=72)

    # Red rolls across threshold (X = 3.6 to X = 1.2, Y = 0.30)
    rig.location = (3.6, 0.30, 0.41)
    rig.rotation_euler = (0, 0, math.radians(-90)) # heading -X (left)
    rig.keyframe_insert(data_path="location", frame=1)
    rig.keyframe_insert(data_path="rotation_euler", frame=1)

    rig.location = (1.2, 0.30, 0.41)
    rig.rotation_euler = (0, 0, math.radians(-90))
    rig.keyframe_insert(data_path="location", frame=72)
    rig.keyframe_insert(data_path="rotation_euler", frame=72)

    # Animate forward wheel rotation on Shot 3
    for f in range(1, 73):
        t = (f - 1) / 71.0
        ang = t * (2.4 / 0.41)
        if pb_wheel:
            pb_wheel.rotation_mode = 'XYZ'
            pb_wheel.rotation_euler = (ang, 0, 0)
            pb_wheel.keyframe_insert(data_path="rotation_euler", frame=f)
        if pb_crank_l:
            pb_crank_l.rotation_mode = 'XYZ'
            pb_crank_l.rotation_euler = (ang, 0, 0)
            pb_crank_l.keyframe_insert(data_path="rotation_euler", frame=f)
        if pb_crank_r:
            pb_crank_r.rotation_mode = 'XYZ'
            pb_crank_r.rotation_euler = (ang, 0, 0)
            pb_crank_r.keyframe_insert(data_path="rotation_euler", frame=f)
        if pb_pedal_l:
            pb_pedal_l.rotation_mode = 'XYZ'
            pb_pedal_l.rotation_euler = (-ang, 0, 0)
            pb_pedal_l.keyframe_insert(data_path="rotation_euler", frame=f)
        if pb_pedal_r:
            pb_pedal_r.rotation_mode = 'XYZ'
            pb_pedal_r.rotation_euler = (-ang, 0, 0)
            pb_pedal_r.keyframe_insert(data_path="rotation_euler", frame=f)

    # Spring is hidden/flat
    spring_obj.scale = (1.0, 1.0, 0.02)
    spring_obj.keyframe_insert(data_path="scale", frame=1)
    spring_obj.keyframe_insert(data_path="scale", frame=72)

    # TV is OFF
    if bsdf_tv:
        try:
            bsdf_tv.inputs['Emission Strength'].default_value = 0.0
            bsdf_tv.inputs['Emission Strength'].keyframe_insert(data_path="default_value", frame=1)
            bsdf_tv.inputs['Emission Strength'].keyframe_insert(data_path="default_value", frame=72)
        except KeyError:
            pass

    # =========================================================================
    # SHOT 4 (Frames 73-250, 7.4s): OTS TV Framing -> Couch Hop
    # Red rolls in background, hops on couch (zero clipping!), turns TV ON at F218!
    # =========================================================================
    cam.data.lens = 32
    cam.data.keyframe_insert(data_path="lens", frame=73)

    # Over the TV chassis: TV at (-1.6, -1.8, 1.05)
    cam.location = (-1.2, -2.8, 1.48)
    cam.keyframe_insert(data_path="location", frame=73)
    cam.location = (-1.1, -2.7, 1.45)
    cam.keyframe_insert(data_path="location", frame=250)

    cam_target.location = (2.0, 0.30, 0.70)
    cam_target.keyframe_insert(data_path="location", frame=73)
    cam_target.location = (0.65, -1.05, 0.70)
    cam_target.keyframe_insert(data_path="location", frame=140)
    cam_target.location = (0.65, -0.15, 0.95)
    cam_target.keyframe_insert(data_path="location", frame=188)
    cam_target.location = (-0.3, -1.1, 1.05)
    cam_target.keyframe_insert(data_path="location", frame=250)

    # Red enters deep background (X = 2.2, Y = 0.40) -> curves around couch armrest onto front rug
    rig.location = (2.2, 0.40, 0.41)
    rig.rotation_euler = (0, 0, math.radians(-115))
    rig.keyframe_insert(data_path="location", frame=73)
    rig.keyframe_insert(data_path="rotation_euler", frame=73)

    # Waypoint 1 (F100): Rolls past the outside right flank of the couch (X = 2.05, Y = -0.65, well clear of armrest)
    rig.location = (2.05, -0.65, 0.41)
    rig.rotation_euler = (0, 0, math.radians(-135))
    rig.keyframe_insert(data_path="location", frame=100)
    rig.keyframe_insert(data_path="rotation_euler", frame=100)

    # Waypoint 2 (F120): Smooth arc around the front corner of the armrest onto the front rug (X = 1.45, Y = -1.15)
    rig.location = (1.45, -1.15, 0.41)
    rig.rotation_euler = (0, 0, math.radians(-160))
    rig.keyframe_insert(data_path="location", frame=120)
    rig.keyframe_insert(data_path="rotation_euler", frame=120)

    # Arrival (F140): Pulls up smoothly on the rug in front of the right cushion facing couch (+Y)
    rig.location = (0.65, -1.05, 0.41)
    rig.rotation_euler = (0, 0, math.radians(-180)) # facing +Y (towards couch)
    rig.keyframe_insert(data_path="location", frame=140)
    rig.keyframe_insert(data_path="rotation_euler", frame=140)

    # Couch Hop preparation (crouch anticipation)
    rig.location = (0.65, -1.05, 0.35)
    rig.keyframe_insert(data_path="location", frame=155)

    # Hop parabolic trajectory - High athletic leap!
    # Apex at F170: Y = -0.60, Z = 1.30 (wheel bottom at 0.89m, well above cushion at 0.50m!)
    rig.location = (0.65, -0.60, 1.30)
    rig.keyframe_insert(data_path="location", frame=170)

    # Lands on right couch cushion at Y = -0.15 (safe from backrest at Y = 0.34!)
    rig.location = (0.65, -0.15, 0.88)
    rig.rotation_euler = (math.radians(8), 0, math.radians(-175))
    rig.keyframe_insert(data_path="location", frame=188)
    rig.keyframe_insert(data_path="rotation_euler", frame=188)

    # Cushion rebound to resting position
    rig.location = (0.65, -0.15, 0.90)
    rig.keyframe_insert(data_path="location", frame=196)

    # Stays on couch, turns toward TV to click power knob at F215
    rig.location = (0.65, -0.15, 0.90)
    rig.keyframe_insert(data_path="location", frame=250)

    # Saddle head clicks TV knob
    if pb_saddle:
        pb_saddle.rotation_mode = 'XYZ'
        pb_saddle.rotation_euler = (0, 0, 0)
        pb_saddle.keyframe_insert(data_path="rotation_euler", frame=73)
        pb_saddle.keyframe_insert(data_path="rotation_euler", frame=195)
        # Reaches forward toward TV
        pb_saddle.rotation_euler = (math.radians(-15), 0, math.radians(-25))
        pb_saddle.keyframe_insert(data_path="rotation_euler", frame=215)
        pb_saddle.rotation_euler = (0, 0, 0)
        pb_saddle.keyframe_insert(data_path="rotation_euler", frame=235)

    # TV Light & CRT Screen CLICK ON at Frame 218!
    tv_light.energy = 0.0
    tv_light.keyframe_insert(data_path="energy", frame=1)
    tv_light.keyframe_insert(data_path="energy", frame=217)
    tv_light.energy = 650.0 # CRT flashes on!
    tv_light.keyframe_insert(data_path="energy", frame=218)
    tv_light.energy = 420.0
    tv_light.keyframe_insert(data_path="energy", frame=250)

    if bsdf_tv:
        try:
            bsdf_tv.inputs['Emission Strength'].default_value = 0.0
            bsdf_tv.inputs['Emission Strength'].keyframe_insert(data_path="default_value", frame=217)
            bsdf_tv.inputs['Emission Strength'].default_value = 1.4
            bsdf_tv.inputs['Emission Strength'].keyframe_insert(data_path="default_value", frame=218)
            bsdf_tv.inputs['Emission Strength'].default_value = 1.15
            bsdf_tv.inputs['Emission Strength'].keyframe_insert(data_path="default_value", frame=250)
        except KeyError:
            pass

    # Spring still hidden
    spring_obj.scale = (1.0, 1.0, 0.02)
    spring_obj.keyframe_insert(data_path="scale", frame=250)

    # =========================================================================
    # SHOT 5 (Frames 251-335, 3.5s): The Spring Pop & Pantomime Emotes
    # PTWANG! Spring bursts through right cushion. Red pops up, shakes head 'no'.
    # =========================================================================
    cam.data.lens = 40
    cam.data.keyframe_insert(data_path="lens", frame=251)

    # 3/4 cinematic angle from front-left
    cam.location = (-0.5, -2.1, 1.15)
    cam.keyframe_insert(data_path="location", frame=251)
    cam.location = (-0.4, -2.0, 1.15)
    cam.keyframe_insert(data_path="location", frame=335)

    cam_target.location = (0.55, -0.15, 1.10)
    cam_target.keyframe_insert(data_path="location", frame=251)
    cam_target.keyframe_insert(data_path="location", frame=335)

    # Spring bursts out violently at Frame 258!
    spring_obj.scale = (1.0, 1.0, 0.02)
    spring_obj.keyframe_insert(data_path="scale", frame=257)
    spring_obj.scale = (1.0, 1.0, 1.18) # Overshoot burst!
    spring_obj.keyframe_insert(data_path="scale", frame=262)
    spring_obj.scale = (1.0, 1.0, 0.86)
    spring_obj.keyframe_insert(data_path="scale", frame=269)
    spring_obj.scale = (1.0, 1.0, 1.06)
    spring_obj.keyframe_insert(data_path="scale", frame=278)
    spring_obj.scale = (1.0, 1.0, 0.98)
    spring_obj.keyframe_insert(data_path="scale", frame=288)
    spring_obj.scale = (1.0, 1.0, 1.00)
    spring_obj.keyframe_insert(data_path="scale", frame=300)

    # Red pops up in surprise at Frame 258!
    rig.location = (0.65, -0.15, 0.90)
    rig.keyframe_insert(data_path="location", frame=257)
    rig.location = (0.65, -0.15, 1.25) # Pop up in air!
    rig.rotation_euler = (math.radians(-15), math.radians(8), math.radians(-170))
    rig.keyframe_insert(data_path="location", frame=262)
    rig.keyframe_insert(data_path="rotation_euler", frame=262)

    # Lands back down on couch beside the spring
    rig.location = (0.50, -0.15, 0.88)
    rig.rotation_euler = (math.radians(6), math.radians(-6), math.radians(-175))
    rig.keyframe_insert(data_path="location", frame=272)
    rig.keyframe_insert(data_path="rotation_euler", frame=272)
    rig.location = (0.50, -0.15, 0.88)
    rig.keyframe_insert(data_path="location", frame=335)

    # Pantomime Acting:
    # 1. Head shake "no" (Frames 280 to 310)
    if pb_saddle:
        pb_saddle.rotation_mode = 'XYZ'
        pb_saddle.rotation_euler = (0, 0, 0)
        pb_saddle.keyframe_insert(data_path="rotation_euler", frame=278)
        pb_saddle.rotation_euler = (0, 0, math.radians(-24)) # shake left
        pb_saddle.keyframe_insert(data_path="rotation_euler", frame=284)
        pb_saddle.rotation_euler = (0, 0, math.radians(24)) # shake right
        pb_saddle.keyframe_insert(data_path="rotation_euler", frame=290)
        pb_saddle.rotation_euler = (0, 0, math.radians(-16)) # shake left
        pb_saddle.keyframe_insert(data_path="rotation_euler", frame=296)
        pb_saddle.rotation_euler = (0, 0, math.radians(12)) # shake right
        pb_saddle.keyframe_insert(data_path="rotation_euler", frame=302)
        pb_saddle.rotation_euler = (0, 0, 0)
        pb_saddle.keyframe_insert(data_path="rotation_euler", frame=308)

        # 2. Exasperated eye-roll & sigh (Frames 312 to 335)
        pb_saddle.rotation_euler = (math.radians(-18), 0, 0) # dip down
        pb_saddle.keyframe_insert(data_path="rotation_euler", frame=316)
        pb_saddle.rotation_euler = (math.radians(8), math.radians(-12), math.radians(-10)) # circle right
        pb_saddle.keyframe_insert(data_path="rotation_euler", frame=324)
        pb_saddle.rotation_euler = (math.radians(20), 0, 0) # look up / sigh
        pb_saddle.keyframe_insert(data_path="rotation_euler", frame=330)
        pb_saddle.rotation_euler = (math.radians(4), 0, 0) # settle into slouch
        pb_saddle.keyframe_insert(data_path="rotation_euler", frame=335)

    if pb_frame:
        pb_frame.rotation_mode = 'XYZ'
        pb_frame.rotation_euler = (0, 0, 0)
        pb_frame.keyframe_insert(data_path="rotation_euler", frame=257)
        pb_frame.rotation_euler = (math.radians(8), 0, 0)
        pb_frame.keyframe_insert(data_path="rotation_euler", frame=330)
        pb_frame.rotation_euler = (math.radians(3), 0, 0)
        pb_frame.keyframe_insert(data_path="rotation_euler", frame=335)

    # =========================================================================
    # CONTINUOUS CAMERA ORBIT (Frames 335 to 410, 75 frames, 3.1s):
    # Camera sweeps in a smooth, majestic 3D arc around Red from front-left
    # to the OTS master framing showing both Red and the glowing CRT TV! No jump-cut!
    # =========================================================================
    cam.location = (-0.40, -2.00, 1.15)
    cam.keyframe_insert(data_path="location", frame=335)
    cam.location = (0.45, -1.55, 1.22)
    cam.keyframe_insert(data_path="location", frame=360)
    cam.location = (1.35, -0.85, 1.28)
    cam.keyframe_insert(data_path="location", frame=385)
    cam.location = (1.90, -0.10, 1.30)
    cam.keyframe_insert(data_path="location", frame=410)

    # Smooth target pan:
    cam_target.location = (0.55, -0.15, 1.10)
    cam_target.keyframe_insert(data_path="location", frame=335)
    cam_target.location = (0.35, -0.65, 1.05)
    cam_target.keyframe_insert(data_path="location", frame=360)
    cam_target.location = (0.05, -0.80, 0.95)
    cam_target.keyframe_insert(data_path="location", frame=385)
    cam_target.location = (-0.30, -1.00, 0.90)
    cam_target.keyframe_insert(data_path="location", frame=410)

    # =========================================================================
    # SHOT 6 (Frames 410-580, 7.1s): OTS 1/3 Rule Framing, Video Playback & Oil Chug
    # CRT TV playing Uniracers video is on left 2/3, Red is on right 1/3.
    # Red scoots, pedal-flicks the oil can, balances on fork, drinks, sets back down!
    # =========================================================================
    cam.data.lens = 32
    cam.data.keyframe_insert(data_path="lens", frame=410)

    # Gentle breathing dolly during Shot 6
    cam.location = (1.90, -0.10, 1.30)
    cam.keyframe_insert(data_path="location", frame=410)
    cam.location = (1.85, -0.15, 1.28)
    cam.keyframe_insert(data_path="location", frame=580)

    cam_target.location = (-0.30, -1.00, 0.90)
    cam_target.keyframe_insert(data_path="location", frame=410)
    cam_target.keyframe_insert(data_path="location", frame=580)

    # TV Light flicker on Red
    for f_flicker in range(361, 581, 12):
        fl_val = 280.0 + (f_flicker % 5) * 35.0
        tv_light.energy = fl_val
        tv_light.keyframe_insert(data_path="energy", frame=f_flicker)

    # Oil Can Initial Position on couch right armrest
    oil_can.location = (1.48, -0.15, 0.87)
    oil_can.rotation_euler = (0, 0, 0)
    oil_can.keyframe_insert(data_path="location", frame=1)
    oil_can.keyframe_insert(data_path="rotation_euler", frame=1)
    oil_can.keyframe_insert(data_path="location", frame=460)
    oil_can.keyframe_insert(data_path="rotation_euler", frame=460)

    # Red relaxes until F440
    rig.location = (0.50, -0.15, 0.88)
    rig.rotation_euler = (math.radians(6), 0, math.radians(-175))
    rig.keyframe_insert(data_path="location", frame=335)
    rig.keyframe_insert(data_path="rotation_euler", frame=335)
    rig.keyframe_insert(data_path="location", frame=440)
    rig.keyframe_insert(data_path="rotation_euler", frame=440)

    # F440-465: Red glances right at oil can, scoots sideways toward armrest (X = 0.50 -> 1.05)
    rig.location = (1.05, -0.15, 0.88)
    rig.rotation_euler = (math.radians(4), math.radians(-16), math.radians(-160)) # leans towards armrest
    rig.keyframe_insert(data_path="location", frame=465)
    rig.keyframe_insert(data_path="rotation_euler", frame=465)

    # F465-475: Right pedal reaches down to hook the can
    if pb_crank_r and pb_pedal_r:
        pb_crank_r.rotation_mode = 'XYZ'
        pb_crank_r.rotation_euler = (math.radians(-40), 0, 0)
        pb_crank_r.keyframe_insert(data_path="rotation_euler", frame=465)
        # Flick crank up sharply!
        pb_crank_r.rotation_euler = (math.radians(65), 0, 0)
        pb_crank_r.keyframe_insert(data_path="rotation_euler", frame=476)
        pb_crank_r.rotation_euler = (0, 0, 0)
        pb_crank_r.keyframe_insert(data_path="rotation_euler", frame=490)

    # F475-485: Pedal flick launches oil can into an acrobatic flip!
    oil_can.location = (1.28, -0.18, 1.25) # Flip peak
    oil_can.rotation_euler = (math.radians(-35), math.radians(15), math.radians(-20))
    oil_can.keyframe_insert(data_path="location", frame=480)
    oil_can.keyframe_insert(data_path="rotation_euler", frame=480)

    # F485-500: Red's fork crown catches/balances the can over his headset
    oil_can.location = (0.95, -0.22, 1.15)
    oil_can.rotation_euler = (math.radians(-65), math.radians(20), math.radians(-35))
    oil_can.keyframe_insert(data_path="location", frame=490)
    oil_can.keyframe_insert(data_path="rotation_euler", frame=490)

    # F500-530: Rhythmic Chug! Red tilts saddle head back, taking 3 hearty gulps
    if pb_saddle:
        pb_saddle.rotation_euler = (math.radians(18), 0, math.radians(-15))
        pb_saddle.keyframe_insert(data_path="rotation_euler", frame=495)
        # 3 gulp bobs
        pb_saddle.rotation_euler = (math.radians(24), 0, math.radians(-15))
        pb_saddle.keyframe_insert(data_path="rotation_euler", frame=505)
        pb_saddle.rotation_euler = (math.radians(18), 0, math.radians(-15))
        pb_saddle.keyframe_insert(data_path="rotation_euler", frame=512)
        pb_saddle.rotation_euler = (math.radians(24), 0, math.radians(-15))
        pb_saddle.keyframe_insert(data_path="rotation_euler", frame=520)
        pb_saddle.rotation_euler = (0, 0, 0)
        pb_saddle.keyframe_insert(data_path="rotation_euler", frame=540)

    # Oil can bobs rhythmically with gulps
    oil_can.location = (0.95, -0.22, 1.18)
    oil_can.keyframe_insert(data_path="location", frame=505)
    oil_can.location = (0.95, -0.22, 1.15)
    oil_can.keyframe_insert(data_path="location", frame=512)
    oil_can.location = (0.95, -0.22, 1.18)
    oil_can.keyframe_insert(data_path="location", frame=520)
    oil_can.location = (0.95, -0.22, 1.15)
    oil_can.keyframe_insert(data_path="location", frame=528)

    # F530-550: Red lowers can and sets it firmly back down onto the armrest
    oil_can.location = (1.48, -0.15, 0.87)
    oil_can.rotation_euler = (0, 0, 0)
    oil_can.keyframe_insert(data_path="location", frame=550)
    oil_can.keyframe_insert(data_path="rotation_euler", frame=550)
    oil_can.keyframe_insert(data_path="location", frame=720)
    oil_can.keyframe_insert(data_path="rotation_euler", frame=720)

    # F550-575: Red scoots back to center couch cushion, relaxing into posture
    rig.location = (0.50, -0.15, 0.88)
    rig.rotation_euler = (math.radians(6), 0, math.radians(-175))
    rig.keyframe_insert(data_path="location", frame=575)
    rig.keyframe_insert(data_path="rotation_euler", frame=575)
    rig.keyframe_insert(data_path="location", frame=626)
    rig.keyframe_insert(data_path="rotation_euler", frame=626)

    # =========================================================================
    # SHOT 7 (Frames 581-720, 5.8s): The Noise Outside & Forward Roll Out
    # Noise echoes outside. Red perches alert, hops off couch clearing base,
    # turns +X, and rolls forward out the doorway! Camera holds on empty room.
    # =========================================================================
    cam.data.lens = 35
    cam.data.keyframe_insert(data_path="lens", frame=581)

    # Wide stationary master angle showing TV, couch, and doorway
    cam.location = (-1.2, -2.4, 1.35)
    cam.keyframe_insert(data_path="location", frame=581)
    cam.keyframe_insert(data_path="location", frame=720)

    cam_target.location = (1.6, -0.2, 0.85)
    cam_target.keyframe_insert(data_path="location", frame=581)
    cam_target.keyframe_insert(data_path="location", frame=720)

    # Frame 600: NOISE OUTSIDE!
    # Red's saddle head perches alertly with natural anticipation
    if pb_saddle:
        pb_saddle.rotation_euler = (0, 0, 0)
        pb_saddle.keyframe_insert(data_path="rotation_euler", frame=598)
        # Snap head towards door (+75 deg yaw, perked pitch +12 deg, roll 10 deg)
        pb_saddle.rotation_euler = (math.radians(12), math.radians(10), math.radians(75))
        pb_saddle.keyframe_insert(data_path="rotation_euler", frame=606)
        pb_saddle.keyframe_insert(data_path="rotation_euler", frame=624)
        pb_saddle.rotation_euler = (0, 0, 0)
        pb_saddle.keyframe_insert(data_path="rotation_euler", frame=632)

    # Frame 626: Red hops down off the couch!
    # Launch push-off
    rig.location = (0.50, -0.15, 0.88)
    rig.keyframe_insert(data_path="location", frame=626)

    # High leap forward-up: Apex at F635: Y = -0.70, Z = 1.28
    # Wheel bottom at Z = 0.87m, completely clearing the couch base edge at Y = -0.60!
    rig.location = (0.60, -0.70, 1.28)
    rig.keyframe_insert(data_path="location", frame=635)

    # Lands out on the rug at Y = -1.20 (0.60m past couch base!)
    rig.location = (0.75, -1.20, 0.38) # Cushion compression on rug
    rig.rotation_euler = (0, 0, math.radians(-180))
    rig.keyframe_insert(data_path="location", frame=644)
    rig.keyframe_insert(data_path="rotation_euler", frame=644)

    # Tire rebound to normal standing height
    rig.location = (0.75, -1.20, 0.41)
    rig.keyframe_insert(data_path="location", frame=650)

    # F650-664: Smooth pivot to face doorway heading (+X)
    rig.location = (0.75, -1.20, 0.41)
    rig.rotation_euler = (0, 0, math.radians(90)) # Heading +X
    rig.keyframe_insert(data_path="location", frame=664)
    rig.keyframe_insert(data_path="rotation_euler", frame=664)

    # F665 to F715: Accelerates forward along clean runway through doorway (Y = 0.30)
    rig.location = (1.80, -0.50, 0.41)
    rig.keyframe_insert(data_path="location", frame=682)

    # Doorway threshold (X = 3.80, Y = 0.30)
    rig.location = (3.80, 0.30, 0.41)
    rig.keyframe_insert(data_path="location", frame=700)

    # Clear through into scrap yard (X = 5.80)
    rig.location = (5.80, 0.30, 0.41)
    rig.keyframe_insert(data_path="location", frame=714)

    # Completely offstage into the dark yard by Frame 720
    rig.location = (6.80, 0.30, 0.41)
    rig.keyframe_insert(data_path="location", frame=720)

    # Animate wheel rolling FORWARD (+ang) towards +X!
    for f in range(665, 721):
        t = (f - 665) / 55.0
        ang = t * (6.05 / 0.41)
        if pb_wheel:
            pb_wheel.rotation_mode = 'XYZ'
            pb_wheel.rotation_euler = (ang, 0, 0)
            pb_wheel.keyframe_insert(data_path="rotation_euler", frame=f)
        if pb_crank_l:
            pb_crank_l.rotation_mode = 'XYZ'
            pb_crank_l.rotation_euler = (ang, 0, 0)
            pb_crank_l.keyframe_insert(data_path="rotation_euler", frame=f)
        if pb_crank_r:
            pb_crank_r.rotation_mode = 'XYZ'
            pb_crank_r.rotation_euler = (ang, 0, 0)
            pb_crank_r.keyframe_insert(data_path="rotation_euler", frame=f)
        if pb_pedal_l:
            pb_pedal_l.rotation_mode = 'XYZ'
            pb_pedal_l.rotation_euler = (-ang, 0, 0)
            pb_pedal_l.keyframe_insert(data_path="rotation_euler", frame=f)
        if pb_pedal_r:
            pb_pedal_r.rotation_mode = 'XYZ'
            pb_pedal_r.rotation_euler = (-ang, 0, 0)
            pb_pedal_r.keyframe_insert(data_path="rotation_euler", frame=f)

def render_beat2(frame_list=None):
    scene = bpy.context.scene
    frames_to_render = frame_list if frame_list else list(range(scene.frame_start, scene.frame_end + 1))
    total_frames = len(frames_to_render)
    print(f"🎬 Starting render of Beat 2 ({total_frames} frames) to {OUTPUT_DIR}...")
    
    for idx, f in enumerate(frames_to_render, 1):
        scene.frame_set(f)
        scene.render.filepath = os.path.join(OUTPUT_DIR, f"frame_{f:04d}.png")
        bpy.ops.render.render(write_still=True)
        if idx % 30 == 0 or idx == total_frames:
            pct = (idx / float(total_frames)) * 100.0
            print(f"  Rendered Frame {f} [{idx}/{total_frames}] ({pct:.1f}%)")
            
    print("✅ Beat 2 frames rendered successfully!")

if __name__ == "__main__":
    cam_obj, cam_target, red_rig, spring_obj, screen_obj, tv_light, oil_can, bsdf_tv = setup_garage_scene()
    animate_beat2(cam_obj, cam_target, red_rig, spring_obj, screen_obj, tv_light, oil_can, bsdf_tv)
    
    target_frames = None
    if "--" in sys.argv:
        args = sys.argv[sys.argv.index("--") + 1:]
        for i, arg in enumerate(args):
            if arg == "--frames" and i + 1 < len(args):
                target_frames = [int(x.strip()) for x in args[i + 1].split(",") if x.strip()]
            elif arg == "--test-shots":
                target_frames = [36, 170, 240, 360, 480, 510, 635, 680]
                
    render_beat2(frame_list=target_frames)
