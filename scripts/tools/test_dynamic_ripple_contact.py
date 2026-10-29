# scripts/tools/test_dynamic_ripple_contact.py
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

# World: Gritty dark rainy night
world = scene.world or bpy.data.worlds.new('World')
scene.world = world
world.use_nodes = True
bg = world.node_tree.nodes.get('Background')
if bg:
    bg.inputs[0].default_value = (0.01, 0.012, 0.02, 1.0)
    bg.inputs[1].default_value = 0.25

# Create Ripple Tracker Empty
ripple_empty = bpy.data.objects.new("RippleCenter", None)
ripple_empty.empty_display_type = 'SPHERE'
ripple_empty.empty_display_size = 0.3
ripple_empty.location = (0.0, 0.0, 0.0) # Will follow tire contact
scene.collection.objects.link(ripple_empty)

# Create Ground Material with Dynamic Ripple Normals
m_ground = bpy.data.materials.new('CinematicPuddleStreet')
m_ground.use_nodes = True
nt = m_ground.node_tree
nodes = nt.nodes
links = nt.links
nodes.clear()

node_out = nodes.new('ShaderNodeOutputMaterial')
node_bsdf = nodes.new('ShaderNodeBsdfPrincipled')
node_texcoord = nodes.new('ShaderNodeTexCoord')
node_texcoord.object = ripple_empty # Center wave on ripple_empty!

# 1. Puddle Edge Mask (World Space Gradient)
node_world_coord = nodes.new('ShaderNodeTexCoord')
node_puddle_map = nodes.new('ShaderNodeMapping')
node_puddle_map.inputs['Scale'].default_value = (0.7, 1.2, 1.0)
links.new(node_world_coord.outputs['Object'], node_puddle_map.inputs['Vector'])

node_grad = nodes.new('ShaderNodeTexGradient')
node_grad.gradient_type = 'SPHERICAL'
links.new(node_puddle_map.outputs['Vector'], node_grad.inputs['Vector'])

node_ramp = nodes.new('ShaderNodeValToRGB')
node_ramp.color_ramp.interpolation = 'EASE'
node_ramp.color_ramp.elements[0].position = 0.30
node_ramp.color_ramp.elements[0].color = (1, 1, 1, 1) # Pure water mirror
node_ramp.color_ramp.elements[1].position = 0.60
node_ramp.color_ramp.elements[1].color = (0, 0, 0, 1) # Asphalt
links.new(node_grad.outputs['Fac'], node_ramp.inputs['Fac'])

# Roughness mapping
node_map_rough = nodes.new('ShaderNodeMapRange')
node_map_rough.inputs['From Min'].default_value = 0.0
node_map_rough.inputs['From Max'].default_value = 1.0
node_map_rough.inputs['To Min'].default_value = 0.35  # Wet asphalt roughness
node_map_rough.inputs['To Max'].default_value = 0.005 # Glassy puddle surface
links.new(node_ramp.outputs['Color'], node_map_rough.inputs['Value'])
links.new(node_map_rough.outputs['Result'], node_bsdf.inputs['Roughness'])

# 2. Concentric Dynamic Ripple Waves originating from RippleCenter
node_wave = nodes.new('ShaderNodeTexWave')
node_wave.wave_type = 'RINGS'
node_wave.rings_direction = 'SPHERICAL'
node_wave.inputs['Scale'].default_value = 10.0
node_wave.inputs['Distortion'].default_value = 3.5
node_wave.inputs['Detail'].default_value = 2.0
node_wave.inputs['Phase Offset'].default_value = 2.5
links.new(node_texcoord.outputs['Object'], node_wave.inputs['Vector'])

# Subtle ambient surface noise for organic water tension
node_noise = nodes.new('ShaderNodeTexNoise')
node_noise.inputs['Scale'].default_value = 22.0
node_noise.inputs['Detail'].default_value = 3.0
links.new(node_world_coord.outputs['Object'], node_noise.inputs['Vector'])

# Add wave + noise
node_add_wave = nodes.new('ShaderNodeMath')
node_add_wave.operation = 'ADD'
links.new(node_noise.outputs['Fac'], node_add_wave.inputs[0])
links.new(node_wave.outputs['Color'], node_add_wave.inputs[1])

