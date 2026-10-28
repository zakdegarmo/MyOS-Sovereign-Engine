"""
Sovereign Film Studio: 8-Second Cinematic Trailer
Production: 'Crimson Zenith: Duel of the Sundered Sisterhood'
Style: 1980s Ralph Bakshi (Fire and Ice) meets Frank Frazetta Heavy Metal Dark Fantasy
Location: Jagged Cliff Plateau at Sunset
Framerate: 30 fps | Frames: 240 (8.0 seconds total)
"""

import bpy
import bmesh
import math
import os
import sys
import glob

# Ensure output directories exist
WORKSPACE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
OUTPUT_DIR = os.path.join(WORKSPACE_ROOT, "apps/web/public/screenings")
FRAMES_DIR = os.path.join(WORKSPACE_ROOT, "temp_studio_frames")
os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(FRAMES_DIR, exist_ok=True)

# Clean existing rendered frames
for old_frame in glob.glob(os.path.join(FRAMES_DIR, "frame_*.png")):
    try:
        os.remove(old_frame)
    except OSError:
        pass

# 1. Open Base Blend with Rigged Female Model
base_blend = os.path.join(WORKSPACE_ROOT, "lunaria_flesh_mannequin.blend")
bpy.ops.wm.open_mainfile(filepath=base_blend)

scene = bpy.context.scene
scene.render.engine = 'BLENDER_EEVEE_NEXT' if hasattr(bpy.types, 'RenderSettings') and 'BLENDER_EEVEE_NEXT' in [e.identifier for e in scene.render.bl_rna.properties['engine'].enum_items] else 'BLENDER_EEVEE'
scene.render.film_transparent = False
scene.render.resolution_x = 640
scene.render.resolution_y = 360
scene.render.resolution_percentage = 100
scene.render.fps = 30

# 240 frames @ 30 fps = 8.0 continuous seconds
scene.frame_start = 1
scene.frame_end = 240

# Clean existing camera constraints & parent
cam = bpy.data.objects.get('RenderCam')
if cam:
    cam.parent = None
    cam.constraints.clear()
scene.camera = cam

# Strip away gown / wizard props for barbarian duel
for prop_name in ['Lunaria_Gown', 'LPC_Robe_Upper', 'LPC_Gold_Collar', 'LPC_Gold_Cuffs', 'LPC_Gold_Stole', 'Lunaria_Moon_Crown', 'Lunaria_Elf_Ears', 'Lunaria_Sigil_L', 'Lunaria_Sigil_R', 'Lunaria_Cape']:
    p = bpy.data.objects.get(prop_name)
    if p:
        bpy.data.objects.remove(p, do_unlink=True)

# 2. Append Weapons & Barbarian Wardrobe
wardrobe_path = os.path.join(WORKSPACE_ROOT, "chibi_universal_wardrobe_master.blend")
with bpy.data.libraries.load(wardrobe_path, link=False) as (df, dt):
    dt.objects = ['Modular_1H_Sword', 'Modular_Combat_Skirt', 'Modular_Round_Shield']

for obj in dt.objects:
    bpy.context.scene.collection.objects.link(obj)

sword1 = bpy.data.objects.get('Modular_1H_Sword')
skirt1 = bpy.data.objects.get('Modular_Combat_Skirt')
shield1 = bpy.data.objects.get('Modular_Round_Shield')

arm1 = bpy.data.objects.get('Armature')
hand_r1 = bpy.data.objects.get('Hand.R_Socket')
hand_l1 = bpy.data.objects.get('Hand.L_Socket')
body1 = bpy.data.objects.get('LPC_Decivoxel_Flesh_Female')
hair1 = bpy.data.objects.get('Modular_Hair_JRPG_Heroine_Locks')

# Bind Warrior 1 Weapons & Wardrobe
sword1.scale = (0.75, 0.75, 0.75)
sword1.parent = hand_r1
sword1.parent_type = 'OBJECT'
sword1.parent_bone = ''
sword1.location = (0, 0, 0)
sword1.rotation_euler = (math.radians(-90), 0, 0)

skirt1.parent = arm1
skirt1.parent_type = 'OBJECT'
for mod in skirt1.modifiers:
    if mod.type == 'ARMATURE':
        mod.object = arm1

arm1.location = (-1.1, 0.0, 0.0)
arm1.rotation_euler = (0, 0, math.radians(70))

