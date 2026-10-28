# scripts/tools/film_act1_cinematic_master.py
"""
film_act1_cinematic_master.py
-----------------------------
Master Headless Blender Filming Engine for Act 1: "The Scrap Yard Awakening".
Filmed on the bespoke 1990s Outlaw Hideout set:
- 80s Couch with plush cushions and dynamic popping spring
- 36" CRT TV facing the couch with electric cyan screen glow & static flash
- 4 retro 90s game posters (Super Cyber-Cycle 64, GlyphRider, Radical Racer, Outlaw Unicycle)
- Diamond garage rug, 10W-40 tin can, oil puddle, burn barrel with fire glow
- Canonical Red Uniracer Hero with horizontal pedals, chrome rims, and expressive acting
- 360 frames @ 24fps (15.0 seconds) across 5 cinematic shots
"""

import bpy
import math
import os
import sys
from mathutils import Vector, Quaternion, Matrix, Euler

WORKSPACE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
RED_BLEND = os.path.join(WORKSPACE_ROOT, "models", "uniracer_model.blend")
POSTERS_DIR = os.path.join(WORKSPACE_ROOT, "apps", "web", "public", "textures", "posters")
OUTPUT_DIR = os.path.join(WORKSPACE_ROOT, "temp_studio_frames", "act1_master")
os.makedirs(OUTPUT_DIR, exist_ok=True)

def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    if not bpy.data.collections:
        col = bpy.data.collections.new("Collection")
        bpy.context.scene.collection.children.link(col)

def create_mat(name, color, roughness=0.5, metalness=0.0, emission=(0,0,0,1), emission_strength=0.0):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs['Base Color'].default_value = color
        bsdf.inputs['Roughness'].default_value = roughness
        bsdf.inputs['Metallic'].default_value = metalness
        if 'Emission Color' in bsdf.inputs:
            bsdf.inputs['Emission Color'].default_value = emission
            bsdf.inputs['Emission Strength'].default_value = emission_strength
        elif 'Emission' in bsdf.inputs:
            bsdf.inputs['Emission'].default_value = emission
    return mat

def create_image_mat(name, img_path, roughness=0.4):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    bsdf = nodes.get("Principled BSDF")
    if os.path.exists(img_path):
        tex_node = nodes.new('ShaderNodeTexImage')
        tex_node.image = bpy.data.images.load(img_path)
        links.new(tex_node.outputs['Color'], bsdf.inputs['Base Color'])
        bsdf.inputs['Roughness'].default_value = roughness
    return mat

def apply_bevel(obj, width=0.03, segments=2):
    mod = obj.modifiers.new(name="Bevel", type='BEVEL')
    mod.width = width
    mod.segments = segments
    mod.limit_method = 'ANGLE'
    for poly in obj.data.polygons:
        poly.use_smooth = True

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

