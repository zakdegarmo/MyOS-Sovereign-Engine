import bpy
import bmesh
import math
import os
import sys

print("[BLENDER_BUILDER] Starting procedural vehicle build...")

# Reset scene to factory clean state
bpy.ops.wm.read_factory_settings(use_empty=True)

scene = bpy.context.scene
scene.render.fps = 30
scene.render.resolution_x = 1280
scene.render.resolution_y = 720
scene.render.resolution_percentage = 100

WORKSPACE_ROOT = r"C:\Users\zakde\Desktop\AntiGravity projects\MyOS"
ARTIFACTS_DIR = r"C:\Users\zakde\.gemini\antigravity\brain\5d778f69-db13-4232-9d87-80fc4f0ece4e"
OUTPUT_GLB = os.path.join(WORKSPACE_ROOT, "apps", "web", "public", "models", "astra_stuntcraft_hero.glb")
OUTPUT_BLEND = os.path.join(WORKSPACE_ROOT, "uniracer_stuntcraft_master.blend")
OUTPUT_RENDER = os.path.join(ARTIFACTS_DIR, "blender_headless_stuntcraft_showcase.png")

# -------------------------------------------------------------
# 1. PBR MATERIALS
# -------------------------------------------------------------
def create_pbr_mat(name, base_color, metallic=0.0, roughness=0.3, emission=None, emission_strength=1.0):
    mat = bpy.data.materials.new(name=name)
    nodes = mat.node_tree.nodes
    nodes.clear()
    
    node_out = nodes.new(type='ShaderNodeOutputMaterial')
    node_bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
    node_bsdf.inputs['Base Color'].default_value = base_color
    node_bsdf.inputs['Metallic'].default_value = metallic
    node_bsdf.inputs['Roughness'].default_value = roughness
    
    if emission:
        node_bsdf.inputs['Emission Color'].default_value = emission
        node_bsdf.inputs['Emission Strength'].default_value = emission_strength
        
    mat.node_tree.links.new(node_bsdf.outputs['BSDF'], node_out.inputs['Surface'])
    return mat

mat_chassis  = create_pbr_mat("Mat_Chassis_CyberCyan", (0.05, 0.75, 0.95, 1.0), metallic=0.85, roughness=0.18)
mat_chrome   = create_pbr_mat("Mat_Chrome_Polished",   (0.92, 0.94, 0.98, 1.0), metallic=0.98, roughness=0.08)
mat_tire     = create_pbr_mat("Mat_Tire_Rubber",       (0.08, 0.08, 0.10, 1.0), metallic=0.05, roughness=0.55)
mat_thruster = create_pbr_mat("Mat_Thruster_Core",     (1.0, 0.15, 0.75, 1.0), metallic=0.0, roughness=0.1, emission=(1.0, 0.1, 0.7, 1.0), emission_strength=12.0)
mat_exhaust  = create_pbr_mat("Mat_Exhaust_Titanium",  (0.25, 0.28, 0.32, 1.0), metallic=0.9, roughness=0.2)
mat_saddle   = create_pbr_mat("Mat_Saddle_GoldTrim",   (0.95, 0.75, 0.15, 1.0), metallic=0.2, roughness=0.35)
mat_neon_hub = create_pbr_mat("Mat_Neon_HubGlow",      (0.0, 1.0, 0.85, 1.0), metallic=0.1, roughness=0.1, emission=(0.0, 1.0, 0.85, 1.0), emission_strength=8.0)

# -------------------------------------------------------------
# 2. CANONICAL UNIRACER GEOMETRY (Axle along X, Rolls along Y, Up along Z)
# -------------------------------------------------------------
print("[BLENDER_BUILDER] Constructing canonical 3D geometry...")

