import bpy
import math
import os

bpy.ops.wm.read_factory_settings(use_empty=True)

# Helper function to create materials with specific properties
def make_mat(name, color, roughness=0.4, specular=0.5):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    nodes.clear()
    out = nodes.new(type="ShaderNodeOutputMaterial")
    bsdf = nodes.new(type="ShaderNodeBsdfPrincipled")
    bsdf.inputs["Base Color"].default_value = color
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Specular IOR Level"].default_value = specular
    mat.node_tree.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    return mat

# Materials matching Frankie the Squirrel from "The Hemp Crew"
mat_fur_black  = make_mat("Fur_Black",   (0.12, 0.11, 0.13, 1.0), roughness=0.45)
mat_fur_scruff = make_mat("Fur_Scruff",  (0.20, 0.18, 0.20, 1.0), roughness=0.50)
mat_suit_grey  = make_mat("Suit_Grey",   (0.32, 0.32, 0.35, 1.0), roughness=0.60) # Wrinkled charcoal suit
mat_shirt_wht  = make_mat("Shirt_White", (0.92, 0.90, 0.88, 1.0), roughness=0.40)
mat_tie_black  = make_mat("Tie_Black",   (0.06, 0.05, 0.07, 1.0), roughness=0.30)
mat_belt_gold  = make_mat("Belt_Gold",   (0.85, 0.65, 0.15, 1.0), roughness=0.25, specular=0.9)
mat_eye_white  = make_mat("Eye_White",   (0.96, 0.94, 0.90, 1.0), roughness=0.05, specular=1.0)
mat_pupil_blk  = make_mat("Eye_Pupil",   (0.04, 0.03, 0.04, 1.0), roughness=0.05)
mat_nose_pink  = make_mat("Nose_Pink",   (0.85, 0.35, 0.38, 1.0), roughness=0.25)
mat_teeth_wht  = make_mat("Teeth_White", (0.95, 0.93, 0.88, 1.0), roughness=0.10, specular=0.8)
mat_mouth_red  = make_mat("Mouth_Dark",  (0.22, 0.05, 0.06, 1.0), roughness=0.30)

col = bpy.context.collection

# Root Empty
root_obj = bpy.data.objects.new("Frankie_Root", None)
col.objects.link(root_obj)

# ─── 1. TORSO & SUIT ────────────────────────────────────────────────────────
# Torso Base (Grey Suit Jacket)
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.42, segments=24, ring_count=16, location=(0, 0, 0.58))
torso = bpy.context.active_object
torso.name = "Frankie_Suit_Jacket"
torso.scale = (0.95, 0.85, 1.25)
bpy.ops.object.transform_apply(scale=True)
torso.data.materials.append(mat_suit_grey)
bpy.ops.object.shade_smooth()
torso.parent = root_obj

# White Dress Shirt Inset (Front Chest Triangle)
bpy.ops.mesh.primitive_cylinder_add(radius=0.28, depth=0.45, vertices=16, location=(0, -0.18, 0.68))
shirt = bpy.context.active_object
shirt.name = "Frankie_Shirt"
shirt.scale = (0.75, 0.35, 0.95)
bpy.ops.object.transform_apply(scale=True)
shirt.data.materials.append(mat_shirt_wht)
bpy.ops.object.shade_smooth()
shirt.parent = root_obj

# Black Tie
bpy.ops.mesh.primitive_cube_add(size=0.1, location=(0, -0.32, 0.60))
tie = bpy.context.active_object
tie.name = "Frankie_Tie"
tie.scale = (0.70, 0.15, 3.20)
tie.rotation_euler = (math.radians(-8), 0, 0)
bpy.ops.object.transform_apply(scale=True, rotation=True)
tie.data.materials.append(mat_tie_black)
tie.parent = root_obj

# Tie Knot
bpy.ops.mesh.primitive_cone_add(radius1=0.06, depth=0.08, vertices=10, location=(0, -0.30, 0.78))
knot = bpy.context.active_object
knot.name = "Frankie_Tie_Knot"
knot.rotation_euler = (math.radians(180), 0, 0)
bpy.ops.object.transform_apply(rotation=True)
knot.data.materials.append(mat_tie_black)
knot.parent = root_obj