def setup_scene():
    reset_scene()
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_EEVEE'
    scene.render.resolution_x = 1280
    scene.render.resolution_y = 720
    scene.frame_start = 1
    scene.frame_end = 360

    # Ambient World
    world = scene.world or bpy.data.worlds.new("World")
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs[0].default_value = (0.05, 0.07, 0.11, 1.0)
        bg.inputs[1].default_value = 0.60

    # Materials
    m_floor = create_mat("FloorMat", (0.13, 0.14, 0.16, 1.0), roughness=0.72, metalness=0.18)
    m_wall = create_mat("BackdropWall", (0.16, 0.14, 0.12, 1.0), roughness=0.85, metalness=0.1)
    m_wood = create_mat("WoodMat", (0.28, 0.18, 0.11, 1.0), roughness=0.75)
    m_couch_body = create_mat("CouchBody", (0.16, 0.20, 0.15, 1.0), roughness=0.82)
    m_cushion = create_mat("CouchCushion", (0.22, 0.28, 0.20, 1.0), roughness=0.85)
    m_tv_chassis = create_mat("TVChassis", (0.10, 0.10, 0.11, 1.0), roughness=0.45, metalness=0.2)
    m_tv_screen = create_mat("TVScreen", (0.20, 0.75, 0.95, 1.0), roughness=0.08, emission=(0.10, 0.65, 0.95, 1.0), emission_strength=1.5)
    m_spring = create_mat("SpringSteel", (0.85, 0.88, 0.92, 1.0), roughness=0.18, metalness=0.95)
    m_oil_can = create_mat("OilCan", (0.85, 0.15, 0.12, 1.0), roughness=0.35, metalness=0.25)
    m_puddle = create_mat("OilPuddle", (0.02, 0.02, 0.02, 1.0), roughness=0.02, metalness=0.95)
    m_barrel = create_mat("BurnBarrel", (0.28, 0.18, 0.12, 1.0), roughness=0.75, metalness=0.5)

    # 1. Floor
    bpy.ops.mesh.primitive_plane_add(size=24.0, location=(0, 0, 0))
    floor = bpy.context.active_object
    floor.data.materials.append(m_floor)

    # 2. Garage Rug
    rug_path = os.path.join(POSTERS_DIR, "rug_garage.png")
    m_rug = create_image_mat("RugMat", rug_path, roughness=0.9)
    bpy.ops.mesh.primitive_plane_add(size=1.0, location=(0, -0.9, 0.005))
    rug = bpy.context.active_object
    rug.scale = (3.6, 2.4, 1.0)
    rug.data.materials.append(m_rug)

    # 3. Backdrop Wall behind couch
    bpy.ops.mesh.primitive_plane_add(size=1.0, location=(0, 1.4, 2.0))
    wall = bpy.context.active_object
    wall.rotation_euler = (math.radians(90), 0, 0)
    wall.scale = (12.0, 4.0, 1.0)
    wall.data.materials.append(m_wall)

    # 4. Posters
    posters = [
        ("poster_cybercycle.png", (-2.8, 1.38, 2.2), (1.4, 2.1)),
        ("poster_glyphrider.png", (-0.95, 1.38, 2.3), (1.4, 2.1)),
        ("poster_outlaw.png", (0.95, 1.38, 2.3), (1.4, 2.1)),
        ("poster_radical.png", (2.8, 1.38, 2.2), (1.4, 2.1))
    ]
    for p_name, p_loc, p_scale in posters:
        p_path = os.path.join(POSTERS_DIR, p_name)
        p_mat = create_image_mat(f"Mat_{p_name}", p_path, roughness=0.35)
        bpy.ops.mesh.primitive_plane_add(size=1.0, location=p_loc)
        p_obj = bpy.context.active_object
        p_obj.rotation_euler = (math.radians(90), 0, 0)
        p_obj.scale = (p_scale[0], p_scale[1], 1.0)
        p_obj.data.materials.append(p_mat)

    # 5. Outlaw Couch
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0.18))
    c_base = bpy.context.active_object
    c_base.scale = (2.8, 1.2, 0.24)
    apply_bevel(c_base, width=0.03)
    c_base.data.materials.append(m_couch_body)

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0.48, 0.68))
    c_back = bpy.context.active_object
    c_back.scale = (2.8, 0.28, 0.72)
    c_back.rotation_euler = (math.radians(-8), 0, 0)
    apply_bevel(c_back, width=0.05)
    c_back.data.materials.append(m_cushion)

    for sign in [-1, 1]:
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(sign * 1.48, 0.05, 0.52))
        arm = bpy.context.active_object
        arm.scale = (0.28, 1.15, 0.48)
        apply_bevel(arm, width=0.04)
        arm.data.materials.append(m_couch_body)

    # Cushions
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-0.65, -0.06, 0.38))
    cush_l = bpy.context.active_object
    cush_l.scale = (1.2, 0.95, 0.18)
    apply_bevel(cush_l, width=0.04)
    cush_l.data.materials.append(m_cushion)

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.65, -0.06, 0.40))
    cush_r = bpy.context.active_object
    cush_r.scale = (1.2, 0.95, 0.20)
    apply_bevel(cush_r, width=0.04)
    cush_r.data.materials.append(m_cushion)

    # 6. Dynamic Helical Spring inside right cushion
    spring_obj = build_helical_spring_mesh(radius=0.10, height=0.75, turns=5)
    spring_obj.location = (0.65, -0.05, 0.42)
    spring_obj.rotation_euler = (math.radians(10), math.radians(-8), math.radians(12))
    spring_obj.data.materials.append(m_spring)

    # Animate Spring: hidden/flat at F1-125, bursts out at F128, oscillating decay to F165
    spring_obj.scale = (1.0, 1.0, 0.05)
    spring_obj.keyframe_insert(data_path="scale", frame=1)
    spring_obj.keyframe_insert(data_path="scale", frame=125)

    # Spring pops out!
    spring_obj.scale = (1.0, 1.0, 1.15) # Overshoot
    spring_obj.keyframe_insert(data_path="scale", frame=129)
    spring_obj.scale = (1.0, 1.0, 0.88)
    spring_obj.keyframe_insert(data_path="scale", frame=135)
    spring_obj.scale = (1.0, 1.0, 1.04)
    spring_obj.keyframe_insert(data_path="scale", frame=142)
    spring_obj.scale = (1.0, 1.0, 0.98)
    spring_obj.keyframe_insert(data_path="scale", frame=150)
    spring_obj.scale = (1.0, 1.0, 1.00)
    spring_obj.keyframe_insert(data_path="scale", frame=160)

    # 7. CRT TV on crate stand: Located at (-1.6, -1.8, 0.34), yaw 40 deg
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-1.6, -1.8, 0.34))
    crate = bpy.context.active_object
    crate.scale = (1.1, 0.85, 0.68)
    crate.rotation_euler = (0, 0, math.radians(40))
    apply_bevel(crate, width=0.02)
    crate.data.materials.append(m_wood)

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-1.6, -1.8, 1.05))
    tv = bpy.context.active_object
    tv.scale = (1.0, 0.80, 0.70)
    tv.rotation_euler = (0, 0, math.radians(40))
    apply_bevel(tv, width=0.03)
    tv.data.materials.append(m_tv_chassis)

    rad40 = math.radians(40)
    bpy.ops.mesh.primitive_plane_add(size=1.0, location=(-1.6 + 0.36 * math.sin(rad40), -1.8 + 0.36 * math.cos(rad40), 1.05))
    screen = bpy.context.active_object
    screen.rotation_euler = (math.radians(-90), 0, rad40)
    screen.scale = (0.78, 0.56, 1.0)
    screen.data.materials.append(m_tv_screen)

    for sign in [-1, 1]:
        bpy.ops.mesh.primitive_cylinder_add(radius=0.007, depth=0.75, location=(-1.6 + sign * 0.14, -1.8, 1.68))
        ant = bpy.context.active_object
        ant.rotation_euler = (math.radians(15), sign * math.radians(-28), 0)
        ant.data.materials.append(m_spring)

    # 8. Clutter
    bpy.ops.mesh.primitive_cylinder_add(radius=0.12, depth=0.35, location=(0.85, -1.5, 0.17))
    can = bpy.context.active_object
    can.data.materials.append(m_oil_can)

    bpy.ops.mesh.primitive_plane_add(size=1.0, location=(0.95, -1.45, 0.008))
    puddle = bpy.context.active_object
    puddle.scale = (0.6, 0.45, 1.0)
    puddle.data.materials.append(m_puddle)

    bpy.ops.mesh.primitive_cylinder_add(radius=0.4, depth=1.1, location=(-3.8, 0.2, 0.55))
    barrel = bpy.context.active_object
    barrel.data.materials.append(m_barrel)

    # Lights
    shop_light = bpy.data.lights.new(name="ShopLight", type='POINT')
    shop_light.energy = 220.0
    shop_light.color = (1.0, 0.88, 0.70)
    shop_obj = bpy.data.objects.new("ShopLight", shop_light)
    shop_obj.location = (0, -0.4, 3.0)
    bpy.context.scene.collection.objects.link(shop_obj)

    # TV Light (Keyframed: low at F1-65, explosive burst at F66, pulsing cyan F66-360)
    tv_light = bpy.data.lights.new(name="TVLight", type='POINT')
    tv_light.color = (0.15, 0.75, 1.0)
    tv_obj = bpy.data.objects.new("TVLight", tv_light)
    tv_obj.location = (-1.2, -1.4, 1.1)
    bpy.context.scene.collection.objects.link(tv_obj)

    tv_light.energy = 20.0
    tv_light.keyframe_insert(data_path="energy", frame=1)
    tv_light.keyframe_insert(data_path="energy", frame=65)
    tv_light.energy = 320.0 # Cathode flash!
    tv_light.keyframe_insert(data_path="energy", frame=68)
    tv_light.energy = 180.0
    tv_light.keyframe_insert(data_path="energy", frame=75)
    tv_light.keyframe_insert(data_path="energy", frame=360)

    # Fire Light
    fire_light = bpy.data.lights.new(name="FireLight", type='POINT')
    fire_light.energy = 120.0
    fire_light.color = (1.0, 0.35, 0.05)
    fire_obj = bpy.data.objects.new("FireLight", fire_light)
    fire_obj.location = (-3.8, 0.2, 1.2)
    bpy.context.scene.collection.objects.link(fire_obj)

    sun_light = bpy.data.lights.new(name="SunFill", type='SUN')
    sun_light.energy = 1.0
    sun_light.color = (0.60, 0.75, 1.0)
    sun_obj = bpy.data.objects.new("SunFill", sun_light)
    sun_obj.rotation_euler = (math.radians(45), math.radians(10), math.radians(-30))
    bpy.context.scene.collection.objects.link(sun_obj)

    # 9. Load Red
    with bpy.data.libraries.load(RED_BLEND, link=False) as (data_from, data_to):
        data_to.collections = ["New_Uniracer_Model"]
    
    red_col = data_to.collections[0]
    bpy.context.scene.collection.children.link(red_col)

    red_rig = None
    for obj in red_col.all_objects:
        if obj.type == 'ARMATURE':
            red_rig = obj
            break

    if red_rig:
        red_rig.scale = (0.034, 0.034, 0.034)

    # Camera
    cam_data = bpy.data.cameras.new("DirectorCam")
    cam_data.sensor_width = 36
    cam_data.lens = 32
    cam_obj = bpy.data.objects.new("DirectorCam", cam_data)
    bpy.context.scene.collection.objects.link(cam_obj)
    bpy.context.scene.camera = cam_obj

    return cam_obj, red_rig