# A. Wheel Assembly (Axle along X axis)
# Main Rubber Tire: Torus rotated 90 deg around Y
bpy.ops.mesh.primitive_torus_add(
    major_radius=0.9, minor_radius=0.16, major_segments=48, minor_segments=24,
    location=(0, 0, 1.0), rotation=(0, math.radians(90), 0)
)
tire_obj = bpy.context.active_object
tire_obj.name = "Mesh_Tire"
tire_obj.data.materials.append(mat_tire)

# Inner Chrome Hub Rim (Cylinder along X)
bpy.ops.mesh.primitive_cylinder_add(
    radius=0.74, depth=0.14, vertices=32,
    location=(0, 0, 1.0), rotation=(0, math.radians(90), 0)
)
hub_obj = bpy.context.active_object
hub_obj.name = "Mesh_HubRim"
hub_obj.data.materials.append(mat_chrome)

# Center Axle & Glowing Neon Hub
bpy.ops.mesh.primitive_cylinder_add(
    radius=0.26, depth=0.42, vertices=24,
    location=(0, 0, 1.0), rotation=(0, math.radians(90), 0)
)
axle_obj = bpy.context.active_object
axle_obj.name = "Mesh_AxleHub"
axle_obj.data.materials.append(mat_neon_hub)

# Radial Spokes (Spinning around X in YZ plane)
spokes = []
for i in range(12):
    ang = i * (math.pi / 6)
    bpy.ops.mesh.primitive_cylinder_add(
        radius=0.018, depth=1.45, vertices=8,
        location=(0, 0, 1.0),
        rotation=(ang, 0, 0)
    )
    spk = bpy.context.active_object
    spk.name = f"Mesh_Spoke_{i}"
    spk.data.materials.append(mat_chrome)
    spokes.append(spk)

# Join Wheel Assembly into single mesh
bpy.ops.object.select_all(action='DESELECT')
tire_obj.select_set(True)
hub_obj.select_set(True)
axle_obj.select_set(True)
for spk in spokes:
    spk.select_set(True)
bpy.context.view_layer.objects.active = tire_obj
bpy.ops.object.join()
wheel_mesh = bpy.context.active_object
wheel_mesh.name = "Mesh_WheelAssembly"

# B. Dual Forks (Left & Right clamping axle at X = +/- 0.24)
bpy.ops.mesh.primitive_cylinder_add(radius=0.045, depth=1.35, vertices=16, location=(-0.24, 0, 1.62))
fork_l = bpy.context.active_object
fork_l.name = "Mesh_Fork_L"
fork_l.data.materials.append(mat_chrome)

bpy.ops.mesh.primitive_cylinder_add(radius=0.045, depth=1.35, vertices=16, location=(0.24, 0, 1.62))
fork_r = bpy.context.active_object
fork_r.name = "Mesh_Fork_R"
fork_r.data.materials.append(mat_chrome)

# Fork Crown Bridge
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 2.25))
crown = bpy.context.active_object
crown.scale = (0.32, 0.14, 0.09)
crown.name = "Mesh_Crown"
crown.data.materials.append(mat_chassis)

# C. Sweeping Aero Chassis / Cowl
bpy.ops.mesh.primitive_cone_add(radius1=0.28, radius2=0.08, depth=1.1, vertices=18, location=(0, 0.12, 2.75), rotation=(math.radians(20), 0, 0))
cowl = bpy.context.active_object
cowl.name = "Mesh_Cowl"
cowl.scale = (0.9, 0.8, 1.0)
cowl.data.materials.append(mat_chassis)

# Retro Racing Saddle (Sleek aerodynamic seat)
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -0.05, 3.05))
saddle = bpy.context.active_object
saddle.name = "Mesh_Saddle"
saddle.scale = (0.22, 0.75, 0.12)
saddle.data.materials.append(mat_saddle)

# Stunt Grab Handle
bpy.ops.mesh.primitive_torus_add(major_radius=0.16, minor_radius=0.03, location=(0, 0.38, 2.95), rotation=(math.radians(90), 0, 0))
grip = bpy.context.active_object
grip.name = "Mesh_StuntGrip"
grip.data.materials.append(mat_chrome)

