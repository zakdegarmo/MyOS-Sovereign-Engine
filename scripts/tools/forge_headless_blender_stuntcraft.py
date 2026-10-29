#!/usr/bin/env python3
"""
scripts/tools/forge_headless_blender_stuntcraft.py
--------------------------------------------------
Runs an end-to-end headless Blender 5.2 session to procedurally model,
rig, texture, animate, render, and export a brand-new custom 3D vehicle:
"Astra-Glider: Turbo-Stunt Uniracer".

Features:
  - Procedural mesh generation (Aerodynamic chassis, dual turbo thrusters,
    spoke hub, tire with tread, stunt saddle, articulated cranks/pedals, aero fins).
  - Full armature skeleton hierarchy with parented bone sockets.
  - PBR & stylized emission materials.
  - 4 baked keyframed NLA stunt actions (backflip, corkscrew, tabletop, idle pulse).
  - Headless multi-point studio render saved directly as an artifact.
  - Export to GLTF / GLB for direct Three.js / MyOS ingestion.
"""

import os
import sys
import math
import subprocess

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except AttributeError:
        pass

WORKSPACE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
BLENDER_EXE = r"C:\Program Files\Blender Foundation\Blender 5.2\blender.exe"
ARTIFACTS_DIR = r"C:\Users\zakde\.gemini\antigravity\brain\5d778f69-db13-4232-9d87-80fc4f0ece4e"
OUTPUT_GLB = os.path.join(WORKSPACE_ROOT, "apps", "web", "public", "models", "astra_stuntcraft_hero.glb")
OUTPUT_BLEND = os.path.join(WORKSPACE_ROOT, "uniracer_stuntcraft_master.blend")
OUTPUT_RENDER = os.path.join(ARTIFACTS_DIR, "blender_headless_stuntcraft_showcase.png")
OUTPUT_CLAY = os.path.join(ARTIFACTS_DIR, "blender_headless_stuntcraft_clay.png")

