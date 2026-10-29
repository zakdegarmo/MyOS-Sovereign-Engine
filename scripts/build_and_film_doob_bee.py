import bpy
import math
import os

bpy.ops.wm.read_factory_settings(use_empty=True)

# Helper function to create materials
def make_mat(name, color, roughness=0.3, specular=0.5, transmission=0.0):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    nodes.clear()
    out = nodes.new(type="ShaderNodeOutputMaterial")
    bsdf = nodes.new(type="ShaderNodeBsdfPrincipled")
    bsdf.inputs["Base Color"].default_value = color
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Specular IOR Level"].default_value = specular
    if transmission > 0:
        bsdf.inputs["Transmission Weight"].default_value = transmission
    mat.node_tree.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    return mat

# Materials according to user specifications:
# Yellow & Black stripes of B
mat_yellow = make_mat("Bee_Yellow", (0.98, 0.78, 0.08, 1.0), roughness=0.35)
mat_black  = make_mat("Bee_Black",  (0.12, 0.10, 0.12, 1.0), roughness=0.30)
# Violet eyes of C
mat_eye_violet = make_mat("Eye_Violet", (0.45, 0.15, 0.75, 1.0), roughness=0.05, specular=1.0)
mat_eye_pupil  = make_mat("Eye_Pupil",  (0.10, 0.02, 0.18, 1.0), roughness=0.05)
mat_eye_glint  = make_mat("Eye_Glint",  (1.0, 1.0, 1.0, 1.0), roughness=0.05, specular=1.0)
mat_cowl_dark  = make_mat("Cowl_Dark",  (0.18, 0.12, 0.22, 1.0), roughness=0.25, specular=0.8)
# White boots of A
mat_boot_white = make_mat("Boot_White", (0.95, 0.95, 0.98, 1.0), roughness=0.3)
mat_skin_cream = make_mat("Skin_Cream", (0.98, 0.90, 0.78, 1.0), roughness=0.35)
# Golden translucent wings of C
mat_wing_gold  = make_mat("Wing_Gold",  (0.95, 0.75, 0.25, 0.75), roughness=0.15, specular=0.9, transmission=0.4)
# Joint props
mat_paper_white = make_mat("Paper_White", (0.92, 0.90, 0.85, 1.0), roughness=0.5)
mat_cherry_red  = make_mat("Cherry_Red",  (1.0, 0.22, 0.05, 1.0), roughness=0.2)
mat_cherry_red.node_tree.nodes["Principled BSDF"].inputs["Emission Color"].default_value = (1.0, 0.25, 0.05, 1.0)
mat_cherry_red.node_tree.nodes["Principled BSDF"].inputs["Emission Strength"].default_value = 4.0

col = bpy.context.collection

# 1. Torso: Body of A (Upright capsule) with Color Pattern of B (Yellow/Black stripes)
# Base Torso Mesh (Yellow)
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.40, segments=24, ring_count=16, location=(0, 0, 0.60))
torso = bpy.context.active_object
torso.name = "Bee_Torso"
torso.scale = (0.85, 0.80, 1.25)
bpy.ops.object.transform_apply(scale=True)
torso.data.materials.append(mat_yellow)
bpy.ops.object.shade_smooth()

# Black Stripes of B (2 horizontal rings around abdomen)
for idx, z_pos in enumerate([0.48, 0.72]):
    bpy.ops.mesh.primitive_torus_add(major_radius=0.36, minor_radius=0.08, major_segments=24, minor_segments=12, location=(0, 0, z_pos))
    stripe = bpy.context.active_object
    stripe.name = f"Bee_Stripe_{idx}"
    stripe.scale = (0.88, 0.82, 0.95)
    bpy.ops.object.transform_apply(scale=True)
    stripe.data.materials.append(mat_black)
    bpy.ops.object.shade_smooth()

# Stinger at base
bpy.ops.mesh.primitive_cone_add(radius1=0.08, depth=0.22, vertices=12, location=(0, 0.05, 0.16))
stinger = bpy.context.active_object
stinger.name = "Bee_Stinger"
stinger.rotation_euler = (math.radians(180), 0, 0)
bpy.ops.object.transform_apply(rotation=True)
stinger.data.materials.append(mat_black)
bpy.ops.object.shade_smooth()

# 2. Head & Face of C: Chibi anime head with cowl and violet anime eyes
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.52, segments=32, ring_count=20, location=(0, 0, 1.30))
head = bpy.context.active_object
head.name = "Bee_Head"
head.scale = (1.05, 0.98, 0.95)
bpy.ops.object.transform_apply(scale=True)
head.data.materials.append(mat_skin_cream)
bpy.ops.object.shade_smooth()

# Cowl/Hair Helmet of C (Dark glossy casing surrounding head)
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.55, segments=32, ring_count=20, location=(0, 0.06, 1.35))
cowl = bpy.context.active_object
cowl.name = "Bee_Cowl"
cowl.scale = (1.10, 1.02, 1.02)
bpy.ops.object.transform_apply(scale=True)
cowl.data.materials.append(mat_cowl_dark)
bpy.ops.object.shade_smooth()