# D. Twin Turbo Jet Thrusters (Pointing rearward along -Y)
bpy.ops.mesh.primitive_cylinder_add(radius=0.11, depth=0.75, vertices=18, location=(-0.32, -0.28, 2.45), rotation=(math.radians(80), 0, 0))
thruster_l = bpy.context.active_object
thruster_l.name = "Mesh_Thruster_L"
thruster_l.data.materials.append(mat_exhaust)

bpy.ops.mesh.primitive_cone_add(radius1=0.08, radius2=0.01, depth=0.35, vertices=16, location=(-0.32, -0.7, 2.4), rotation=(math.radians(-100), 0, 0))
flame_l = bpy.context.active_object
flame_l.name = "Mesh_Flame_L"
flame_l.data.materials.append(mat_thruster)

bpy.ops.mesh.primitive_cylinder_add(radius=0.11, depth=0.75, vertices=18, location=(0.32, -0.28, 2.45), rotation=(math.radians(80), 0, 0))
thruster_r = bpy.context.active_object
thruster_r.name = "Mesh_Thruster_R"
thruster_r.data.materials.append(mat_exhaust)

bpy.ops.mesh.primitive_cone_add(radius1=0.08, radius2=0.01, depth=0.35, vertices=16, location=(0.32, -0.7, 2.4), rotation=(math.radians(-100), 0, 0))
flame_r = bpy.context.active_object
flame_r.name = "Mesh_Flame_R"
flame_r.data.materials.append(mat_thruster)

# Rear Aero Wing / Downforce Spoiler
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -0.48, 2.75))
wing = bpy.context.active_object
wing.scale = (0.65, 0.14, 0.03)
wing.rotation_euler = (math.radians(-18), 0, 0)
wing.name = "Mesh_AeroWing"
wing.data.materials.append(mat_chassis)

# Wing Endplates
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-0.65, -0.48, 2.8))
endplate_l = bpy.context.active_object
endplate_l.scale = (0.02, 0.18, 0.14)
endplate_l.data.materials.append(mat_neon_hub)

bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.65, -0.48, 2.8))
endplate_r = bpy.context.active_object
endplate_r.scale = (0.02, 0.18, 0.14)
endplate_r.data.materials.append(mat_neon_hub)

# E. Left & Right Cranks and Pedals
# Left Crank (along +Y/Z)
bpy.ops.mesh.primitive_cylinder_add(radius=0.035, depth=0.48, vertices=14, location=(-0.26, 0.18, 1.18), rotation=(math.radians(50), 0, 0))
crank_l = bpy.context.active_object
crank_l.name = "Mesh_Crank_L"
crank_l.data.materials.append(mat_chrome)

bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-0.36, 0.35, 1.35))
pedal_l = bpy.context.active_object
pedal_l.scale = (0.12, 0.18, 0.05)
pedal_l.name = "Mesh_Pedal_L"
pedal_l.data.materials.append(mat_exhaust)

# Right Crank (along -Y/Z, 180 opposite)
bpy.ops.mesh.primitive_cylinder_add(radius=0.035, depth=0.48, vertices=14, location=(0.26, -0.18, 0.82), rotation=(math.radians(-130), 0, 0))
crank_r = bpy.context.active_object
crank_r.name = "Mesh_Crank_R"
crank_r.data.materials.append(mat_chrome)

bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.36, -0.35, 0.65))
pedal_r = bpy.context.active_object
pedal_r.scale = (0.12, 0.18, 0.05)
pedal_r.name = "Mesh_Pedal_R"
pedal_r.data.materials.append(mat_exhaust)

# Join Body into Chassis Master
bpy.ops.object.select_all(action='DESELECT')
for obj in [fork_l, fork_r, crown, cowl, saddle, grip, thruster_l, flame_l, thruster_r, flame_r, wing, endplate_l, endplate_r]:
    obj.select_set(True)
