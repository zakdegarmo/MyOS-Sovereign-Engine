# scripts/tools/test_red_frame_and_light.py
import bpy
import os
import math

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = 'BLENDER_EEVEE'
try:
    scene.eevee.use_raytracing = True
except Exception:
    pass
scene.render.resolution_x = 1280
scene.render.resolution_y = 720

# World
world = scene.world or bpy.data.worlds.new('World')
scene.world = world
world.use_nodes = True
bg = world.node_tree.nodes.get('Background')
if bg:
    bg.inputs[0].default_value = (0.012, 0.015, 0.025, 1.0)
    bg.inputs[1].default_value = 0.35

# Color management
scene.view_settings.view_transform = 'AgX'
scene.view_settings.exposure = 0.45

# 1. Puddle Street Material
m_ground = bpy.data.materials.new(name="PuddleStreetMaterial")
m_ground.use_nodes = True
nt = m_ground.node_tree
nodes = nt.nodes
links = nt.links
nodes.clear()

node_out = nodes.new('ShaderNodeOutputMaterial')
node_bsdf = nodes.new('ShaderNodeBsdfPrincipled')
node_texcoord = nodes.new('ShaderNodeTexCoord')

# Puddle radial gradient mask
node_puddle_map = nodes.new('ShaderNodeMapping')
node_puddle_map.inputs['Scale'].default_value = (0.7, 1.3, 1.0)
links.new(node_texcoord.outputs['Object'], node_puddle_map.inputs['Vector'])

node_grad = nodes.new('ShaderNodeTexGradient')
node_grad.gradient_type = 'SPHERICAL'
links.new(node_puddle_map.outputs['Vector'], node_grad.inputs['Vector'])

node_ramp = nodes.new('ShaderNodeValToRGB')
node_ramp.color_ramp.interpolation = 'EASE'
node_ramp.color_ramp.elements[0].position = 0.32
node_ramp.color_ramp.elements[0].color = (1, 1, 1, 1) # Pure water mirror
node_ramp.color_ramp.elements[1].position = 0.62
node_ramp.color_ramp.elements[1].color = (0, 0, 0, 1) # Asphalt
links.new(node_grad.outputs['Fac'], node_ramp.inputs['Fac'])

# Roughness mapping
node_map_rough = nodes.new('ShaderNodeMapRange')
node_map_rough.inputs['From Min'].default_value = 0.0
node_map_rough.inputs['From Max'].default_value = 1.0
node_map_rough.inputs['To Min'].default_value = 0.32
node_map_rough.inputs['To Max'].default_value = 0.005
links.new(node_ramp.outputs['Color'], node_map_rough.inputs['Value'])
links.new(node_map_rough.outputs['Result'], node_bsdf.inputs['Roughness'])

# Concentric ripple waves
node_wave = nodes.new('ShaderNodeTexWave')
node_wave.wave_type = 'RINGS'
node_wave.rings_direction = 'SPHERICAL'
node_wave.inputs['Scale'].default_value = 7.5
node_wave.inputs['Distortion'].default_value = 3.0
node_wave.inputs['Detail'].default_value = 2.0
node_wave.inputs['Phase Offset'].default_value = 2.5
links.new(node_texcoord.outputs['Object'], node_wave.inputs['Vector'])

# Bump normal
node_bump = nodes.new('ShaderNodeBump')
node_bump.inputs['Strength'].default_value = 0.16
node_bump.inputs['Distance'].default_value = 0.04
links.new(node_wave.outputs['Color'], node_bump.inputs['Height'])
links.new(node_bump.outputs['Normal'], node_bsdf.inputs['Normal'])

node_bsdf.inputs['Base Color'].default_value = (0.025, 0.03, 0.035, 1.0)
node_bsdf.inputs['Metallic'].default_value = 0.90
node_bsdf.inputs['IOR'].default_value = 1.333
links.new(node_bsdf.outputs['BSDF'], node_out.inputs['Surface'])

# Ground Plane
bpy.ops.mesh.primitive_plane_add(size=40.0, location=(0, 0, 0))
ground = bpy.context.active_object
ground.data.materials.append(m_ground)