def animate_master(cam_obj, red_rig):
    scene = bpy.context.scene
    b_frame = red_rig.pose.bones.get("Bone_Frame") if red_rig else None
    b_saddle = red_rig.pose.bones.get("Bone_SaddleHead") if red_rig else None
    b_wheel = red_rig.pose.bones.get("Bone_Wheel") if red_rig else None

    # Helper for camera keyframing
    def set_cam(f, loc, look_target, lens=32):
        scene.frame_set(f)
        cam_obj.location = loc
        cam_obj.rotation_euler = (look_target - loc).to_track_quat('-Z', 'Y').to_euler()
        cam_obj.data.lens = lens
        cam_obj.keyframe_insert(data_path="location", frame=f)
        cam_obj.keyframe_insert(data_path="rotation_euler", frame=f)
        cam_obj.data.keyframe_insert(data_path="lens", frame=f)

    # =========================================================================
    # SHOT 1 (Frames 1-65, 2.7s): The 30-Year Slumber
    # Low smooth crane past the oil can & rug, revealing slouched asleep Red
    # =========================================================================
    set_cam(1,  Vector((-0.3, -2.2, 0.55)), Vector((-0.55, 0.08, 0.75)), lens=30)
    set_cam(65, Vector((1.3, -3.2, 1.35)),  Vector((-0.35, -0.1, 0.75)), lens=32)

    if red_rig:
        # F1-65: Slouched resting on cushion
        red_rig.location = (-0.55, 0.08, 0.85)
        red_rig.rotation_euler = (math.radians(22), math.radians(6), math.radians(-14))
        red_rig.keyframe_insert(data_path="location", frame=1)
        red_rig.keyframe_insert(data_path="rotation_euler", frame=1)
        red_rig.keyframe_insert(data_path="location", frame=65)
        red_rig.keyframe_insert(data_path="rotation_euler", frame=65)

        if b_frame:
            b_frame.rotation_euler = (math.radians(12), 0, 0)
            b_frame.keyframe_insert(data_path="rotation_euler", frame=1)
            b_frame.rotation_euler = (math.radians(15), 0, 0) # Inhale
            b_frame.keyframe_insert(data_path="rotation_euler", frame=35)
            b_frame.rotation_euler = (math.radians(11), 0, 0) # Exhale
            b_frame.keyframe_insert(data_path="rotation_euler", frame=65)

        if b_saddle:
            b_saddle.rotation_euler = (math.radians(-22), math.radians(25), 0)
            b_saddle.keyframe_insert(data_path="rotation_euler", frame=1)
            b_saddle.keyframe_insert(data_path="rotation_euler", frame=65)

    # =========================================================================
    # SHOT 2 (Frames 66-125, 2.5s): The Outlaw Broadcast
    # Over-the-shoulder past the CRT TV. TV explodes with cyan static!
    # Red's saddle head perks up, cocking toward the screen.
    # =========================================================================
    set_cam(66,  Vector((-1.1, -2.1, 1.40)), Vector((-0.55, 0.08, 0.85)), lens=36)
    set_cam(125, Vector((-1.0, -2.0, 1.45)), Vector((-0.55, 0.08, 0.88)), lens=38)

    if red_rig and b_saddle:
        # F66: Head starts resting
        b_saddle.rotation_euler = (math.radians(-22), math.radians(25), 0)
        b_saddle.keyframe_insert(data_path="rotation_euler", frame=66)

        # F85: Head stirs and cocks to TV screen
        b_saddle.rotation_euler = (math.radians(8), math.radians(38), math.radians(-10))
        b_saddle.keyframe_insert(data_path="rotation_euler", frame=88)

        # F115: Looks attentively at TV, inquisitive
        b_saddle.rotation_euler = (math.radians(16), math.radians(34), math.radians(-5))
        b_saddle.keyframe_insert(data_path="rotation_euler", frame=115)

    if red_rig and b_frame:
        b_frame.rotation_euler = (math.radians(11), 0, 0)
        b_frame.keyframe_insert(data_path="rotation_euler", frame=66)
        b_frame.rotation_euler = (math.radians(-2), 0, 0) # Perking upright
        b_frame.keyframe_insert(data_path="rotation_euler", frame=110)
        b_frame.keyframe_insert(data_path="rotation_euler", frame=125)

    # =========================================================================
    # SHOT 3 (Frames 126-175, 2.0s): Awakening & PTWANG Spring Pop!
    # Medium 3/4 framing: Spring bursts through cushion, Red cartoon hops!
    # =========================================================================
    set_cam(126, Vector((0.7, -2.1, 1.15)), Vector((-0.2, 0.0, 0.85)), lens=38)
    set_cam(175, Vector((0.5, -2.2, 1.10)), Vector((-0.2, 0.0, 0.80)), lens=40)

    if red_rig:
        # F126: Sits upright on cushion
        red_rig.location = (-0.55, 0.08, 0.85)
        red_rig.rotation_euler = (math.radians(4), 0, 0)
        red_rig.keyframe_insert(data_path="location", frame=126)
        red_rig.keyframe_insert(data_path="rotation_euler", frame=126)

        # F132: PTWANG! Spring pop causes Red to jump in comic surprise!
        red_rig.location = (-0.50, 0.02, 1.18) # Airborne hop!
        red_rig.rotation_euler = (math.radians(-12), math.radians(14), math.radians(18))
        red_rig.keyframe_insert(data_path="location", frame=132)
        red_rig.keyframe_insert(data_path="rotation_euler", frame=132)

        # F145: Apex of hop
        red_rig.location = (-0.45, -0.25, 1.05)
        red_rig.rotation_euler = (math.radians(8), math.radians(-8), math.radians(-10))
        red_rig.keyframe_insert(data_path="location", frame=145)
        red_rig.keyframe_insert(data_path="rotation_euler", frame=145)

        # F160: Dropping toward floor in front of couch
        red_rig.location = (-0.35, -0.65, 0.65)
        red_rig.rotation_euler = (math.radians(2), 0, 0)
        red_rig.keyframe_insert(data_path="location", frame=160)
        red_rig.keyframe_insert(data_path="rotation_euler", frame=160)

        # F172: Landing solid on garage rug
        red_rig.location = (-0.25, -0.95, 0.42)
        red_rig.rotation_euler = (0, 0, 0)
        red_rig.keyframe_insert(data_path="location", frame=172)
        red_rig.keyframe_insert(data_path="rotation_euler", frame=172)

        if b_saddle:
            b_saddle.rotation_euler = (math.radians(20), 0, 0) # Alert look ahead
            b_saddle.keyframe_insert(data_path="rotation_euler", frame=172)

    # =========================================================================
    # SHOT 4 (Frames 176-235, 2.5s): The Burnout & Emote
    # Low ground hero angle on the rug. Red revs wheel, tilts left/right!
    # =========================================================================
    set_cam(176, Vector((0.2, -2.4, 0.52)), Vector((-0.25, -0.95, 0.50)), lens=34)
    set_cam(235, Vector((0.0, -2.6, 0.58)), Vector((-0.20, -1.05, 0.50)), lens=36)

    if red_rig:
        red_rig.location = (-0.25, -0.95, 0.42)
        red_rig.rotation_euler = (0, 0, 0)
        red_rig.keyframe_insert(data_path="location", frame=176)
        red_rig.keyframe_insert(data_path="rotation_euler", frame=176)

        # Emote tilts on rug (Brake glue character acting!)
        if b_frame:
            b_frame.rotation_euler = (0, 0, 0)
            b_frame.keyframe_insert(data_path="rotation_euler", frame=176)
            b_frame.rotation_euler = (0, 0, math.radians(-18)) # Tilt left
            b_frame.keyframe_insert(data_path="rotation_euler", frame=190)
            b_frame.rotation_euler = (0, 0, math.radians(18))  # Tilt right
            b_frame.keyframe_insert(data_path="rotation_euler", frame=205)
            b_frame.rotation_euler = (math.radians(-16), 0, 0) # Lean forward crouch
            b_frame.keyframe_insert(data_path="rotation_euler", frame=225)
            b_frame.keyframe_insert(data_path="rotation_euler", frame=235)

        if b_wheel:
            b_wheel.rotation_euler = (0, 0, 0)
            b_wheel.keyframe_insert(data_path="rotation_euler", frame=176)
            # Wheel revs on rug!
            b_wheel.rotation_euler = (math.radians(-2880), 0, 0) # 8 spins
            b_wheel.keyframe_insert(data_path="rotation_euler", frame=235)

    # =========================================================================
    # SHOT 5 (Frames 236-300, 2.7s): The Peelout into the Night!
    # Dynamic low camera. Red launches forward at full speed past the camera!
    # =========================================================================
    set_cam(236, Vector((0.15, -3.6, 0.65)), Vector((-0.20, -1.2, 0.45)), lens=28)
    set_cam(300, Vector((0.05, -4.2, 0.75)), Vector((-0.10, -2.4, 0.45)), lens=28)

    if red_rig:
        red_rig.location = (-0.25, -0.95, 0.42)
        red_rig.rotation_euler = (math.radians(-18), 0, 0)
        red_rig.keyframe_insert(data_path="location", frame=236)
        red_rig.keyframe_insert(data_path="rotation_euler", frame=236)

        # Accelerates rapidly toward camera along -Y!
        red_rig.location = (-0.15, -4.8, 0.42)
        red_rig.rotation_euler = (math.radians(-26), 0, 0) # Aggressive speed tuck
        red_rig.keyframe_insert(data_path="location", frame=300)
        red_rig.keyframe_insert(data_path="rotation_euler", frame=300)

        if b_wheel:
            b_wheel.rotation_euler = (math.radians(-2880), 0, 0)
            b_wheel.keyframe_insert(data_path="rotation_euler", frame=236)
            b_wheel.rotation_euler = (math.radians(-8640), 0, 0) # 24 full spins
            b_wheel.keyframe_insert(data_path="rotation_euler", frame=300)

def render_all_frames():
    cam_obj, red_rig = setup_scene()
    animate_master(cam_obj, red_rig)
    scene = bpy.context.scene

    print(f"🎬 Starting render of 300 frames to {OUTPUT_DIR}...")
    for f in range(1, 301):
        scene.frame_set(f)
        scene.render.filepath = os.path.join(OUTPUT_DIR, f"raw_frame_{f:04d}.png")
        bpy.ops.render.render(write_still=True)
        if f % 30 == 0:
            print(f"  Frame {f}/300 rendered ({f/300*100:.1f}%)")

    print("✅ All 300 frames rendered successfully!")

if __name__ == "__main__":
    render_all_frames()