bpy.context.view_layer.objects.active = cowl
bpy.ops.object.join()
chassis_mesh = bpy.context.active_object
chassis_mesh.name = "Mesh_ChassisMaster"

# Join Left Pedal
bpy.ops.object.select_all(action='DESELECT')
crank_l.select_set(True)
pedal_l.select_set(True)
bpy.context.view_layer.objects.active = crank_l
bpy.ops.object.join()
pedal_assembly_l = bpy.context.active_object
pedal_assembly_l.name = "Mesh_PedalAssembly_L"

# Join Right Pedal
bpy.ops.object.select_all(action='DESELECT')
crank_r.select_set(True)
pedal_r.select_set(True)
bpy.context.view_layer.objects.active = crank_r
bpy.ops.object.join()
pedal_assembly_r = bpy.context.active_object
pedal_assembly_r.name = "Mesh_PedalAssembly_R"

# Smooth shading
for obj in [wheel_mesh, chassis_mesh, pedal_assembly_l, pedal_assembly_r]:
    for poly in obj.data.polygons:
        poly.use_smooth = True

print("[BLENDER_BUILDER] Meshes constructed.")

# -------------------------------------------------------------
# 3. SKELETAL RIGGING
# -------------------------------------------------------------
print("[BLENDER_BUILDER] Rigging Armature...")
bpy.ops.object.armature_add(location=(0, 0, 0))
arm_obj = bpy.context.active_object
arm_obj.name = "Armature_Stuntcraft"
arm_data = arm_obj.data
arm_data.name = "ArmatureData"

bpy.ops.object.mode_set(mode='EDIT')
eb = arm_data.edit_bones

bone_root = eb['Bone']
bone_root.name = 'root'
bone_root.head = (0, 0, 0)
bone_root.tail = (0, 0, 0.5)

bone_hub = eb.new('bone_hub')
bone_hub.head = (0, 0, 1.0)
bone_hub.tail = (0, 0, 1.4)
bone_hub.parent = bone_root

bone_chassis = eb.new('bone_chassis')
bone_chassis.head = (0, 0, 1.0)
bone_chassis.tail = (0, 0, 2.9)
bone_chassis.parent = bone_root

bone_pedal_l = eb.new('bone_pedal_l')
bone_pedal_l.head = (-0.26, 0, 1.0)
bone_pedal_l.tail = (-0.36, 0.35, 1.35)
bone_pedal_l.parent = bone_hub

bone_pedal_r = eb.new('bone_pedal_r')
bone_pedal_r.head = (0.26, 0, 1.0)
bone_pedal_r.tail = (0.36, -0.35, 0.65)
bone_pedal_r.parent = bone_hub

bpy.ops.object.mode_set(mode='OBJECT')

def parent_to_bone(mesh_obj, bone_name):
    mesh_obj.parent = arm_obj
    mesh_obj.parent_type = 'BONE'
    mesh_obj.parent_bone = bone_name

parent_to_bone(wheel_mesh, 'bone_hub')
parent_to_bone(chassis_mesh, 'bone_chassis')
parent_to_bone(pedal_assembly_l, 'bone_pedal_l')
parent_to_bone(pedal_assembly_r, 'bone_pedal_r')

print("[BLENDER_BUILDER] Armature bound.")

# -------------------------------------------------------------
# 4. KEYFRAMING & BAKING 4 STUNT ACTIONS
# -------------------------------------------------------------
print("[BLENDER_BUILDER] Baking 4 Stunt Actions...")
arm_obj.animation_data_create()

p_chassis = arm_obj.pose.bones['bone_chassis']
p_hub = arm_obj.pose.bones['bone_hub']
p_root = arm_obj.pose.bones['root']

