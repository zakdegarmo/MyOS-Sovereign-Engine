# scripts/tools/test_cinematic_stills.py
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

def build_scene():
    reset_scene()
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_EEVEE'
    scene.render.resolution_x = 1280
    scene.render.resolution_y = 720

    # Materials
    m_floor = create_mat("FloorMat", (0.12, 0.13, 0.15, 1.0), roughness=0.75, metalness=0.15)
    m_wall = create_mat("BackdropWall", (0.18, 0.15, 0.13, 1.0), roughness=0.85, metalness=0.1)
    m_wood = create_mat("WoodMat", (0.24, 0.16, 0.10, 1.0), roughness=0.7)
    m_couch_body = create_mat("CouchBody", (0.16, 0.20, 0.15, 1.0), roughness=0.82)
    m_cushion = create_mat("CouchCushion", (0.20, 0.25, 0.18, 1.0), roughness=0.85)
    m_tv_chassis = create_mat("TVChassis", (0.10, 0.10, 0.11, 1.0), roughness=0.45, metalness=0.2)
    m_tv_screen = create_mat("TVScreen", (0.20, 0.75, 0.95, 1.0), roughness=0.08, emission=(0.10, 0.65, 0.95, 1.0), emission_strength=4.5)
    m_spring = create_mat("SpringSteel", (0.85, 0.88, 0.92, 1.0), roughness=0.18, metalness=0.95)
    m_oil_can = create_mat("OilCan", (0.85, 0.15, 0.12, 1.0), roughness=0.35, metalness=0.25)
    m_puddle = create_mat("OilPuddle", (0.02, 0.02, 0.02, 1.0), roughness=0.02, metalness=0.95)
    m_barrel = create_mat("BurnBarrel", (0.28, 0.18, 0.12, 1.0), roughness=0.75, metalness=0.5)

    # 1. Floor (20m x 20m)
    bpy.ops.mesh.primitive_plane_add(size=24.0, location=(0, 0, 0))
    floor = bpy.context.active_object
    floor.data.materials.append(m_floor)

    # 2. Garage Rug in front of couch
    rug_path = os.path.join(POSTERS_DIR, "rug_garage.png")
    m_rug = create_image_mat("RugMat", rug_path, roughness=0.9)
    bpy.ops.mesh.primitive_plane_add(size=1.0, location=(0, -1.2, 0.005))
    rug = bpy.context.active_object
    rug.scale = (3.4, 2.4, 1.0)
    rug.data.materials.append(m_rug)

    # 3. Backdrop Wall behind couch (Y = 1.4m)
    bpy.ops.mesh.primitive_plane_add(size=1.0, location=(0, 1.4, 2.0))
    wall = bpy.context.active_object
    wall.rotation_euler = (math.radians(90), 0, 0)
    wall.scale = (10.0, 4.0, 1.0)
    wall.data.materials.append(m_wall)

    # 4. Posters mounted on the wall
    posters = [
        ("poster_cybercycle.png", (-2.6, 1.38, 2.2), (1.5, 2.25)),
        ("poster_glyphrider.png", (-0.9, 1.38, 2.3), (1.5, 2.25)),
        ("poster_outlaw.png", (0.9, 1.38, 2.3), (1.5, 2.25)),
        ("poster_radical.png", (2.6, 1.38, 2.2), (1.5, 2.25))
    ]
    for p_name, p_loc, p_scale in posters:
        p_path = os.path.join(POSTERS_DIR, p_name)
        p_mat = create_image_mat(f"Mat_{p_name}", p_path, roughness=0.35)
        bpy.ops.mesh.primitive_plane_add(size=1.0, location=p_loc)
        p_obj = bpy.context.active_object
        p_obj.rotation_euler = (math.radians(90), 0, 0)
        p_obj.scale = (p_scale[0], p_scale[1], 1.0)
        p_obj.data.materials.append(p_mat)

    # 5. Outlaw Couch at (0, 0, 0)
    # Base
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0.22))
    c_base = bpy.context.active_object
    c_base.scale = (2.6, 1.1, 0.28)
    c_base.data.materials.append(m_couch_body)

    # Backrest
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0.44, 0.72))
    c_back = bpy.context.active_object
    c_back.scale = (2.6, 0.26, 0.75)
    c_back.rotation_euler = (math.radians(-6), 0, 0)
    c_back.data.materials.append(m_cushion)

    # Left & Right Armrests
    for sign in [-1, 1]:
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(sign * 1.38, 0.05, 0.58))
        arm = bpy.context.active_object
        arm.scale = (0.28, 1.05, 0.52)
        arm.data.materials.append(m_couch_body)

    # Left Cushion (Where Red sits)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-0.60, -0.06, 0.44))
    cush_l = bpy.context.active_object
    cush_l.scale = (1.1, 0.85, 0.20)
    cush_l.data.materials.append(m_cushion)

    # Right Cushion (Contains spring)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.60, -0.06, 0.46))
    cush_r = bpy.context.active_object
    cush_r.scale = (1.1, 0.85, 0.22)
    cush_r.data.materials.append(m_cushion)

    # 6. Comical Coiled Spring (Inside right cushion)
    curve_data = bpy.data.curves.new(name="SpringCurve", type='CURVE')
    curve_data.dimensions = '3D'
    curve_data.bevel_depth = 0.018
    curve_data.bevel_resolution = 4
    curve_data.use_fill_caps = True
    polyline = curve_data.splines.new('POLY')
    turns = 5
    steps = turns * 24
    polyline.points.add(steps - 1)
    for i in range(steps):
        t = i / float(steps)
        ang = t * turns * 2.0 * math.pi
        x = 0.12 * math.cos(ang)
        y = 0.12 * math.sin(ang)
        z = t * 0.75
        polyline.points[i].co = (x, y, z, 1.0)
    spring_obj = bpy.data.objects.new("CoiledSpring", curve_data)
    bpy.context.scene.collection.objects.link(spring_obj)
    spring_obj.location = (0.65, -0.05, 0.52)
    spring_obj.rotation_euler = (math.radians(12), math.radians(-10), math.radians(15))
    spring_obj.data.materials.append(m_spring)

    # 7. 36" CRT TV on crate stand directly facing couch (at Y = -2.6m)
    # Crate stand
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -2.6, 0.38))
    crate = bpy.context.active_object
    crate.scale = (1.4, 0.9, 0.76)
    crate.data.materials.append(m_wood)

    # TV Chassis
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -2.6, 1.15))
    tv = bpy.context.active_object
    tv.scale = (1.2, 0.85, 0.78)
    tv.data.materials.append(m_tv_chassis)

    # Glowing CRT Screen facing couch (+Y)
    bpy.ops.mesh.primitive_plane_add(size=1.0, location=(0, -2.17, 1.15))
    screen = bpy.context.active_object
    screen.rotation_euler = (math.radians(-90), 0, 0)
    screen.scale = (0.92, 0.65, 1.0)
    screen.data.materials.append(m_tv_screen)

    # Rabbit Ear Antennas
    for sign in [-1, 1]:
        bpy.ops.mesh.primitive_cylinder_add(radius=0.008, depth=0.85, location=(sign * 0.18, -2.6, 1.85))
        ant = bpy.context.active_object
        ant.rotation_euler = (math.radians(15), sign * math.radians(-30), 0)
        ant.data.materials.append(m_spring)

    # 8. Clutter: Oil Can & Puddle
    bpy.ops.mesh.primitive_cylinder_add(radius=0.12, depth=0.35, location=(-0.85, -1.3, 0.17))
    can = bpy.context.active_object
    can.data.materials.append(m_oil_can)

    bpy.ops.mesh.primitive_plane_add(size=1.0, location=(-0.70, -1.25, 0.008))
    puddle = bpy.context.active_object
    puddle.scale = (0.7, 0.5, 1.0)
    puddle.data.materials.append(m_puddle)

    # 9. Burn Barrel in corner with roaring flame
    bpy.ops.mesh.primitive_cylinder_add(radius=0.4, depth=1.1, location=(-3.2, 0.2, 0.55))
    barrel = bpy.context.active_object
    barrel.data.materials.append(m_barrel)

    # Lights
    # 1. Warm overhead shop pendant light above couch
    shop_light = bpy.data.lights.new(name="ShopLight", type='POINT')
    shop_light.energy = 180.0
    shop_light.color = (1.0, 0.88, 0.72) # Warm tungsten
    shop_obj = bpy.data.objects.new("ShopLight", shop_light)
    shop_obj.location = (0, -0.5, 3.2)
    bpy.context.scene.collection.objects.link(shop_obj)

    # 2. Electric Cyan CRT TV screen glow hitting the couch
    tv_light = bpy.data.lights.new(name="TVLight", type='POINT')
    tv_light.energy = 140.0
    tv_light.color = (0.15, 0.75, 1.0)
    tv_obj = bpy.data.objects.new("TVLight", tv_light)
    tv_obj.location = (0, -2.0, 1.2)
    bpy.context.scene.collection.objects.link(tv_obj)

    # 3. Fire amber glow from burn barrel
    fire_light = bpy.data.lights.new(name="FireLight", type='POINT')
    fire_light.energy = 110.0
    fire_light.color = (1.0, 0.35, 0.05)
    fire_obj = bpy.data.objects.new("FireLight", fire_light)
    fire_obj.location = (-3.2, 0.2, 1.2)
    bpy.context.scene.collection.objects.link(fire_obj)

    # 4. Fill rim light
    rim_light = bpy.data.lights.new(name="RimLight", type='SUN')
    rim_light.energy = 0.8
    rim_light.color = (0.55, 0.70, 0.95)
    rim_obj = bpy.data.objects.new("RimLight", rim_light)
    rim_obj.rotation_euler = (math.radians(50), math.radians(15), math.radians(-40))
    bpy.context.scene.collection.objects.link(rim_obj)

    # 10. Load Red the Uniracer
    print("Loading Red from:", RED_BLEND)
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
        red_rig.scale = (0.058, 0.058, 0.058)
        # Position slouched resting on couch cushion
        red_rig.location = (-0.60, 0.02, 0.76)
        red_rig.rotation_euler = (math.radians(16), math.radians(6), math.radians(-12))
        
        # Pose slouched
        b_frame = red_rig.pose.bones.get("Bone_Frame")
        b_saddle = red_rig.pose.bones.get("Bone_SaddleHead")
        if b_frame:
            b_frame.rotation_euler = (math.radians(14), 0, 0)
        if b_saddle:
            b_saddle.rotation_euler = (math.radians(-16), math.radians(18), 0)

    # Camera
    cam_data = bpy.data.cameras.new("DirectorCam")
    cam_data.sensor_width = 36
    cam_data.lens = 28 # Wide 28mm lens
    cam_obj = bpy.data.objects.new("DirectorCam", cam_data)
    bpy.context.scene.collection.objects.link(cam_obj)
    bpy.context.scene.camera = cam_obj

    return cam_obj, red_rig