# Antennae on top of Cowl
for side, x in [("L", -0.18), ("R", 0.18)]:
    bpy.ops.mesh.primitive_cylinder_add(radius=0.025, depth=0.35, vertices=10, location=(x, 0.02, 1.95))
    ant = bpy.context.active_object
    ant.name = f"Antenna_{side}"
    ant.rotation_euler = (math.radians(-15), math.radians(-18 if side == "L" else 18), 0)
    bpy.ops.object.transform_apply(rotation=True)
    ant.data.materials.append(mat_black)
    bpy.ops.object.shade_smooth()
    
    # Yellow Honey Bulb at tip
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.06, segments=12, ring_count=8, location=(x * 1.35, -0.04, 2.12))
    tip = bpy.context.active_object
    tip.name = f"Antenna_Tip_{side}"
    tip.data.materials.append(mat_yellow)
    bpy.ops.object.shade_smooth()

# Eyes of C: Big expressive violet anime eyes
for side, x in [("L", -0.22), ("R", 0.22)]:
    # Violet Iris
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.15, segments=20, ring_count=14, location=(x, -0.42, 1.32))
    iris = bpy.context.active_object
    iris.name = f"Eye_Iris_{side}"
    iris.scale = (0.75, 0.35, 1.15)
    bpy.ops.object.transform_apply(scale=True)
    iris.data.materials.append(mat_eye_violet)
    bpy.ops.object.shade_smooth()
    
    # Pupil
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.09, segments=14, ring_count=10, location=(x, -0.46, 1.32))
    pupil = bpy.context.active_object
    pupil.name = f"Eye_Pupil_{side}"
    pupil.scale = (0.75, 0.35, 1.05)
    bpy.ops.object.transform_apply(scale=True)
    pupil.data.materials.append(mat_eye_pupil)
    bpy.ops.object.shade_smooth()

    # Specular Glint
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.045, segments=10, ring_count=8, location=(x - 0.035, -0.49, 1.38))
    glint = bpy.context.active_object
    glint.name = f"Eye_Glint_{side}"
    glint.data.materials.append(mat_eye_glint)
    bpy.ops.object.shade_smooth()

# Cute mouth with derp smile
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.06, segments=12, ring_count=8, location=(0, -0.49, 1.15))
mouth = bpy.context.active_object
mouth.name = "Bee_Mouth"
mouth.scale = (0.9, 0.6, 0.5)
bpy.ops.object.transform_apply(scale=True)
mouth.data.materials.append(mat_black)
bpy.ops.object.shade_smooth()

# 3. Boots of A (White boots standing upright)
for side, x in [("L", -0.18), ("R", 0.18)]:
    # Leg
    bpy.ops.mesh.primitive_cylinder_add(radius=0.08, depth=0.28, vertices=12, location=(x, 0, 0.24))
    leg = bpy.context.active_object
    leg.name = f"Leg_{side}"
    leg.data.materials.append(mat_black)
    bpy.ops.object.shade_smooth()

    # White Boot
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.14, segments=14, ring_count=10, location=(x, -0.06, 0.10))
    boot = bpy.context.active_object
    boot.name = f"Boot_{side}"
    boot.scale = (0.9, 1.5, 0.7)
    bpy.ops.object.transform_apply(scale=True)
    boot.data.materials.append(mat_boot_white)
    bpy.ops.object.shade_smooth()

# 4. Arms & Smoking Joint
# Right Arm (Resting)
bpy.ops.mesh.primitive_cylinder_add(radius=0.08, depth=0.35, vertices=12, location=(0.38, -0.06, 0.70))
arm_r = bpy.context.active_object
arm_r.name = "Arm_R"
arm_r.rotation_euler = (math.radians(-20), math.radians(-25), 0)
bpy.ops.object.transform_apply(rotation=True)
arm_r.data.materials.append(mat_yellow)
bpy.ops.object.shade_smooth()

# Left Arm (Raised holding joint to mouth)
bpy.ops.mesh.primitive_cylinder_add(radius=0.08, depth=0.35, vertices=12, location=(-0.30, -0.22, 0.88))
arm_l = bpy.context.active_object
arm_l.name = "Arm_L"
arm_l.rotation_euler = (math.radians(-65), math.radians(40), math.radians(20))
bpy.ops.object.transform_apply(rotation=True)
arm_l.data.materials.append(mat_yellow)
bpy.ops.object.shade_smooth()

# Hand
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.09, segments=12, ring_count=8, location=(-0.16, -0.38, 1.05))
hand = bpy.context.active_object
hand.name = "Bee_Hand"
hand.data.materials.append(mat_black)
bpy.ops.object.shade_smooth()

# The Burning Joint (Rolled cylinder with glowing cherry)
bpy.ops.mesh.primitive_cylinder_add(radius=0.035, depth=0.32, vertices=10, location=(-0.10, -0.48, 1.15))
joint = bpy.context.active_object
joint.name = "The_Joint"
joint.rotation_euler = (math.radians(25), math.radians(50), math.radians(-30))
bpy.ops.object.transform_apply(rotation=True)
joint.data.materials.append(mat_paper_white)
bpy.ops.object.shade_smooth()