# ACTION 1: stunt_afterburner_backflip (30 frames)
act_flip = bpy.data.actions.new(name="stunt_afterburner_backflip")
arm_obj.animation_data.action = act_flip
for f, rot_x, z_lift in [
    (1,  0.0, 0.0),
    (8,  -math.radians(90), 1.2),
    (15, -math.radians(180), 2.2),
    (22, -math.radians(270), 1.1),
    (30, -math.radians(360), 0.0)
]:
    p_root.rotation_mode = 'XYZ'
    p_root.rotation_euler = (rot_x, 0, 0)
    p_root.location = (0, 0, z_lift)
    p_root.keyframe_insert(data_path="rotation_euler", frame=f)
    p_root.keyframe_insert(data_path="location", frame=f)

for f, spin in [(1, 0), (15, math.radians(720)), (30, math.radians(1440))]:
    p_hub.rotation_mode = 'XYZ'
    p_hub.rotation_euler = (spin, 0, 0)
    p_hub.keyframe_insert(data_path="rotation_euler", frame=f)

# ACTION 2: stunt_supersonic_corkscrew (30 frames)
act_cork = bpy.data.actions.new(name="stunt_supersonic_corkscrew")
arm_obj.animation_data.action = act_cork
for f, roll_y, yaw_z, lift in [
    (1,  0, 0, 0.0),
    (7,  math.radians(180), math.radians(45), 1.5),
    (15, math.radians(360), math.radians(90), 2.2),
    (23, math.radians(540), math.radians(45), 1.4),
    (30, math.radians(720), 0, 0.0)
]:
    p_root.rotation_mode = 'XYZ'
    p_root.rotation_euler = (0, roll_y, yaw_z)
    p_root.location = (0, 0, lift)
    p_root.keyframe_insert(data_path="rotation_euler", frame=f)
    p_root.keyframe_insert(data_path="location", frame=f)

# ACTION 3: stunt_tabletop_whip (30 frames)
act_whip = bpy.data.actions.new(name="stunt_tabletop_whip")
arm_obj.animation_data.action = act_whip
for f, roll, yaw, pitch in [
    (1,  0, 0, 0),
    (10, math.radians(85), math.radians(30), math.radians(-20)),
    (18, math.radians(90), math.radians(45), math.radians(-10)),
    (24, math.radians(30), math.radians(10), 0),
    (30, 0, 0, 0)
]:
    p_chassis.rotation_mode = 'XYZ'
    p_chassis.rotation_euler = (pitch, roll, yaw)
    p_chassis.keyframe_insert(data_path="rotation_euler", frame=f)

# ACTION 4: idle_hover_pulse (40 frames)
act_idle = bpy.data.actions.new(name="idle_hover_pulse")
arm_obj.animation_data.action = act_idle
for f in range(1, 41):
    t = (f / 40.0) * math.pi * 2
    bob = math.sin(t) * 0.08
    tilt = math.sin(t) * 0.04
    p_root.location = (0, 0, bob)
    p_root.rotation_mode = 'XYZ'
    p_root.rotation_euler = (tilt, 0, 0)
    p_root.keyframe_insert(data_path="location", frame=f)
    p_root.keyframe_insert(data_path="rotation_euler", frame=f)

# Bake into NLA
for act in [act_flip, act_cork, act_whip, act_idle]:
    track = arm_obj.animation_data.nla_tracks.new()
    track.name = act.name
    track.strips.new(act.name, 1, act)

print("[BLENDER_BUILDER] Actions baked into NLA.")

# -------------------------------------------------------------
# 5. HIGH-VISIBILITY STUDIO STAGING & LIGHTS
# -------------------------------------------------------------
print("[BLENDER_BUILDER] Staging 3-point studio lighting...")

# Camera Target at Center of Vehicle (Z = 1.9)
bpy.ops.object.empty_add(type='PLAIN_AXES', location=(0, 0, 1.85))
target = bpy.context.active_object
target.name = "Cam_Target"