# Ripple Bump Normal
node_bump = nodes.new('ShaderNodeBump')
node_bump.inputs['Strength'].default_value = 0.22 # Crisp ripple waves
node_bump.inputs['Distance'].default_value = 0.04
links.new(node_add_wave.outputs['Value'], node_bump.inputs['Height'])
links.new(node_bump.outputs['Normal'], node_bsdf.inputs['Normal'])

# BSDF Base Properties
node_bsdf.inputs['Base Color'].default_value = (0.02, 0.025, 0.03, 1.0)
node_bsdf.inputs['Metallic'].default_value = 0.85
node_bsdf.inputs['IOR'].default_value = 1.333
links.new(node_bsdf.outputs['BSDF'], node_out.inputs['Surface'])

# Ground Plane
bpy.ops.mesh.primitive_plane_add(size=30.0, location=(0, 0, 0))
ground = bpy.context.active_object
ground.data.materials.append(m_ground)

# Lighting: Tarantino / Guy Ritchie Golden Sodium Backlight
# Large Area Light angled directly down into puddle towards the macro camera
lamp_data = bpy.data.lights.new('SodiumBacklight', 'AREA')
lamp_data.shape = 'ELLIPSE'
lamp_data.size = 3.5
lamp_data.size_y = 2.5
lamp_data.energy = 9500.0
lamp_data.color = (1.0, 0.72, 0.20) # Golden amber sodium
lamp_obj = bpy.data.objects.new('SodiumBacklight', lamp_data)
lamp_obj.location = (0.2, 4.2, 2.2)
lamp_obj.rotation_euler = (math.radians(-62), 0, 0)
scene.collection.objects.link(lamp_obj)

# Visual streetlamp fixture
m_pole = bpy.data.materials.new('Pole')
pbsdf = m_pole.node_tree.nodes.get('Principled BSDF')
pbsdf.inputs['Base Color'].default_value = (0.06, 0.06, 0.07, 1.0)
bpy.ops.mesh.primitive_cylinder_add(radius=0.08, depth=6.0, location=(0.2, 4.2, 3.0))
bpy.context.active_object.data.materials.append(m_pole)

# Glowing fixture housing
m_glow = bpy.data.materials.new('Glow')
gbsdf = m_glow.node_tree.nodes.get('Principled BSDF')
gbsdf.inputs['Emission Color'].default_value = (1.0, 0.75, 0.25, 1.0)
gbsdf.inputs['Emission Strength'].default_value = 30.0
bpy.ops.mesh.primitive_cube_add(size=0.7, location=(0.2, 4.2, 5.8))
bpy.context.active_object.data.materials.append(m_glow)

# Ambient Moon/Sky Fill
fill_data = bpy.data.lights.new('MoonRim', 'SUN')
fill_data.energy = 2.8
fill_data.color = (0.35, 0.55, 0.85)
fill_obj = bpy.data.objects.new('MoonRim', fill_data)
fill_obj.rotation_euler = (math.radians(50), math.radians(-25), math.radians(45))
scene.collection.objects.link(fill_obj)

# Macro Tarantino/Guy Ritchie Camera Framing:
# Ground level: Z = 0.20m, distance Y = -2.5m, 48mm macro lens, looking right across the water surface!
cam_data = bpy.data.cameras.new('MacroCinemaCam')
cam_data.lens = 48
cam_obj = bpy.data.objects.new('MacroCinemaCam', cam_data)
cam_obj.location = (0.0, -2.5, 0.20)
cam_obj.rotation_euler = (math.radians(86), 0, 0)
scene.collection.objects.link(cam_obj)
scene.camera = cam_obj

# Color management
scene.view_settings.view_transform = 'AgX'
scene.view_settings.exposure = 0.4

# Load Red from Canonical
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

out_path = r'C:\Users\zakde\.gemini\antigravity\brain\5d778f69-db13-4232-9d87-80fc4f0ece4e\test_dynamic_ripple_contact.png'
scene.render.filepath = out_path
bpy.ops.render.render(write_still=True)
print('✅ Done rendering test_dynamic_ripple_contact.png!')
