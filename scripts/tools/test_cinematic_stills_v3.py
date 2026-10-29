# scripts/tools/test_cinematic_stills_v3.py
import bpy
import math
import os
import sys
from mathutils import Vector, Quaternion, Matrix, Euler

WORKSPACE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
RED_BLEND = os.path.join(WORKSPACE_ROOT, "models", "uniracer_model.blend")
POSTERS_DIR = os.path.join(WORKSPACE_ROOT, "apps", "web", "public", "textures", "posters")
OUTPUT_DIR = os.path.join(WORKSPACE_ROOT, "temp_studio_frames", "test_stills")
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

def build_scene_v3():
    reset_scene()
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_EEVEE'
    scene.render.resolution_x = 1280
    scene.render.resolution_y = 720

    # Ambient World
    world = scene.world or bpy.data.worlds.new("World")
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs[0].default_value = (0.05, 0.07, 0.11, 1.0)
        bg.inputs[1].default_value = 0.55

    # Materials
    m_floor = create_mat("FloorMat", (0.13, 0.14, 0.16, 1.0), roughness=0.72, metalness=0.18)
    m_wall = create_mat("BackdropWall", (0.16, 0.14, 0.12, 1.0), roughness=0.85, metalness=0.1)
    m_wood = create_mat("WoodMat", (0.28, 0.18, 0.11, 1.0), roughness=0.75)
    m_couch_body = create_mat("CouchBody", (0.16, 0.20, 0.15, 1.0), roughness=0.82)
    m_cushion = create_mat("CouchCushion", (0.22, 0.28, 0.20, 1.0), roughness=0.85)
    m_tv_chassis = create_mat("TVChassis", (0.10, 0.10, 0.11, 1.0), roughness=0.45, metalness=0.2)
    m_tv_screen = create_mat("TVScreen", (0.20, 0.75, 0.95, 1.0), roughness=0.08, emission=(0.10, 0.65, 0.95, 1.0), emission_strength=4.8)
    m_spring = create_mat("SpringSteel", (0.85, 0.88, 0.92, 1.0), roughness=0.18, metalness=0.95)
    m_oil_can = create_mat("OilCan", (0.85, 0.15, 0.12, 1.0), roughness=0.35, metalness=0.25)
    m_puddle = create_mat("OilPuddle", (0.02, 0.02, 0.02, 1.0), roughness=0.02, metalness=0.95)
    m_barrel = create_mat("BurnBarrel", (0.28, 0.18, 0.12, 1.0), roughness=0.75, metalness=0.5)

    # 1. Floor (24m x 24m)
    bpy.ops.mesh.primitive_plane_add(size=24.0, location=(0, 0, 0))
    floor = bpy.context.active_object
    floor.data.materials.append(m_floor)

    # 2. Garage Rug in front of couch
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

    # 4. Posters mounted on the wall
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

    # 6. CRT TV
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

    # Glowing screen facing couch
    rad40 = math.radians(40)
    bpy.ops.mesh.primitive_plane_add(size=1.0, location=(-1.6 + 0.36 * math.sin(rad40), -1.8 + 0.36 * math.cos(rad40), 1.05))
    screen = bpy.context.active_object
    screen.rotation_euler = (math.radians(-90), 0, rad40)
    screen.scale = (0.78, 0.56, 1.0)
    screen.data.materials.append(m_tv_screen)

    # Antennas
    for sign in [-1, 1]:
        bpy.ops.mesh.primitive_cylinder_add(radius=0.007, depth=0.75, location=(-1.6 + sign * 0.14, -1.8, 1.68))
        ant = bpy.context.active_object
        ant.rotation_euler = (math.radians(15), sign * math.radians(-28), 0)
        ant.data.materials.append(m_spring)

    # Clutter
    bpy.ops.mesh.primitive_cylinder_add(radius=0.12, depth=0.35, location=(0.85, -1.5, 0.17))
    can = bpy.context.active_object
    can.data.materials.append(m_oil_can)

    bpy.ops.mesh.primitive_plane_add(size=1.0, location=(0.95, -1.45, 0.008))
    puddle = bpy.context.active_object
    puddle.scale = (0.6, 0.45, 1.0)
    puddle.data.materials.append(m_puddle)

    # Burn Barrel
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

    tv_light = bpy.data.lights.new(name="TVLight", type='POINT')
    tv_light.energy = 180.0
    tv_light.color = (0.15, 0.75, 1.0)
    tv_obj = bpy.data.objects.new("TVLight", tv_light)
    tv_obj.location = (-1.2, -1.4, 1.1)
    bpy.context.scene.collection.objects.link(tv_obj)

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

    # 8. Load Red at Proportional Humanoid Unicycle Scale (0.034)
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
        # Position resting slouched on the cushion:
        # Wheel rests on cushion at Z = 0.44 + 0.42 = 0.86
        red_rig.location = (-0.55, 0.08, 0.85)
        # Slouched resting posture: Leaning back into backrest, head tilted
        red_rig.rotation_euler = (math.radians(22), math.radians(6), math.radians(-14))
        
        b_frame = red_rig.pose.bones.get("Bone_Frame")
        b_saddle = red_rig.pose.bones.get("Bone_SaddleHead")
        if b_frame:
            b_frame.rotation_euler = (math.radians(12), 0, 0)
        if b_saddle:
            b_saddle.rotation_euler = (math.radians(-22), math.radians(25), 0) # Sleeping/slouched head angle

    # Camera
    cam_data = bpy.data.cameras.new("DirectorCam")
    cam_data.sensor_width = 36
    cam_data.lens = 32
    cam_obj = bpy.data.objects.new("DirectorCam", cam_data)
    bpy.context.scene.collection.objects.link(cam_obj)
    bpy.context.scene.camera = cam_obj

    return cam_obj, red_rig

def render_stills_v3():
    cam_obj, red_rig = build_scene_v3()
    scene = bpy.context.scene

    # Shot 1: Master Couch & TV Establishing Shot
    cam_obj.location = (1.5, -3.2, 1.40)
    look = Vector((-0.35, -0.1, 0.75))
    cam_obj.rotation_euler = (look - cam_obj.location).to_track_quat('-Z', 'Y').to_euler()
    cam_obj.data.lens = 32
    scene.render.filepath = os.path.join(OUTPUT_DIR, "v3_shot1_master.png")
    bpy.ops.render.render(write_still=True)
    print("Rendered:", scene.render.filepath)

    # Shot 2: TV Over-The-Shoulder looking at Red
    cam_obj.location = (-2.3, -2.4, 1.25)
    look = Vector((-0.55, 0.08, 0.82))
    cam_obj.rotation_euler = (look - cam_obj.location).to_track_quat('-Z', 'Y').to_euler()
    cam_obj.data.lens = 35
    scene.render.filepath = os.path.join(OUTPUT_DIR, "v3_shot2_tv_pov.png")
    bpy.ops.render.render(write_still=True)
    print("Rendered:", scene.render.filepath)

    # Shot 3: Medium Close-up on Red & Posters
    cam_obj.location = (0.35, -1.8, 1.05)
    look = Vector((-0.55, 0.08, 0.82))
    cam_obj.rotation_euler = (look - cam_obj.location).to_track_quat('-Z', 'Y').to_euler()
    cam_obj.data.lens = 42
    scene.render.filepath = os.path.join(OUTPUT_DIR, "v3_shot3_medium.png")
    bpy.ops.render.render(write_still=True)
    print("Rendered:", scene.render.filepath)

if __name__ == "__main__":
    render_stills_v3()