# Belt & Gold Buckle
bpy.ops.mesh.primitive_torus_add(major_radius=0.38, minor_radius=0.035, major_segments=24, minor_segments=10, location=(0, 0, 0.35))
belt = bpy.context.active_object
belt.name = "Frankie_Belt"
belt.scale = (0.96, 0.86, 0.95)
bpy.ops.object.transform_apply(scale=True)
belt.data.materials.append(mat_fur_black)
belt.parent = root_obj

bpy.ops.mesh.primitive_cube_add(size=0.07, location=(0, -0.35, 0.35))
buckle = bpy.context.active_object
buckle.name = "Frankie_Buckle"
buckle.scale = (1.2, 0.3, 0.8)
bpy.ops.object.transform_apply(scale=True)
buckle.data.materials.append(mat_belt_gold)
buckle.parent = root_obj

# ─── 2. HEAD, CRAZED FACE & CLENCHED TEETH ──────────────────────────────────
head_root = bpy.data.objects.new("Frankie_Head_Root", None)
head_root.location = (0, 0, 1.25)
col.objects.link(head_root)
head_root.parent = root_obj

# Head Mesh (Black fur)
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.52, segments=32, ring_count=20, location=(0, 0, 0))
head = bpy.context.active_object
head.name = "Frankie_Head"
head.scale = (1.05, 1.00, 0.95)
bpy.ops.object.transform_apply(scale=True)
head.data.materials.append(mat_fur_black)
bpy.ops.object.shade_smooth()
head.parent = head_root

# Scruffy Crown Tufts / Hair Horns
for side, x in [("L", -0.22), ("R", 0.22)]:
    bpy.ops.mesh.primitive_cone_add(radius1=0.12, depth=0.30, vertices=10, location=(x, 0.05, 0.52))
    tuft = bpy.context.active_object
    tuft.name = f"Tuft_{side}"
    rot_y = math.radians(-25 if side == "L" else 25)
    tuft.rotation_euler = (math.radians(-10), rot_y, 0)
    bpy.ops.object.transform_apply(rotation=True)
    tuft.data.materials.append(mat_fur_black)
    tuft.parent = head_root

# Floppy Squirrel/Hound Ears
for side, x in [("L", -0.42), ("R", 0.42)]:
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.18, segments=16, ring_count=12, location=(x, 0.05, 0.38))
    ear = bpy.context.active_object
    ear.name = f"Ear_{side}"
    ear.scale = (0.5, 0.35, 1.4)
    rot_y = math.radians(-35 if side == "L" else 35)
    ear.rotation_euler = (math.radians(20), rot_y, math.radians(-15 if side == "L" else 15))
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    ear.data.materials.append(mat_fur_black)
    bpy.ops.object.shade_smooth()
    ear.parent = head_root

# Big Bulging Crazed Eyes
for side, x in [("L", -0.22), ("R", 0.22)]:
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.17, segments=20, ring_count=14, location=(x, -0.40, 0.10))
    eye = bpy.context.active_object
    eye.name = f"Eye_{side}"
    eye.scale = (0.9, 0.5, 1.1)
    bpy.ops.object.transform_apply(scale=True)
    eye.data.materials.append(mat_eye_white)
    bpy.ops.object.shade_smooth()
    eye.parent = head_root

    # Tiny Dilated Pupil (Crazed Look)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.055, segments=12, ring_count=8, location=(x * 0.95, -0.48, 0.10))
    pupil = bpy.context.active_object
    pupil.name = f"Pupil_{side}"
    pupil.data.materials.append(mat_pupil_blk)
    bpy.ops.object.shade_smooth()
    pupil.parent = head_root

# Pink Nose
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.075, segments=14, ring_count=10, location=(0, -0.52, -0.02))
nose = bpy.context.active_object
nose.name = "Frankie_Nose"
nose.scale = (1.2, 0.8, 0.8)
bpy.ops.object.transform_apply(scale=True)
nose.data.materials.append(mat_nose_pink)
bpy.ops.object.shade_smooth()
nose.parent = head_root

# Enormous Manic Smile with Clenched Teeth
# Mouth cavity
bpy.ops.mesh.primitive_cube_add(size=0.1, location=(0, -0.46, -0.16))
mouth_bg = bpy.context.active_object
mouth_bg.name = "Mouth_Cavity"
mouth_bg.scale = (3.2, 0.4, 1.2)
bpy.ops.object.transform_apply(scale=True)
mouth_bg.data.materials.append(mat_mouth_red)
mouth_bg.parent = head_root

