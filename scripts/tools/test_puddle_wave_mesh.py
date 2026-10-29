# scripts/tools/test_puddle_wave_mesh.py
import bpy
import math
import os
import sys

def build_puddle_test():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_EEVEE'
    try:
        scene.eevee.use_raytracing = True
    except Exception:
        pass
    scene.render.resolution_x = 1280
    scene.render.resolution_y = 720
    scene.view_settings.view_transform = 'AgX'
    scene.view_settings.exposure = 0.45

    # World
    world = bpy.data.worlds.new("World")
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs[0].default_value = (0.012, 0.015, 0.025, 1.0)
        bg.inputs[1].default_value = 0.35

    # Ground Asphalt Plane
    m_ground = bpy.data.materials.new("Asphalt")
    m_ground.use_nodes = True
    bsdf_g = m_ground.node_tree.nodes.get("Principled BSDF")
    bsdf_g.inputs['Base Color'].default_value = (0.04, 0.045, 0.05, 1.0)
    bsdf_g.inputs['Roughness'].default_value = 0.65
    bpy.ops.mesh.primitive_plane_add(size=30.0, location=(0, 0, 0))
    g_obj = bpy.context.active_object
    g_obj.data.materials.append(m_ground)

    # Subdivided Puddle Mesh with Physical Wave Modifier
    bpy.ops.mesh.primitive_grid_add(x_subdivisions=120, y_subdivisions=60, size=1.0, location=(0, 0, 0.003))
    puddle = bpy.context.active_object
    puddle.scale = (4.5, 2.2, 1.0)
    bpy.ops.object.transform_apply(scale=True)

    # Water Material
    m_water = bpy.data.materials.new("LiquidPuddle")
    m_water.use_nodes = True
    bsdf_w = m_water.node_tree.nodes.get("Principled BSDF")
    bsdf_w.inputs['Base Color'].default_value = (0.02, 0.025, 0.03, 1.0)
    bsdf_w.inputs['Roughness'].default_value = 0.008 # Mirror glass water
    bsdf_w.inputs['Metallic'].default_value = 0.92
    bsdf_w.inputs['IOR'].default_value = 1.333
    puddle.data.materials.append(m_water)

    # Physical Wave Modifier on the water surface!
    wave_mod = puddle.modifiers.new(name="WaterRipples", type='WAVE')
    wave_mod.use_x = True
    wave_mod.use_y = True
    wave_mod.use_cyclic = False
    wave_mod.speed = 0.35
    wave_mod.height = 0.018 # 1.8cm dynamic water waves
    wave_mod.width = 0.28
    wave_mod.narrowness = 2.2
    wave_mod.damping_time = 45.0
    wave_mod.falloff_radius = 2.8
    # Start position matches Red's entry point into water (X = 1.2)
    wave_mod.start_position_x = 0.4
    wave_mod.start_position_y = 0.0
    wave_mod.time_offset = -210 # ripples start expanding as wheel enters puddle

    # Lighting: Backlight Area Light (creates wave crest reflections)
    light_data = bpy.data.lights.new('PuddleBacklight', 'AREA')
    light_data.energy = 4200.0
    light_data.size = 2.4
    light_data.size_y = 6.0
    light_data.color = (1.0, 0.72, 0.38) # Warm amber
    light_obj = bpy.data.objects.new('PuddleBacklight', light_data)
    light_obj.location = (0.0, 3.2, 0.55)
    light_obj.rotation_euler = (math.radians(-75), 0, 0)
    scene.collection.objects.link(light_obj)

    # Camera
    cam_data = bpy.data.cameras.new("PuddleCam")
    cam_data.sensor_width = 36
    cam_data.lens = 40
    cam_obj = bpy.data.objects.new("PuddleCam", cam_data)
    cam_obj.location = (0.0, -2.6, 0.33)
    cam_obj.rotation_euler = (math.radians(83), 0, 0)
    scene.collection.objects.link(cam_obj)
    scene.camera = cam_obj

    # Load Red from canonical model
    canonical_blend = os.path.abspath("uniracer_model.blend")
    with bpy.data.libraries.load(canonical_blend, link=False) as (data_from, data_to):
        data_to.collections = ["New_Uniracer_Model"]
    red_col = data_to.collections[0]
    scene.collection.children.link(red_col)

    # Frame Red Candy Red
    mat_body = bpy.data.materials.get("Mat_Body")
    if mat_body and mat_body.node_tree:
        bsdf = mat_body.node_tree.nodes.get("Principled BSDF")
        if bsdf:
            bsdf.inputs['Base Color'].default_value = (0.82, 0.015, 0.025, 1.0)
            bsdf.inputs['Metallic'].default_value = 0.85
            bsdf.inputs['Roughness'].default_value = 0.18

    frame_object_names = ["ForkLeg_1", "ForkLeg_-1", "ForkCrown", "Dropout_1", "Dropout_-1", "SeatClamp"]
    for obj in red_col.all_objects:
        if obj.name in frame_object_names and mat_body:
            obj.data.materials.clear()
            obj.data.materials.append(mat_body)

    for obj in red_col.all_objects:
        if obj.type == 'ARMATURE':
            obj.scale = (0.034, 0.034, 0.034)
            obj.location = (0.2, 0.0, 0.41)
            obj.rotation_euler = (0, 0, math.radians(-90))
            break

    # Render frame 260
    scene.frame_set(260)
    out_path = os.path.abspath("C:/Users/zakde/.gemini/antigravity/brain/5d778f69-db13-4232-9d87-80fc4f0ece4e/puddle_wave_test_260.png")
    scene.render.filepath = out_path
    bpy.ops.render.render(write_still=True)
    print(f"Rendered physical water wave test to {out_path}")

if __name__ == "__main__":
    build_puddle_test()