def render_stills():
    cam_obj, red_rig = build_scene()
    scene = bpy.context.scene

    # Shot 1: Wide Couch & TV Establishing Shot
    cam_obj.location = (1.8, -3.8, 1.4)
    look = Vector((-0.2, -0.4, 0.75))
    cam_obj.rotation_euler = (look - cam_obj.location).to_track_quat('-Z', 'Y').to_euler()
    scene.render.filepath = os.path.join(OUTPUT_DIR, "shot1_establishing.png")
    bpy.ops.render.render(write_still=True)
    print("Rendered:", scene.render.filepath)

    # Shot 2: Medium Over-The-Shoulder past CRT TV looking at Red
    cam_obj.location = (0.35, -2.35, 1.25)
    look = Vector((-0.55, 0.02, 0.78))
    cam_obj.rotation_euler = (look - cam_obj.location).to_track_quat('-Z', 'Y').to_euler()
    cam_obj.data.lens = 35
    scene.render.filepath = os.path.join(OUTPUT_DIR, "shot2_tv_pov.png")
    bpy.ops.render.render(write_still=True)
    print("Rendered:", scene.render.filepath)

    # Shot 3: Close-up on Red on the couch with posters in background
    cam_obj.location = (-0.45, -1.45, 0.95)
    look = Vector((-0.58, 0.05, 0.82))
    cam_obj.rotation_euler = (look - cam_obj.location).to_track_quat('-Z', 'Y').to_euler()
    cam_obj.data.lens = 45
    scene.render.filepath = os.path.join(OUTPUT_DIR, "shot3_closeup_red.png")
    bpy.ops.render.render(write_still=True)
    print("Rendered:", scene.render.filepath)

if __name__ == "__main__":
    render_stills()
