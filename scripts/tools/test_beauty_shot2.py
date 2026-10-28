# scripts/tools/test_beauty_shot2.py
import bpy
import os
import math
from mathutils import Vector, Euler

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = 'BLENDER_EEVEE'
try:
    scene.eevee.use_raytracing = True
except Exception as e:
    print(f"Raytracing enable note: {e}")
scene.render.resolution_x = 1280
scene.render.resolution_y = 720

# World
world = scene.world or bpy.data.worlds.new('World')
scene.world = world
world.use_nodes = True
bg = world.node_tree.nodes.get('Background')
if bg:
    bg.inputs[0].default_value = (0.015, 0.02, 0.04, 1.0)
    bg.inputs[1].default_value = 0.4

# Asphalt ground
m_asphalt = bpy.data.materials.new('WetAsphalt')
m_asphalt.use_nodes = True
bsdf = m_asphalt.node_tree.nodes.get('Principled BSDF')
bsdf.inputs['Base Color'].default_value = (0.04, 0.045, 0.05, 1.0)
bsdf.inputs['Roughness'].default_value = 0.25
bsdf.inputs['Metallic'].default_value = 0.1

bpy.ops.mesh.primitive_plane_add(size=40.0, location=(0, 0, 0))
ground = bpy.context.active_object
ground.data.materials.append(m_asphalt)

# Water puddle (high specular, near 0 roughness)
m_water = bpy.data.materials.new('Water')
m_water.use_nodes = True
wbsdf = m_water.node_tree.nodes.get('Principled BSDF')
wbsdf.inputs['Base Color'].default_value = (0.01, 0.015, 0.02, 1.0)
wbsdf.inputs['Roughness'].default_value = 0.01
wbsdf.inputs['Metallic'].default_value = 0.95
wbsdf.inputs['IOR'].default_value = 1.333

bpy.ops.mesh.primitive_cylinder_add(radius=1.8, depth=0.002, location=(0, 0, 0.001))
puddle = bpy.context.active_object
puddle.scale = (1.5, 0.9, 1.0)
puddle.data.materials.append(m_water)

# BACKLIGHT Sodium Lamp (places golden reflection streak right in camera's line of sight!)
lamp_data = bpy.data.lights.new('SodiumBacklight', 'POINT')
lamp_data.energy = 4500.0
lamp_data.color = (1.0, 0.72, 0.25)
lamp_obj = bpy.data.objects.new('SodiumBacklight', lamp_data)
lamp_obj.location = (0.2, 3.2, 2.4)
scene.collection.objects.link(lamp_obj)

# Visual lamp housing in background
m_glow = bpy.data.materials.new('Glow')
gbsdf = m_glow.node_tree.nodes.get('Principled BSDF')
gbsdf.inputs['Emission Color'].default_value = (1.0, 0.75, 0.3, 1.0)
gbsdf.inputs['Emission Strength'].default_value = 15.0

bpy.ops.mesh.primitive_cylinder_add(radius=0.06, depth=5.0, location=(0.2, 3.2, 2.5))
bpy.context.active_object.data.materials.append(m_asphalt)
bpy.ops.mesh.primitive_cube_add(size=0.6, location=(0.2, 3.2, 5.0))
bpy.context.active_object.data.materials.append(m_glow)

# Background junk silhouettes (tires and iron beam)
m_junk = bpy.data.materials.new('Junk')
jbsdf = m_junk.node_tree.nodes.get('Principled BSDF')
jbsdf.inputs['Base Color'].default_value = (0.1, 0.08, 0.07, 1.0)
jbsdf.inputs['Roughness'].default_value = 0.85

for tz in range(4):
    bpy.ops.mesh.primitive_torus_add(major_radius=0.8, minor_radius=0.3, location=(-2.5, 2.5, 0.3 + tz*0.55))
    bpy.context.active_object.data.materials.append(m_junk)

for tz in range(3):
    bpy.ops.mesh.primitive_torus_add(major_radius=0.7, minor_radius=0.25, location=(2.2, 2.8, 0.25 + tz*0.5))
    bpy.context.active_object.data.materials.append(m_junk)

# Cool rim/fill light
fill_data = bpy.data.lights.new('MoonRim', 'SUN')
fill_data.energy = 5.0
fill_data.color = (0.50, 0.75, 1.0)
fill_obj = bpy.data.objects.new('MoonRim', fill_data)
fill_obj.rotation_euler = (math.radians(45), math.radians(-30), math.radians(60))
scene.collection.objects.link(fill_obj)

# Front low kicker to light Red's red paint & chrome
kicker_data = bpy.data.lights.new('FrontKicker', 'POINT')
kicker_data.energy = 1200.0
kicker_data.color = (0.8, 0.85, 1.0)
kicker_obj = bpy.data.objects.new('FrontKicker', kicker_data)
kicker_obj.location = (-1.5, -2.5, 0.8)
scene.collection.objects.link(kicker_obj)

# Camera (heroic framing showing full unicycle profile and puddle)
cam_data = bpy.data.cameras.new('CinematicCamera')
cam_data.lens = 35
cam_obj = bpy.data.objects.new('CinematicCamera', cam_data)
cam_obj.location = (0.0, -3.8, 0.65)
cam_obj.rotation_euler = (math.radians(82), 0, 0)
scene.collection.objects.link(cam_obj)
scene.camera = cam_obj

# Color management
scene.view_settings.view_transform = 'AgX'
scene.view_settings.exposure = 0.8

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

out_path = r'C:\Users\zakde\.gemini\antigravity\brain\5d778f69-db13-4232-9d87-80fc4f0ece4e\test_beauty_shot2.png'
scene.render.filepath = out_path
bpy.ops.render.render(write_still=True)
print('✅ Done rendering test beauty shot 2!')