# 3. Helper to make actions loop infinitely with CYCLES modifiers
def loop_action(action):
    if not action:
        return
    if hasattr(action, 'layers'):
        for layer in action.layers:
            for strip in layer.strips:
                for cb in strip.channelbags:
                    for fc in cb.fcurves:
                        if not any(m.type == 'CYCLES' for m in fc.modifiers):
                            mod = fc.modifiers.new('CYCLES')
                            mod.mode_after = 'REPEAT'
                            mod.mode_before = 'REPEAT'
    elif hasattr(action, 'fcurves'):
        for fc in action.fcurves:
            if not any(m.type == 'CYCLES' for m in fc.modifiers):
                mod = fc.modifiers.new('CYCLES')
                mod.mode_after = 'REPEAT'
                mod.mode_before = 'REPEAT'

act_attack = bpy.data.actions.get('Melee_Weapon_Attack')
act_idle = bpy.data.actions.get('Melee_Weapon_Idle')
loop_action(act_attack)
loop_action(act_idle)

# Animate Warrior 1
arm1.animation_data_create()
arm1.animation_data.action = act_attack

# 4. Duplicate and Rig Warrior 2
bpy.ops.object.select_all(action='DESELECT')
arm1.select_set(True)
for child in arm1.children:
    child.select_set(True)

bpy.context.view_layer.objects.active = arm1
bpy.ops.object.duplicate(linked=False)

arm2 = [o for o in bpy.context.selected_objects if o.type == 'ARMATURE'][0]
arm2.name = 'Warrior2_Armature'
arm2.location = (1.1, 0.0, 0.0)
arm2.rotation_euler = (0, 0, math.radians(-110))

# Animate Warrior 2 with battle stance loop
arm2.animation_data.action = act_idle

hand_r2 = bpy.data.objects.get('Hand.R_Socket.001')
hand_l2 = bpy.data.objects.get('Hand.L_Socket.001')
body2 = bpy.data.objects.get('LPC_Decivoxel_Flesh_Female.001')
hair2 = bpy.data.objects.get('Modular_Hair_JRPG_Heroine_Locks.001')
skirt2_list = [c for c in arm2.children if 'Combat_Skirt' in c.name]
skirt2 = skirt2_list[0] if skirt2_list else None

sword2 = sword1.copy()
sword2.data = sword1.data.copy()
bpy.context.scene.collection.objects.link(sword2)
sword2.scale = (0.75, 0.75, 0.75)
sword2.parent = hand_r2
sword2.parent_type = 'OBJECT'
sword2.parent_bone = ''
sword2.location = (0, 0, 0)
sword2.rotation_euler = (math.radians(-90), 0, 0)

shield1.scale = (0.85, 0.85, 0.85)
shield1.parent = hand_l2
shield1.parent_type = 'OBJECT'
shield1.parent_bone = ''
shield1.location = (0, 0, 0)

# 5. Frazetta / Bakshi Chiaroscuro Cel Shaders
def make_frazetta_cel(name, base_rgb, shadow_rgb, rim_rgb=(1.0, 0.2, 0.5, 1.0)):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()
    diff = nodes.new('ShaderNodeBsdfDiffuse')
    diff.inputs['Color'].default_value = (1, 1, 1, 1)
    diff.inputs['Roughness'].default_value = 0.0
    s2rgb = nodes.new('ShaderNodeShaderToRGB')
    ramp = nodes.new('ShaderNodeValToRGB')
    ramp.color_ramp.interpolation = 'CONSTANT'
    e0 = ramp.color_ramp.elements[0]
    e0.position = 0.0
    e0.color = shadow_rgb
    e1 = ramp.color_ramp.elements.new(0.38)
    e1.color = base_rgb
    e2 = ramp.color_ramp.elements.new(0.72)
    e2.color = rim_rgb
    emit = nodes.new('ShaderNodeEmission')
    out = nodes.new('ShaderNodeOutputMaterial')
    links.new(diff.outputs['BSDF'], s2rgb.inputs['Shader'])
    links.new(s2rgb.outputs['Color'], ramp.inputs['Fac'])
    links.new(ramp.outputs['Color'], emit.inputs['Color'])
    links.new(emit.outputs['Emission'], out.inputs['Surface'])
    return mat

mat_bronze_skin = make_frazetta_cel('W1_BronzeSkin', (0.88, 0.58, 0.42, 1.0), (0.42, 0.16, 0.18, 1.0), (1.0, 0.35, 0.5, 1.0))
mat_raven_hair = make_frazetta_cel('W1_RavenHair', (0.10, 0.07, 0.10, 1.0), (0.03, 0.02, 0.05, 1.0), (0.9, 0.15, 0.3, 1.0))
mat_w1_skirt = make_frazetta_cel('W1_Skirt', (0.25, 0.12, 0.10, 1.0), (0.08, 0.04, 0.04, 1.0), (0.8, 0.4, 0.2, 1.0))