# Upper & Lower Teeth Rows (Individual chiclet teeth for crazy grit)
for tooth_i in range(-5, 6):
    tx = tooth_i * 0.052
    # Upper tooth
    bpy.ops.mesh.primitive_cube_add(size=0.035, location=(tx, -0.49, -0.13))
    t_up = bpy.context.active_object
    t_up.scale = (0.9, 0.4, 1.2)
    t_up.data.materials.append(mat_teeth_wht)
    t_up.parent = head_root

    # Lower tooth
    bpy.ops.mesh.primitive_cube_add(size=0.035, location=(tx, -0.49, -0.19))
    t_dn = bpy.context.active_object
    t_dn.scale = (0.9, 0.4, 1.2)
    t_dn.data.materials.append(mat_teeth_wht)
    t_dn.parent = head_root

# ─── 3. ARMS & LEGS ─────────────────────────────────────────────────────────
# Suit Sleeves & Arms
# Right Arm (Resting on floor)
bpy.ops.mesh.primitive_cylinder_add(radius=0.11, depth=0.45, vertices=14, location=(0.42, 0.05, 0.52))
arm_r = bpy.context.active_object
arm_r.name = "Arm_R"
arm_r.rotation_euler = (math.radians(15), math.radians(-30), math.radians(-20))
bpy.ops.object.transform_apply(rotation=True)
arm_r.data.materials.append(mat_suit_grey)
arm_r.parent = root_obj

bpy.ops.mesh.primitive_uv_sphere_add(radius=0.11, segments=12, ring_count=8, location=(0.60, 0.10, 0.28))
hand_r = bpy.context.active_object
hand_r.name = "Paw_R"
hand_r.data.materials.append(mat_fur_black)
hand_r.parent = root_obj

# Left Arm (Raised giving the unhinged gesture)
bpy.ops.mesh.primitive_cylinder_add(radius=0.11, depth=0.45, vertices=14, location=(-0.38, -0.12, 0.65))
arm_l = bpy.context.active_object
arm_l.name = "Arm_L"
arm_l.rotation_euler = (math.radians(-45), math.radians(40), math.radians(25))
bpy.ops.object.transform_apply(rotation=True)
arm_l.data.materials.append(mat_suit_grey)
arm_l.parent = root_obj

bpy.ops.mesh.primitive_uv_sphere_add(radius=0.11, segments=12, ring_count=8, location=(-0.52, -0.32, 0.88))
hand_l = bpy.context.active_object
hand_l.name = "Paw_L"
hand_l.data.materials.append(mat_fur_black)
hand_l.parent = root_obj

# Fingers on left hand (giving gesture)
for f_idx in range(3):
    bpy.ops.mesh.primitive_cylinder_add(radius=0.025, depth=0.10, vertices=8, location=(-0.56 - f_idx * 0.03, -0.36, 0.95 + f_idx * 0.02))
    finger = bpy.context.active_object
    finger.data.materials.append(mat_fur_black)
    finger.parent = root_obj

# Legs & Paws (Sprawled sitting posture on floor)
for side, x, rot_z in [("L", -0.26, math.radians(25)), ("R", 0.26, math.radians(-25))]:
    bpy.ops.mesh.primitive_cylinder_add(radius=0.13, depth=0.48, vertices=14, location=(x * 1.35, -0.22, 0.20))
    leg = bpy.context.active_object
    leg.name = f"Leg_{side}"
    leg.rotation_euler = (math.radians(65), 0, rot_z)
    bpy.ops.object.transform_apply(rotation=True)
    leg.data.materials.append(mat_suit_grey)
    leg.parent = root_obj

    # Black Furry Foot Paw sticking forward
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.13, segments=14, ring_count=10, location=(x * 1.65, -0.48, 0.12))
    foot = bpy.context.active_object
    foot.name = f"Foot_Paw_{side}"
    foot.scale = (0.85, 1.60, 0.65)
    bpy.ops.object.transform_apply(scale=True)
    foot.data.materials.append(mat_fur_black)
    foot.parent = root_obj