# Glowing Cherry Ember at Joint Tip
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.04, segments=10, ring_count=8, location=(-0.02, -0.58, 1.25))
cherry = bpy.context.active_object
cherry.name = "Joint_Cherry"
cherry.data.materials.append(mat_cherry_red)
bpy.ops.object.shade_smooth()

# Join Character Body
bpy.ops.object.select_all(action="DESELECT")
for obj in col.objects:
    if obj.type == "MESH":
        obj.select_set(True)
bpy.context.view_layer.objects.active = torso
bpy.ops.object.join()
doob_bee = bpy.context.active_object
doob_bee.name = "Doob_Bee_Body"

# 5. The 2 Large Wings of C: Two separate wing objects for independent flapping animation!
wings = []
for side, x, rot_y in [("L", -0.22, math.radians(-35)), ("R", 0.22, math.radians(35))]:
    # Flattened tapered oval wing
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.55, segments=20, ring_count=14, location=(x, 0.42, 1.05))
    w_obj = bpy.context.active_object
    w_obj.name = f"Wing_{side}"
    w_obj.scale = (0.75, 0.04, 1.45)
    w_obj.rotation_euler = (math.radians(-25), rot_y, math.radians(-15 if side == "L" else 15))
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    w_obj.data.materials.append(mat_wing_gold)
    bpy.ops.object.shade_smooth()
    # Set wing pivot to attachment point at back
    w_obj.location = (0, 0, 0)
    wings.append(w_obj)

# Lighting & Camera Rig
target_empty = bpy.data.objects.new("LookTarget", None)
target_empty.location = (0, 0, 1.05)
col.objects.link(target_empty)

world = bpy.context.scene.world
if not world:
    world = bpy.data.worlds.new("World")
    bpy.context.scene.world = world
world.use_nodes = True
bg_node = world.node_tree.nodes.get("Background")
if bg_node:
    bg_node.inputs[0].default_value = (0.7, 0.75, 0.82, 1.0)
    bg_node.inputs[1].default_value = 0.85

lights = [
    ("Key_Zenithal", "SUN", (1.8, -2.5, 4.0), 3.2, (1.0, 0.98, 0.92)),
    ("Fill_Cool", "SUN", (-2.8, -2.0, 2.0), 2.4, (0.78, 0.88, 1.0)),
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

cam_data = bpy.data.cameras.new(name="Sprite_Camera")
cam_data.type = "PERSP"
cam_data.lens = 50
cam_obj = bpy.data.objects.new(name="Sprite_Camera", object_data=cam_data)
cam_obj.location = (0.0, -3.8, 1.25)
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

# 8-frame hovering flight loop (rapid buzzing wing flutter + body bob)
wing_flutters = [
    # (body_z, wing_flap_angle)
    (0.00,  math.radians(25)),  # Frame 0: Wings forward
    (0.02,  math.radians(-15)), # Frame 1: Wings back
    (0.05,  math.radians(25)),  # Frame 2: Wings forward
    (0.07,  math.radians(-15)), # Frame 3: Apex hover
    (0.05,  math.radians(25)),  # Frame 4: Wings forward
    (0.03,  math.radians(-15)), # Frame 5: Descending
    (0.01,  math.radians(25)),  # Frame 6: Wings forward
    (-0.01, math.radians(-15))  # Frame 7: Settle
]

directions = [
    ("N", math.radians(180)),
    ("W", math.radians(-90)),
    ("S", math.radians(0)),
    ("E", math.radians(90))
]

raw_frames_dir = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\actions\doob_bee\raw_frames"
os.makedirs(raw_frames_dir, exist_ok=True)

print("Filming Doob-bee across all 4 directions with high-speed wing flutter...")

for row_idx, (dir_name, base_rot_z) in enumerate(directions):
    for f_idx, (bz, w_flap) in enumerate(wing_flutters):
        # Position body
        doob_bee.location = (0, 0, bz)
        doob_bee.rotation_euler = (0, 0, base_rot_z)
        
        # Position wings with rapid flutter
        for w_idx, w_obj in enumerate(wings):
            w_obj.location = (0, 0, bz)
            # Rotate with base orientation plus wing flap
            flap_sign = 1 if w_idx == 0 else -1
            w_obj.rotation_euler = (w_flap * 0.7, w_flap * flap_sign, base_rot_z)

        out_f = os.path.join(raw_frames_dir, f"frame_{row_idx}_{dir_name}_{f_idx}.png")
        scene.render.filepath = out_f
        bpy.ops.render.render(write_still=True)

print("All 32 frames of Doob-bee filmed cleanly with transparent alpha!")

blend_path = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\actions\doob_bee\doob_bee_master.blend"
bpy.ops.wm.save_as_mainfile(filepath=blend_path)
print("Saved blend:", blend_path)