mat_alabaster_skin = make_frazetta_cel('W2_AlabasterSkin', (0.95, 0.82, 0.76, 1.0), (0.40, 0.22, 0.35, 1.0), (0.2, 0.8, 1.0, 1.0))
mat_fire_hair = make_frazetta_cel('W2_CopperHair', (0.92, 0.35, 0.10, 1.0), (0.45, 0.10, 0.05, 1.0), (1.0, 0.85, 0.3, 1.0))
mat_w2_skirt = make_frazetta_cel('W2_Skirt', (0.15, 0.15, 0.22, 1.0), (0.05, 0.05, 0.10, 1.0), (0.3, 0.7, 1.0, 1.0))

mat_steel = make_frazetta_cel('Frazetta_Steel', (0.85, 0.90, 0.98, 1.0), (0.15, 0.22, 0.38, 1.0), (1.0, 0.95, 0.8, 1.0))
mat_shield = make_frazetta_cel('Frazetta_Bronze_Shield', (0.80, 0.52, 0.25, 1.0), (0.30, 0.15, 0.08, 1.0), (1.0, 0.8, 0.4, 1.0))
mat_cliff = make_frazetta_cel('Dark_Crag', (0.28, 0.22, 0.25, 1.0), (0.08, 0.06, 0.10, 1.0), (0.8, 0.3, 0.1, 1.0))

body1.data.materials.clear(); body1.data.materials.append(mat_bronze_skin)
hair1.data.materials.clear(); hair1.data.materials.append(mat_raven_hair)
skirt1.data.materials.clear(); skirt1.data.materials.append(mat_w1_skirt)
sword1.data.materials.clear(); sword1.data.materials.append(mat_steel)

body2.data.materials.clear(); body2.data.materials.append(mat_alabaster_skin)
if hair2:
    hair2.data.materials.clear(); hair2.data.materials.append(mat_fire_hair)
if skirt2:
    skirt2.data.materials.clear(); skirt2.data.materials.append(mat_w2_skirt)
sword2.data.materials.clear(); sword2.data.materials.append(mat_steel)
shield1.data.materials.clear(); shield1.data.materials.append(mat_shield)

# 6. Cliff & Sky Cyclorama
mesh_c = bpy.data.meshes.new('Cliff_Mesh')
obj_c = bpy.data.objects.new('Cliff', mesh_c)
bpy.context.scene.collection.objects.link(obj_c)
bm = bmesh.new()
bmesh.ops.create_cube(bm, size=1.0)
for v in bm.verts:
    v.co.x *= 10.0
    v.co.y *= 7.0
    v.co.z = (v.co.z - 0.5) * 5.0
bm.to_mesh(mesh_c)
bm.free()
obj_c.data.materials.append(mat_cliff)

# Sky Gradient (Fiery Sunset Gold -> Blood Crimson -> Midnight Ultramarine)
mat_sky = bpy.data.materials.new('Frazetta_Sky')
mat_sky.use_nodes = True
sn = mat_sky.node_tree.nodes
sl = mat_sky.node_tree.links
sn.clear()
tc = sn.new('ShaderNodeTexCoord')
sep = sn.new('ShaderNodeSeparateXYZ')
cr = sn.new('ShaderNodeValToRGB')
cr.color_ramp.interpolation = 'EASE'
cr.color_ramp.elements[0].position = 0.0
cr.color_ramp.elements[0].color = (1.0, 0.42, 0.05, 1.0) # Gold Sunset
c1 = cr.color_ramp.elements.new(0.35)
c1.color = (0.85, 0.06, 0.18, 1.0) # Sanguine Blood Crimson
cr.color_ramp.elements[-1].position = 1.0
cr.color_ramp.elements[-1].color = (0.04, 0.02, 0.16, 1.0) # Dark Ultramarine
em = sn.new('ShaderNodeEmission')
em.inputs['Strength'].default_value = 2.2
out = sn.new('ShaderNodeOutputMaterial')
sl.new(tc.outputs['Object'], sep.inputs['Vector'])
sl.new(sep.outputs['Z'], cr.inputs['Fac'])
sl.new(cr.outputs['Color'], em.inputs['Color'])
sl.new(em.outputs['Emission'], out.inputs['Surface'])

