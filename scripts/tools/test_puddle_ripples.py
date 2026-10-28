# scripts/tools/test_puddle_ripples.py
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

# World: Dark stormy night
world = scene.world or bpy.data.worlds.new('World')
scene.world = world
world.use_nodes = True
bg = world.node_tree.nodes.get('Background')
if bg:
    bg.inputs[0].default_value = (0.01, 0.015, 0.03, 1.0)
    bg.inputs[1].default_value = 0.3

# Create Wet Asphalt Ground with embedded Puddle Shader
# Instead of a separate cylinder, let's create a single high-detail ground plane
# where a puddle mask controls Roughness, Specular, and animated Ripple Normals!
m_ground = bpy.data.materials.new('CinematicWetStreet')
m_ground.use_nodes = True
nt = m_ground.node_tree
nodes = nt.nodes
links = nt.links
nodes.clear()

# Nodes
node_out = nodes.new('ShaderNodeOutputMaterial')
node_bsdf = nodes.new('ShaderNodeBsdfPrincipled')
node_texcoord = nodes.new('ShaderNodeTexCoord')
node_mapping = nodes.new('ShaderNodeMapping')

# Puddle mask: Elliptical radial gradient centered at (0, 0)
# dist = sqrt((x/rx)^2 + (y/ry)^2)
node_separate = nodes.new('ShaderNodeSeparateXYZ')
links.new(node_texcoord.outputs['Object'], node_separate.inputs['Vector'])

# Math nodes for puddle ellipse
# We can use a Gradient Texture (Spherical) or Math
node_grad = nodes.new('ShaderNodeTexGradient')
node_grad.gradient_type = 'SPHERICAL'
# Scale mapping for ellipse
node_puddle_map = nodes.new('ShaderNodeMapping')
node_puddle_map.inputs['Scale'].default_value = (0.7, 1.2, 1.0)
links.new(node_texcoord.outputs['Object'], node_puddle_map.inputs['Vector'])
links.new(node_puddle_map.outputs['Vector'], node_grad.inputs['Vector'])

# Color ramp for puddle edge feathering
node_ramp = nodes.new('ShaderNodeValToRGB')
node_ramp.color_ramp.interpolation = 'EASE'
node_ramp.color_ramp.elements[0].position = 0.35 # Solid puddle center
node_ramp.color_ramp.elements[0].color = (1, 1, 1, 1) # Pure water
node_ramp.color_ramp.elements[1].position = 0.65 # Edge feather into wet asphalt
node_ramp.color_ramp.elements[1].color = (0, 0, 0, 1) # Dry asphalt
links.new(node_grad.outputs['Fac'], node_ramp.inputs['Fac'])

# Water Ripple Texture: Concentric rings + noise
node_noise = nodes.new('ShaderNodeTexNoise')
node_noise.inputs['Scale'].default_value = 18.0
node_noise.inputs['Detail'].default_value = 4.0
node_noise.inputs['Roughness'].default_value = 0.5

node_wave = nodes.new('ShaderNodeTexWave')
node_wave.wave_type = 'RINGS'
node_wave.rings_direction = 'SPHERICAL'
node_wave.inputs['Scale'].default_value = 8.0
node_wave.inputs['Distortion'].default_value = 4.0
node_wave.inputs['Detail'].default_value = 2.0
node_wave.inputs['Phase Offset'].default_value = 3.5 # Ripple propagation

# Combine waves and noise into bump
node_bump = nodes.new('ShaderNodeBump')
node_bump.inputs['Strength'].default_value = 0.18 # Crisp water ripples!
node_bump.inputs['Distance'].default_value = 0.05
links.new(node_wave.outputs['Color'], node_bump.inputs['Height'])

# Mix Roughness: Puddle = 0.005 (mirror glass), Wet Asphalt = 0.35
node_map_rough = nodes.new('ShaderNodeMapRange')
node_map_rough.inputs['From Min'].default_value = 0.0
node_map_rough.inputs['From Max'].default_value = 1.0
node_map_rough.inputs['To Min'].default_value = 0.35  # Dry/wet asphalt roughness
node_map_rough.inputs['To Max'].default_value = 0.005 # Glass puddle roughness
links.new(node_ramp.outputs['Color'], node_map_rough.inputs['Value'])
links.new(node_map_rough.outputs['Result'], node_bsdf.inputs['Roughness'])