# Scrap yard clutter
m_rust = bpy.data.materials.new("Rust")
rbsdf = m_rust.node_tree.nodes.get('Principled BSDF')
rbsdf.inputs['Base Color'].default_value = (0.22, 0.12, 0.08, 1.0)
rbsdf.inputs['Roughness'].default_value = 0.85

m_tire = bpy.data.materials.new("Tire")
tbsdf = m_tire.node_tree.nodes.get('Principled BSDF')
tbsdf.inputs['Base Color'].default_value = (0.05, 0.06, 0.07, 1.0)
tbsdf.inputs['Roughness'].default_value = 0.92

for sx, sy in [(-2.8, 3.2), (3.2, 3.5)]:
    for tz in range(3):
        bpy.ops.mesh.primitive_torus_add(major_radius=0.75, minor_radius=0.28, location=(sx, sy, 0.28 + tz * 0.52))
        bpy.context.active_object.data.materials.append(m_tire)

# Streetlamp pole
bpy.ops.mesh.primitive_cylinder_add(radius=0.08, depth=6.5, location=(0.2, 4.2, 3.2))
bpy.context.active_object.data.materials.append(m_rust)

# Balanced Area Backlight:
# Lowered energy from 11000 down to 4800 for rich, non-clipping amber reflection!
lamp_data = bpy.data.lights.new('SodiumBacklight', 'AREA')
lamp_data.shape = 'ELLIPSE'
lamp_data.size = 3.5
lamp_data.size_y = 2.2
lamp_data.energy = 4800.0
lamp_data.color = (1.0, 0.68, 0.18) # Warm golden amber
lamp_obj = bpy.data.objects.new('SodiumBacklight', lamp_data)
lamp_obj.location = (0.2, 4.0, 2.0)
lamp_obj.rotation_euler = (math.radians(-65), 0, 0)
scene.collection.objects.link(lamp_obj)

# Moon Rim
moon_data = bpy.data.lights.new('MoonLight', 'SUN')
moon_data.energy = 2.2
moon_data.color = (0.35, 0.55, 0.85)
moon_obj = bpy.data.objects.new('MoonLight', moon_data)
moon_obj.rotation_euler = (math.radians(52), math.radians(-25), math.radians(45))
scene.collection.objects.link(moon_obj)

# Camera: Z = 0.33m, 40mm lens, tilted slightly up (83 deg) to see red frame & puddle
cam_data = bpy.data.cameras.new("CinemaCamera")
cam_data.lens = 40
cam_obj = bpy.data.objects.new("CinemaCamera", cam_data)
cam_obj.location = (0.0, -2.6, 0.33)
cam_obj.rotation_euler = (math.radians(83), 0, 0)
scene.collection.objects.link(cam_obj)
scene.camera = cam_obj

# Load Red from Canonical uniracer_model.blend
CANONICAL_BLEND = r'C:\Users\zakde\Desktop\AntiGravity projects\MyOS\uniracer_model.blend'
with bpy.data.libraries.load(CANONICAL_BLEND, link=False) as (data_from, data_to):
    data_to.collections = ["New_Uniracer_Model"]

red_col = data_to.collections[0]
scene.collection.children.link(red_col)

# Get Mat_Body
mat_body = bpy.data.materials.get("Mat_Body")

# Assign Mat_Body (Candy Red) to the Frame objects!
frame_object_names = [
    "ForkLeg_1", "ForkLeg_-1", "ForkCrown", 
    "Dropout_1", "Dropout_-1", "SeatClamp"
]

for obj in red_col.all_objects:
    if obj.name in frame_object_names and mat_body:
        obj.data.materials.clear()
        obj.data.materials.append(mat_body)
        print(f"Applied candy red Mat_Body to {obj.name}!")
    if obj.type == 'ARMATURE':
        scale_fac = 0.034
        obj.scale = (scale_fac, scale_fac, scale_fac)
        obj.location = (0.0, 0.0, 0.41)
        obj.rotation_euler = (0, 0, math.radians(-90))

out_path = r'C:\Users\zakde\.gemini\antigravity\brain\5d778f69-db13-4232-9d87-80fc4f0ece4e\test_red_frame_reflection.png'
scene.render.filepath = out_path
bpy.ops.render.render(write_still=True)
print('✅ Done rendering test_red_frame_reflection.png!')