mesh_sky = bpy.data.meshes.new('Sky_Mesh')
obj_sky = bpy.data.objects.new('Sky', mesh_sky)
bpy.context.scene.collection.objects.link(obj_sky)
bm_s = bmesh.new()
bmesh.ops.create_cube(bm_s, size=1.0)
for v in bm_s.verts:
    v.co.x *= 30.0
    v.co.y = 10.0
    v.co.z = (v.co.z + 0.3) * 20.0
bm_s.to_mesh(mesh_sky)
bm_s.free()
obj_sky.data.materials.append(mat_sky)

# 7. Dramatic Chiaroscuro Lighting
key_sun = bpy.data.objects.get('KeySun')
if key_sun:
    key_sun.data.energy = 6.0
    key_sun.data.color = (1.0, 0.55, 0.2)
    key_sun.rotation_euler = (math.radians(65), math.radians(-20), math.radians(-50))

rim_sun = bpy.data.objects.get('RimSun')
if rim_sun:
    rim_sun.data.energy = 9.0
    rim_sun.data.color = (1.0, 0.12, 0.55)
    rim_sun.rotation_euler = (math.radians(-35), math.radians(25), math.radians(140))

# 8. 3-Shot Cinematic Camera Choreography (240 Frames = 8.0 Seconds)
cam.animation_data_clear()

# --- SHOT 1: Wide Low-Angle Dolly Across the Abyss (Frames 1-80, 2.7s) ---
# Both fighters advance and clash blades under the blazing sky
cam.location = (-1.5, -4.5, 0.65)
cam.rotation_euler = (math.radians(89), 0, math.radians(-16))
cam.data.lens = 32
cam.keyframe_insert(data_path="location", frame=1)
cam.keyframe_insert(data_path="rotation_euler", frame=1)
cam.data.keyframe_insert(data_path="lens", frame=1)

cam.location = (0.4, -4.1, 0.70)
cam.rotation_euler = (math.radians(88), 0, math.radians(6))
cam.data.lens = 34
cam.keyframe_insert(data_path="location", frame=80)
cam.keyframe_insert(data_path="rotation_euler", frame=80)
cam.data.keyframe_insert(data_path="lens", frame=80)

# --- SHOT 2: Reverse Over-The-Shoulder Hero Crane (Frames 81-160, 2.7s) ---
# Low-angle tracking of the broadsword cleave and shield impact
cam.location = (1.6, -2.8, 0.65)
cam.rotation_euler = (math.radians(88), 0, math.radians(28))
cam.data.lens = 38
cam.keyframe_insert(data_path="location", frame=81)
cam.keyframe_insert(data_path="rotation_euler", frame=81)
cam.data.keyframe_insert(data_path="lens", frame=81)

cam.location = (1.1, -2.2, 0.75)
cam.rotation_euler = (math.radians(86), 0, math.radians(22))
cam.data.lens = 42
cam.keyframe_insert(data_path="location", frame=160)
cam.keyframe_insert(data_path="rotation_euler", frame=160)
cam.data.keyframe_insert(data_path="lens", frame=160)

# --- SHOT 3: The Sundered Sisterhood Horizon Pan (Frames 161-240, 2.7s) ---
# Sweeping low-angle hero pan showing both warriors silhouetted against the crimson horizon
cam.location = (-0.2, -3.4, 0.45)
cam.rotation_euler = (math.radians(94), 0, math.radians(-4))
cam.data.lens = 30
cam.keyframe_insert(data_path="location", frame=161)
cam.keyframe_insert(data_path="rotation_euler", frame=161)
cam.data.keyframe_insert(data_path="lens", frame=161)

cam.location = (0.5, -3.1, 0.60)
cam.rotation_euler = (math.radians(91), 0, math.radians(10))
cam.data.lens = 32
cam.keyframe_insert(data_path="location", frame=240)
cam.keyframe_insert(data_path="rotation_euler", frame=240)
cam.data.keyframe_insert(data_path="lens", frame=240)

# 9. Render All 240 Frames (Deterministic Explicit Loop)
print("[Studio Director] 🎬 ACTION! Filming 240 continuous frames (8.0 seconds @ 30 fps)...")
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGB'

for frame_idx in range(1, 241):
    scene.frame_set(frame_idx)
    scene.render.filepath = os.path.join(FRAMES_DIR, f"frame_{frame_idx:04d}.png")
    bpy.ops.render.render(write_still=True)
    if frame_idx % 30 == 0:
        print(f"[Studio Director] 🎞️ Rendered {frame_idx}/240 frames ({frame_idx/30:.1f}s of footage)...")

print(f"[Studio Director] ✅ All 240 animated frames rendered to {FRAMES_DIR}")