# Base Color: Asphalt dark charcoal (0.03, 0.035, 0.04), Puddle dark murky water
node_bsdf.inputs['Base Color'].default_value = (0.02, 0.025, 0.03, 1.0)
node_bsdf.inputs['Metallic'].default_value = 0.85 # Highly reflective
node_bsdf.inputs['IOR'].default_value = 1.333 # Water IOR
links.new(node_bump.outputs['Normal'], node_bsdf.inputs['Normal'])

links.new(node_bsdf.outputs['BSDF'], node_out.inputs['Surface'])

# Add Ground Plane
bpy.ops.mesh.primitive_plane_add(size=30.0, location=(0, 0, 0))
ground = bpy.context.active_object
ground.data.materials.append(m_ground)

# Backlight Sodium Area Light (large fixture so the puddle catches a wide, shimmering reflection streak!)
lamp_data = bpy.data.lights.new('SodiumBacklight', 'AREA')
lamp_data.shape = 'RECTANGLE'
lamp_data.size = 3.0
lamp_data.size_y = 2.0
lamp_data.energy = 12000.0
lamp_data.color = (1.0, 0.72, 0.20) # Rich golden amber sodium
lamp_obj = bpy.data.objects.new('SodiumBacklight', lamp_data)
lamp_obj.location = (0.2, 4.0, 1.8)
lamp_obj.rotation_euler = (math.radians(-65), 0, 0) # Angled down towards puddle & camera
scene.collection.objects.link(lamp_obj)

# Visual lamp pole in background
m_pole = bpy.data.materials.new('Pole')
m_pole.use_nodes = True
pbsdf = m_pole.node_tree.nodes.get('Principled BSDF')
pbsdf.inputs['Base Color'].default_value = (0.08, 0.07, 0.06, 1.0)

bpy.ops.mesh.primitive_cylinder_add(radius=0.08, depth=6.0, location=(0.3, 3.5, 3.0))
bpy.context.active_object.data.materials.append(m_pole)

# Glowing lamp head
m_glow = bpy.data.materials.new('Glow')
gbsdf = m_glow.node_tree.nodes.get('Principled BSDF')
gbsdf.inputs['Emission Color'].default_value = (1.0, 0.75, 0.25, 1.0)
gbsdf.inputs['Emission Strength'].default_value = 25.0
bpy.ops.mesh.primitive_cube_add(size=0.7, location=(0.3, 3.5, 5.8))
bpy.context.active_object.data.materials.append(m_glow)

# Cool Moon/Sky Rim
fill_data = bpy.data.lights.new('MoonRim', 'SUN')
fill_data.energy = 3.5
fill_data.color = (0.4, 0.65, 1.0)
fill_obj = bpy.data.objects.new('MoonRim', fill_data)
fill_obj.rotation_euler = (math.radians(50), math.radians(-25), math.radians(45))
scene.collection.objects.link(fill_obj)

# Macro Tarantino/Guy Ritchie Camera Framing:
# Ground level: Z = 0.22m, distance Y = -2.6m, 48mm macro lens, looking right across the water surface!
cam_data = bpy.data.cameras.new('MacroCinemaCam')
cam_data.lens = 48
cam_obj = bpy.data.objects.new('MacroCinemaCam', cam_data)
cam_obj.location = (0.0, -2.6, 0.22)
cam_obj.rotation_euler = (math.radians(86), 0, 0)
scene.collection.objects.link(cam_obj)
scene.camera = cam_obj

# Color management
scene.view_settings.view_transform = 'AgX'
scene.view_settings.exposure = 0.5

# Load Red
CANONICAL_BLEND = r'C:\Users\zakde\Desktop\AntiGravity projects\MyOS\uniracer_model.blend'
with bpy.data.libraries.load(CANONICAL_BLEND, link=False) as (data_from, data_to):
    data_to.collections = ['New_Uniracer_Model']
red_col = data_to.collections[0]
scene.collection.children.link(red_col)

for obj in red_col.all_objects:
    if obj.type == 'ARMATURE':
        obj.scale = (0.034, 0.034, 0.034)
        obj.location = (0.0, 0.0, 0.41)
        obj.rotation_euler = (0, 0, math.radians(-90))
        break

out_path = r'C:\Users\zakde\.gemini\antigravity\brain\5d778f69-db13-4232-9d87-80fc4f0ece4e\test_puddle_ripples.png'
scene.render.filepath = out_path
bpy.ops.render.render(write_still=True)
print('✅ Done rendering test_puddle_ripples.png!')