# Beauty 3/4 Isometric Camera
bpy.ops.object.camera_add(location=(6.0, -6.5, 3.8))
cam = bpy.context.active_object
cam.name = "Cam_StudioBeauty"
cam.data.lens = 38
scene.camera = cam

tt = cam.constraints.new(type='TRACK_TO')
tt.target = target
tt.track_axis = 'TRACK_NEGATIVE_Z'
tt.up_axis = 'UP_Y'

# Ambient World Fill
if scene.world:
    scene.world.use_nodes = True
    bg = scene.world.node_tree.nodes.get('Background')
    if bg:
        bg.inputs['Color'].default_value = (0.04, 0.05, 0.08, 1.0)
        bg.inputs['Strength'].default_value = 1.5

# Main Key Sun Light (Warm Cyber Gold)
bpy.ops.object.light_add(type='SUN', location=(5.0, -4.0, 6.0))
sun = bpy.context.active_object
sun.data.energy = 5.0
sun.data.color = (1.0, 0.96, 0.90)
sun.rotation_euler = (math.radians(45), math.radians(20), math.radians(-35))

# Front Fill Area Light (Electric Cyan)
bpy.ops.object.light_add(type='AREA', location=(3.0, -3.5, 2.5))
fill = bpy.context.active_object
fill.data.energy = 600
fill.data.size = 3.5
fill.data.color = (0.4, 0.85, 1.0)
fill_tt = fill.constraints.new(type='TRACK_TO')
fill_tt.target = target
fill_tt.track_axis = 'TRACK_NEGATIVE_Z'
fill_tt.up_axis = 'UP_Y'

# Back Rim Area Light (Hot Neon Pink/Amber)
bpy.ops.object.light_add(type='AREA', location=(-3.5, 3.5, 3.8))
rim = bpy.context.active_object
rim.data.energy = 800
rim.data.size = 3.0
rim.data.color = (1.0, 0.4, 0.8)
rim_tt = rim.constraints.new(type='TRACK_TO')
rim_tt.target = target
rim_tt.track_axis = 'TRACK_NEGATIVE_Z'
rim_tt.up_axis = 'UP_Y'

# Studio Ground Disc
bpy.ops.mesh.primitive_cylinder_add(radius=12.0, depth=0.1, vertices=48, location=(0, 0, -0.05))
floor = bpy.context.active_object
floor.name = "Studio_Floor"
mat_floor = create_pbr_mat("Mat_Floor_DarkGrid", (0.03, 0.03, 0.05, 1.0), metallic=0.8, roughness=0.2)
floor.data.materials.append(mat_floor)

# -------------------------------------------------------------
# 6. RENDER BEAUTY SHOWCASE
# -------------------------------------------------------------
print(f"[BLENDER_BUILDER] Rendering beauty still to: {OUTPUT_RENDER}...")
scene.render.image_settings.file_format = 'PNG'
scene.render.filepath = OUTPUT_RENDER
bpy.ops.render.render(write_still=True)
print("[BLENDER_BUILDER] Beauty render saved.")

# -------------------------------------------------------------
# 7. EXPORT GLB & MASTER BLEND
# -------------------------------------------------------------
print(f"[BLENDER_BUILDER] Saving master .blend to: {OUTPUT_BLEND}...")
bpy.ops.wm.save_as_mainfile(filepath=OUTPUT_BLEND)

print(f"[BLENDER_BUILDER] Exporting GLB to: {OUTPUT_GLB}...")
bpy.ops.object.select_all(action='DESELECT')
for obj in [wheel_mesh, chassis_mesh, pedal_assembly_l, pedal_assembly_r, arm_obj]:
    obj.select_set(True)

bpy.ops.export_scene.gltf(
    filepath=OUTPUT_GLB,
    use_selection=True,
    export_format='GLB',
    export_animations=True,
    export_nla_strips=True,
    export_apply=False
)
print("[BLENDER_BUILDER] Pipeline complete!")