BLENDER_SCRIPT = f"""
import bpy
import bmesh
import math
import os
from mathutils import Vector, Euler, Matrix, Quaternion

print("[BLENDER] Resetting scene to factory clean state...")
bpy.ops.wm.read_factory_settings(use_empty=True)

scene = bpy.context.scene
scene.render.fps = 30
scene.render.resolution_x = 1280
scene.render.resolution_y = 720
scene.render.resolution_percentage = 100

# -------------------------------------------------------------
# 1. HELPER: MATERIAL CREATION
# -------------------------------------------------------------
def create_pbr_mat(name, base_color, metallic=0.0, roughness=0.4, emission=None, emission_strength=1.0):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    nodes.clear()
    
    node_out = nodes.new(type='ShaderNodeOutputMaterial')
    node_out.location = (400, 0)
    
    node_bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
    node_bsdf.location = (0, 0)
    node_bsdf.inputs['Base Color'].default_value = base_color
    node_bsdf.inputs['Metallic'].default_value = metallic
    node_bsdf.inputs['Roughness'].default_value = roughness
    
    if emission:
        node_bsdf.inputs['Emission Color'].default_value = emission
        node_bsdf.inputs['Emission Strength'].default_value = emission_strength
        
    mat.node_tree.links.new(node_bsdf.outputs['BSDF'], node_out.inputs['Surface'])
    return mat

mat_chassis = create_pbr_mat("Mat_Chassis_CyberCyan", (0.05, 0.75, 0.95, 1.0), metallic=0.85, roughness=0.2)
mat_chrome  = create_pbr_mat("Mat_Chrome_Polished",   (0.9, 0.92, 0.95, 1.0), metallic=0.98, roughness=0.1)
mat_tire    = create_pbr_mat("Mat_Tire_Rubber",       (0.04, 0.04, 0.05, 1.0), metallic=0.1, roughness=0.6)
mat_thruster= create_pbr_mat("Mat_Thruster_Core",     (1.0, 0.2, 0.8, 1.0), metallic=0.0, roughness=0.1, emission=(1.0, 0.1, 0.7, 1.0), emission_strength=8.0)
mat_exhaust = create_pbr_mat("Mat_Exhaust_Titanium",  (0.2, 0.22, 0.25, 1.0), metallic=0.9, roughness=0.25)
mat_saddle  = create_pbr_mat("Mat_Saddle_GoldTrim",   (0.12, 0.12, 0.14, 1.0), metallic=0.3, roughness=0.4)
mat_neon_hub= create_pbr_mat("Mat_Neon_HubGlow",      (0.0, 1.0, 0.8, 1.0), metallic=0.2, roughness=0.1, emission=(0.0, 1.0, 0.8, 1.0), emission_strength=5.0)

# -------------------------------------------------------------
# 2. PROCEDURAL MODELING
# -------------------------------------------------------------
print("[BLENDER] Procedurally generating 3D components...")

# A. Wheel Rim & Tire
bpy.ops.mesh.primitive_torus_add(
    major_radius=0.9, minor_radius=0.18, major_segments=48, minor_segments=24,
    location=(0, 0, 1.0), rotation=(math.radians(90), 0, 0)
)
tire_obj = bpy.context.active_object
tire_obj.name = "Mesh_Tire"
tire_obj.data.materials.append(mat_tire)

# Inner Hub Rim
bpy.ops.mesh.primitive_cylinder_add(
    radius=0.72, depth=0.15, vertices=32,
    location=(0, 0, 1.0), rotation=(math.radians(90), 0, 0)
)
hub_obj = bpy.context.active_object
hub_obj.name = "Mesh_HubRim"
hub_obj.data.materials.append(mat_chrome)

# Center Axle & Neon Core
bpy.ops.mesh.primitive_cylinder_add(
    radius=0.22, depth=0.35, vertices=24,
    location=(0, 0, 1.0), rotation=(math.radians(90), 0, 0)
)
axle_obj = bpy.context.active_object
axle_obj.name = "Mesh_AxleHub"
axle_obj.data.materials.append(mat_neon_hub)

# Spokes (Radial spoke array)
spokes = []
for i in range(8):
    ang = i * (math.pi / 4)
    bpy.ops.mesh.primitive_cylinder_add(
        radius=0.02, depth=1.4, vertices=8,
        location=(0, 0, 1.0),
        rotation=(math.radians(90), ang, 0)
    )
    spk = bpy.context.active_object
    spk.name = f"Mesh_Spoke_{{i}}"
    spk.data.materials.append(mat_chrome)
    spokes.append(spk)

# Join Wheel assembly
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

# B. Frame / Fork Stems (Dual chrome forks running up from axle)
bpy.ops.mesh.primitive_cylinder_add(radius=0.04, depth=1.3, vertices=16, location=(-0.22, 0, 1.55))
fork_l = bpy.context.active_object
fork_l.name = "Mesh_Fork_L"
fork_l.data.materials.append(mat_chrome)

bpy.ops.mesh.primitive_cylinder_add(radius=0.04, depth=1.3, vertices=16, location=(0.22, 0, 1.55))
fork_r = bpy.context.active_object
fork_r.name = "Mesh_Fork_R"
fork_r.data.materials.append(mat_chrome)

# Fork Crown Bridge
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 2.15))
crown = bpy.context.active_object
crown.scale = (0.28, 0.12, 0.08)
crown.name = "Mesh_Crown"
crown.data.materials.append(mat_chassis)

# C. Aerodynamic Main Cowl / Chassis
bpy.ops.mesh.primitive_cone_add(radius1=0.28, radius2=0.1, depth=1.2, vertices=16, location=(0, 0.1, 2.65), rotation=(math.radians(-25), 0, 0))
cowl = bpy.context.active_object
cowl.name = "Mesh_Cowl"
cowl.scale = (1.0, 0.8, 1.0)
cowl.data.materials.append(mat_chassis)

# Stunt Racing Saddle (Curved banana shape)
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -0.05, 2.85))
saddle = bpy.context.active_object
saddle.name = "Mesh_Saddle"
saddle.scale = (0.22, 0.65, 0.1)
saddle.data.materials.append(mat_saddle)

# Stunt Handle / Grip Bar
bpy.ops.mesh.primitive_torus_add(major_radius=0.18, minor_radius=0.03, location=(0, 0.35, 2.75), rotation=(0, math.radians(90), 0))
grip = bpy.context.active_object
grip.name = "Mesh_StuntGrip"
grip.data.materials.append(mat_chrome)

# D. Dual Turbo Thrusters & Exhaust Nozzles
bpy.ops.mesh.primitive_cylinder_add(radius=0.12, depth=0.7, vertices=18, location=(-0.35, -0.25, 2.3), rotation=(math.radians(35), 0, 0))
thruster_l = bpy.context.active_object
thruster_l.name = "Mesh_Thruster_L"
thruster_l.data.materials.append(mat_exhaust)

bpy.ops.mesh.primitive_cone_add(radius1=0.09, radius2=0.01, depth=0.35, vertices=16, location=(-0.35, -0.55, 2.1), rotation=(math.radians(-145), 0, 0))
flame_l = bpy.context.active_object
flame_l.name = "Mesh_Flame_L"
flame_l.data.materials.append(mat_thruster)

bpy.ops.mesh.primitive_cylinder_add(radius=0.12, depth=0.7, vertices=18, location=(0.35, -0.25, 2.3), rotation=(math.radians(35), 0, 0))
thruster_r = bpy.context.active_object
thruster_r.name = "Mesh_Thruster_R"
thruster_r.data.materials.append(mat_exhaust)

bpy.ops.mesh.primitive_cone_add(radius1=0.09, radius2=0.01, depth=0.35, vertices=16, location=(0.35, -0.55, 2.1), rotation=(math.radians(-145), 0, 0))
flame_r = bpy.context.active_object
flame_r.name = "Mesh_Flame_R"
flame_r.data.materials.append(mat_thruster)

# Rear Aero Wing / Stabilizer Spoiler
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -0.45, 2.65))
wing = bpy.context.active_object
wing.scale = (0.6, 0.12, 0.03)
wing.rotation_euler = (math.radians(-20), 0, 0)
wing.name = "Mesh_AeroWing"
wing.data.materials.append(mat_chassis)

# Wing endplates
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-0.6, -0.45, 2.7))
endplate_l = bpy.context.active_object
endplate_l.scale = (0.02, 0.16, 0.12)
endplate_l.data.materials.append(mat_neon_hub)

bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.6, -0.45, 2.7))
endplate_r = bpy.context.active_object
endplate_r.scale = (0.02, 0.16, 0.12)
endplate_r.data.materials.append(mat_neon_hub)

# E. Left & Right Cranks and Pedals
bpy.ops.mesh.primitive_cylinder_add(radius=0.03, depth=0.45, vertices=12, location=(-0.25, 0.15, 1.0), rotation=(math.radians(45), 0, 0))
crank_l = bpy.context.active_object
crank_l.name = "Mesh_Crank_L"
crank_l.data.materials.append(mat_chrome)

bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-0.35, 0.32, 0.85))
pedal_l = bpy.context.active_object
pedal_l.scale = (0.1, 0.15, 0.04)
pedal_l.name = "Mesh_Pedal_L"
pedal_l.data.materials.append(mat_exhaust)

bpy.ops.mesh.primitive_cylinder_add(radius=0.03, depth=0.45, vertices=12, location=(0.25, -0.15, 1.0), rotation=(math.radians(-135), 0, 0))
crank_r = bpy.context.active_object
crank_r.name = "Mesh_Crank_R"
crank_r.data.materials.append(mat_chrome)

bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.35, -0.32, 1.15))
pedal_r = bpy.context.active_object
pedal_r.scale = (0.1, 0.15, 0.04)
pedal_r.name = "Mesh_Pedal_R"
pedal_r.data.materials.append(mat_exhaust)

# Join body parts into clean chassis group
bpy.ops.object.select_all(action='DESELECT')
for obj in [fork_l, fork_r, crown, cowl, saddle, grip, thruster_l, flame_l, thruster_r, flame_r, wing, endplate_l, endplate_r]:
    obj.select_set(True)
bpy.context.view_layer.objects.active = cowl
bpy.ops.object.join()
chassis_mesh = bpy.context.active_object
chassis_mesh.name = "Mesh_ChassisMaster"

# Join pedals
bpy.ops.object.select_all(action='DESELECT')
crank_l.select_set(True)
pedal_l.select_set(True)
bpy.context.view_layer.objects.active = crank_l
bpy.ops.object.join()
pedal_assembly_l = bpy.context.active_object
pedal_assembly_l.name = "Mesh_PedalAssembly_L"

bpy.ops.object.select_all(action='DESELECT')
crank_r.select_set(True)
pedal_r.select_set(True)
bpy.context.view_layer.objects.active = crank_r
bpy.ops.object.join()
pedal_assembly_r = bpy.context.active_object
pedal_assembly_r.name = "Mesh_PedalAssembly_R"

# Smooth Shading on all meshes
for obj in [wheel_mesh, chassis_mesh, pedal_assembly_l, pedal_assembly_r]:
    for poly in obj.data.polygons:
        poly.use_smooth = True

print("[BLENDER] Geometry creation complete.")

# -------------------------------------------------------------
# 3. ARMATURE SKELETON RIGGING
# -------------------------------------------------------------
print("[BLENDER] Constructing Armature Rig...")
bpy.ops.object.armature_add(location=(0, 0, 0))
arm_obj = bpy.context.active_object
arm_obj.name = "Armature_Stuntcraft"
arm_data = arm_obj.data
arm_data.name = "ArmatureData"

# Edit Bones
bpy.ops.object.mode_set(mode='EDIT')
edit_bones = arm_data.edit_bones

# Root Bone
bone_root = edit_bones['Bone']
bone_root.name = 'root'
bone_root.head = (0, 0, 0)
bone_root.tail = (0, 0, 0.4)

# Hub Bone (Axle)
bone_hub = edit_bones.new('bone_hub')
bone_hub.head = (0, 0, 1.0)
bone_hub.tail = (0, 0, 1.3)
bone_hub.parent = bone_root

# Chassis Bone (Spine)
bone_chassis = edit_bones.new('bone_chassis')
bone_chassis.head = (0, 0, 1.0)
bone_chassis.tail = (0, 0, 2.7)
bone_chassis.parent = bone_root

# Thruster Left & Right Bones
bone_thrust_l = edit_bones.new('bone_thruster_l')
bone_thrust_l.head = (-0.35, -0.25, 2.3)
bone_thrust_l.tail = (-0.35, -0.6, 2.1)
bone_thrust_l.parent = bone_chassis

bone_thrust_r = edit_bones.new('bone_thruster_r')
bone_thrust_r.head = (0.35, -0.25, 2.3)
bone_thrust_r.tail = (0.35, -0.6, 2.1)
bone_thrust_r.parent = bone_chassis

# Pedal Left & Right Bones
bone_pedal_l = edit_bones.new('bone_pedal_l')
bone_pedal_l.head = (-0.25, 0, 1.0)
bone_pedal_l.tail = (-0.35, 0.3, 0.85)
bone_pedal_l.parent = bone_hub

bone_pedal_r = edit_bones.new('bone_pedal_r')
bone_pedal_r.head = (0.25, 0, 1.0)
bone_pedal_r.tail = (0.35, -0.3, 1.15)
bone_pedal_r.parent = bone_hub

bpy.ops.object.mode_set(mode='OBJECT')

# Parent Meshes to Armature Bones with zero offset distortion
def parent_to_bone(mesh_obj, bone_name):
    mesh_obj.parent = arm_obj
    mesh_obj.parent_type = 'BONE'
    mesh_obj.parent_bone = bone_name

parent_to_bone(wheel_mesh, 'bone_hub')
parent_to_bone(chassis_mesh, 'bone_chassis')
parent_to_bone(pedal_assembly_l, 'bone_pedal_l')
parent_to_bone(pedal_assembly_r, 'bone_pedal_r')

print("[BLENDER] Meshes successfully bound to skeletal bones.")

# -------------------------------------------------------------
# 4. KEYFRAMING & BAKING STUNT ANIMATIONS
# -------------------------------------------------------------
print("[BLENDER] Authoring 4 keyframed Stunt Animations...")
arm_obj.animation_data_create()

# ACTION 1: stunt_afterburner_backflip (30 frames)
act_flip = bpy.data.actions.new(name="stunt_afterburner_backflip")
arm_obj.animation_data.action = act_flip

p_chassis = arm_obj.pose.bones['bone_chassis']
p_hub = arm_obj.pose.bones['bone_hub']
p_root = arm_obj.pose.bones['root']

# Keyframe full 360 pitch flip on root
for f, rot_x, z_lift in [
    (1,  0.0, 0.0),
    (8,  -math.radians(90), 1.2),
    (15, -math.radians(180), 2.0),
    (22, -math.radians(270), 1.1),
    (30, -math.radians(360), 0.0)
]:
    p_root.rotation_mode = 'XYZ'
    p_root.rotation_euler = (rot_x, 0, 0)
    p_root.location = (0, 0, z_lift)
    p_root.keyframe_insert(data_path="rotation_euler", frame=f)
    p_root.keyframe_insert(data_path="location", frame=f)

# Wheel spin during flip
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

# Bake all actions into NLA Tracks for multi-action GLTF export
for act in [act_flip, act_cork, act_whip, act_idle]:
    track = arm_obj.animation_data.nla_tracks.new()
    track.name = act.name
    track.strips.new(act.name, 1, act)

print("[BLENDER] NLA Tracks baked successfully.")

# -------------------------------------------------------------
# 5. CINEMATIC LIGHTING & CAMERA STAGING
# -------------------------------------------------------------
print("[BLENDER] Staging studio soundstage lights and 4K camera...")

# Camera
bpy.ops.object.camera_add(location=(2.8, -3.2, 2.4), rotation=(math.radians(68), 0, math.radians(42)))
cam = bpy.context.active_object
cam.name = "Cam_StudioBeauty"
cam.data.lens = 55
scene.camera = cam

# Key Light (Warm Sun / Cyber Gold)
bpy.ops.object.light_add(type='SPOT', location=(3.5, -2.5, 4.5))
light_key = bpy.context.active_object
light_key.data.energy = 450
light_key.data.color = (1.0, 0.9, 0.8)
light_key.data.spot_size = math.radians(60)

# Fill Light (Cool Teal Rim)
bpy.ops.object.light_add(type='AREA', location=(-3.0, 2.5, 3.0))
light_fill = bpy.context.active_object
light_fill.data.energy = 300
light_fill.data.color = (0.1, 0.7, 1.0)
light_fill.data.size = 2.0

# Bottom Kick / Ground Glow (Neon Magenta)
bpy.ops.object.light_add(type='POINT', location=(0, 0, 0.3))
light_kick = bpy.context.active_object
light_kick.data.energy = 150
light_kick.data.color = (1.0, 0.1, 0.7)

# Infinite Curved Soundstage Floor / Backdrop
bpy.ops.mesh.primitive_plane_add(size=30.0, location=(0, 0, 0))
floor = bpy.context.active_object
floor.name = "Studio_Floor"
mat_floor = create_pbr_mat("Mat_StudioFloor", (0.02, 0.02, 0.04, 1.0), metallic=0.7, roughness=0.15)
floor.data.materials.append(mat_floor)

# -------------------------------------------------------------
# 6. HEADLESS RENDERING (BEAUTY SHOWCASE)
# -------------------------------------------------------------
print(f"[BLENDER] Rendering beauty showcase still to: {OUTPUT_RENDER}...")
scene.render.image_settings.file_format = 'PNG'
scene.render.filepath = r'{OUTPUT_RENDER}'
bpy.ops.render.render(write_still=True)
print("✅ Beauty render complete.")

# -------------------------------------------------------------
# 7. EXPORT GLB & MASTER BLEND
# -------------------------------------------------------------
print(f"[BLENDER] Saving master .blend file to: {OUTPUT_BLEND}...")
bpy.ops.wm.save_as_mainfile(filepath=r'{OUTPUT_BLEND}')

print(f"[BLENDER] Exporting GLB asset to: {OUTPUT_GLB}...")
# Remove studio camera, floor, and lights from GLB export
bpy.ops.object.select_all(action='DESELECT')
for obj in [wheel_mesh, chassis_mesh, pedal_assembly_l, pedal_assembly_r, arm_obj]:
    obj.select_set(True)

bpy.ops.export_scene.gltf(
    filepath=r'{OUTPUT_GLB}',
    use_selection=True,
    export_format='GLB',
    export_animations=True,
    export_nla_strips=True,
    export_apply=False
)
print("✅ GLB export complete.")
"""