# ─── 4. GIANT BUSHY BLACK SQUIRREL TAIL ──────────────────────────────────────
# Multi-node curving tail arcing high behind the back
tail_nodes = [
    ((0, 0.38, 0.35), 0.28),
    ((0, 0.68, 0.65), 0.42),
    ((0, 0.85, 1.10), 0.54),
    ((0, 0.72, 1.55), 0.50),
    ((0, 0.45, 1.85), 0.38)
]

tail_parts = []
for idx, (pos, rad) in enumerate(tail_nodes):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=rad, segments=20, ring_count=14, location=pos)
    t_obj = bpy.context.active_object
    t_obj.name = f"Tail_Part_{idx}"
    t_obj.scale = (1.05, 1.20, 1.10)
    bpy.ops.object.transform_apply(scale=True)
    t_obj.data.materials.append(mat_fur_black)
    bpy.ops.object.shade_smooth()
    t_obj.parent = root_obj
    tail_parts.append(t_obj)

# ─── 5. STUDIO LIGHTING RIG ──────────────────────────────────────────────────
world = bpy.context.scene.world
if not world:
    world = bpy.data.worlds.new("World")
    bpy.context.scene.world = world
world.use_nodes = True
bg_node = world.node_tree.nodes.get("Background")
if bg_node:
    bg_node.inputs[0].default_value = (0.75, 0.78, 0.85, 1.0)
    bg_node.inputs[1].default_value = 0.90

lights = [
    ("Key_Zenithal", "SUN", (1.8, -2.5, 4.0), 3.4, (1.0, 0.98, 0.92)),
    ("Fill_Cool", "SUN", (-2.8, -2.0, 2.0), 2.2, (0.78, 0.88, 1.0)),
    ("Rim_Back_L", "POINT", (-1.8, 2.0, 2.8), 85.0, (1.0, 0.80, 0.55)),
    ("Rim_Back_R", "POINT", (1.8, 2.0, 2.8), 85.0, (0.75, 0.92, 1.0)),
    ("Bounce_Under", "POINT", (0.0, -1.0, -0.6), 35.0, (0.9, 1.0, 0.9))
]

for name, ltype, pos, energy, color in lights:
    ld = bpy.data.lights.new(name=name, type=ltype)
    ld.energy = energy
    ld.color = color
    lo = bpy.data.objects.new(name=name, object_data=ld)
    lo.location = pos
    col.objects.link(lo)

target_empty = bpy.data.objects.new("LookTarget", None)
target_empty.location = (0, 0, 0.85)
col.objects.link(target_empty)

# Camera Rig
cam_data = bpy.data.cameras.new(name="Camera")
cam_data.type = "PERSP"
cam_data.lens = 52
cam_obj = bpy.data.objects.new(name="Camera", object_data=cam_data)
cam_obj.location = (0.0, -3.4, 1.10)
col.objects.link(cam_obj)
bpy.context.scene.camera = cam_obj

tt = cam_obj.constraints.new(type="TRACK_TO")
tt.target = target_empty
tt.track_axis = "TRACK_NEGATIVE_Z"
tt.up_axis = "UP_Y"

scene = bpy.context.scene
scene.render.engine = "BLENDER_EEVEE"
scene.render.resolution_x = 512
scene.render.resolution_y = 512
scene.render.film_transparent = True
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGBA"

out_dir = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\actions\hemp_crew"
os.makedirs(out_dir, exist_ok=True)

# 1. Front View Render
preview_front = os.path.join(out_dir, "frankie_3d_front.png")
scene.render.filepath = preview_front
bpy.ops.render.render(write_still=True)
print("Rendered 3D Front View:", preview_front)

# 2. Isometric 3/4 View Render (showing suit depth & giant black tail)
cam_obj.location = (1.8, -2.8, 1.45)
preview_iso = os.path.join(out_dir, "frankie_3d_iso.png")
scene.render.filepath = preview_iso
bpy.ops.render.render(write_still=True)
print("Rendered 3D Iso View:", preview_iso)

# Save Master Blend
blend_path = os.path.join(out_dir, "frankie_squirrel_master.blend")
bpy.ops.wm.save_as_mainfile(filepath=blend_path)
print("Master 3D Blend file saved successfully at:", blend_path)