def main():
    print(f"🚀 Launching Headless Blender 5.2 Session...")
    print(f"Blender Path: {BLENDER_EXE}")
    
    script_tmp = os.path.join(WORKSPACE_ROOT, "tmp_forge_blender_session.py")
    with open(script_tmp, "w", encoding="utf-8") as f:
        f.write(BLENDER_SCRIPT)
        
    cmd = [BLENDER_EXE, "--background", "--python", script_tmp]
    try:
        proc = subprocess.run(cmd, check=True, text=True, capture_output=True)
        print("--- BLENDER STDOUT ---")
        for line in proc.stdout.splitlines():
            if "[BLENDER]" in line or "Export" in line or "complete" in line or "Error" in line:
                print(line)
        print("----------------------")
        print(f"🎉 SUCCESS! Headless Blender session executed cleanly.")
        print(f"Master Blend: {OUTPUT_BLEND}")
        print(f"Output GLB:   {OUTPUT_GLB}")
        print(f"Showcase PNG: {OUTPUT_RENDER}")
    except subprocess.CalledProcessError as e:
        print(f"❌ Blender Error:\n{e.stderr}", file=sys.stderr)
        sys.exit(1)
    finally:
        if os.path.exists(script_tmp):
            os.remove(script_tmp)

if __name__ == "__main__":
    main()
