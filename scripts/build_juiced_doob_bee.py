import bpy
import math
import os

bpy.ops.wm.read_factory_settings(use_empty=True)

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

mat_yellow = make_mat("Bee_Yellow", (0.98, 0.78, 0.08, 1.0), roughness=0.35)
mat_black  = make_mat("Bee_Black",  (0.12, 0.10, 0.12, 1.0), roughness=0.30)
mat_eye_violet = make_mat("Eye_Violet", (0.50, 0.15, 0.82, 1.0), roughness=0.05, specular=1.0)
mat_eye_pupil  = make_mat("Eye_Pupil",  (0.08, 0.02, 0.14, 1.0), roughness=0.05)
mat_eye_glint  = make_mat("Eye_Glint",  (1.0, 1.0, 1.0, 1.0), roughness=0.05, specular=1.0)
mat_cowl_dark  = make_mat("Cowl_Dark",  (0.18, 0.12, 0.22, 1.0), roughness=0.25, specular=0.8)
mat_boot_white = make_mat("Boot_White", (0.95, 0.95, 0.98, 1.0), roughness=0.3)
mat_skin_cream = make_mat("Skin_Cream", (0.98, 0.90, 0.78, 1.0), roughness=0.35)
mat_wing_gold  = make_mat("Wing_Gold",  (0.98, 0.80, 0.25, 0.70), roughness=0.10, specular=1.0, transmission=0.45)
mat_paper_white = make_mat("Paper_White", (0.92, 0.90, 0.85, 1.0), roughness=0.5)

# Glowing Cherry with dynamic emission
mat_cherry_red = make_mat("Cherry_Red", (1.0, 0.25, 0.05, 1.0), roughness=0.2)
cherry_bsdf = mat_cherry_red.node_tree.nodes["Principled BSDF"]
cherry_bsdf.inputs["Emission Color"].default_value = (1.0, 0.25, 0.05, 1.0)
cherry_bsdf.inputs["Emission Strength"].default_value = 8.0

# Smoke Ring Material (Translucent pearlescent)
mat_smoke = make_mat("Smoke_Mat", (0.90, 0.95, 0.92, 0.55), roughness=0.4, specular=0.3, transmission=0.6)

col = bpy.context.collection

# 1. Main Root Empty for character
root_char = bpy.data.objects.new("Doob_Bee_Root", None)
col.objects.link(root_char)

# 2. Torso (Squash & Stretch Capsule)
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.40, segments=24, ring_count=16, location=(0, 0, 0.60))
torso = bpy.context.active_object
torso.name = "Bee_Torso"
torso.scale = (0.85, 0.80, 1.25)
bpy.ops.object.transform_apply(scale=True)
torso.data.materials.append(mat_yellow)
bpy.ops.object.shade_smooth()
torso.parent = root_char

# Black Stripes (Abdomen Rings)
for idx, z_pos in enumerate([0.48, 0.72]):
    bpy.ops.mesh.primitive_torus_add(major_radius=0.36, minor_radius=0.08, major_segments=24, minor_segments=12, location=(0, 0, z_pos))
    stripe = bpy.context.active_object
    stripe.name = f"Bee_Stripe_{idx}"
    stripe.scale = (0.88, 0.82, 0.95)
    bpy.ops.object.transform_apply(scale=True)
    stripe.data.materials.append(mat_black)
    bpy.ops.object.shade_smooth()
    stripe.parent = root_char

# Stinger
bpy.ops.mesh.primitive_cone_add(radius1=0.08, depth=0.22, vertices=12, location=(0, 0.05, 0.16))
stinger = bpy.context.active_object
stinger.name = "Bee_Stinger"
stinger.rotation_euler = (math.radians(180), 0, 0)
bpy.ops.object.transform_apply(rotation=True)
stinger.data.materials.append(mat_black)
bpy.ops.object.shade_smooth()
stinger.parent = root_char

# 3. Head & Cowl
head_root = bpy.data.objects.new("Head_Root", None)
head_root.location = (0, 0, 1.30)
col.objects.link(head_root)
head_root.parent = root_char

bpy.ops.mesh.primitive_uv_sphere_add(radius=0.52, segments=32, ring_count=20, location=(0, 0, 0))
head = bpy.context.active_object
head.name = "Bee_Head"
head.scale = (1.05, 0.98, 0.95)
bpy.ops.object.transform_apply(scale=True)
head.data.materials.append(mat_skin_cream)
bpy.ops.object.shade_smooth()
head.parent = head_root

# Cowl Helmet
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.55, segments=32, ring_count=20, location=(0, 0.06, 0.05))
cowl = bpy.context.active_object
cowl.name = "Bee_Cowl"
cowl.scale = (1.10, 1.02, 1.02)
bpy.ops.object.transform_apply(scale=True)
cowl.data.materials.append(mat_cowl_dark)
bpy.ops.object.shade_smooth()
cowl.parent = head_root

# 4. Antennae (Separate Objects for Spring & Whip Physics!)
antennae = []
for side, x in [("L", -0.18), ("R", 0.18)]:
    ant_pivot = bpy.data.objects.new(f"Antenna_Pivot_{side}", None)
    ant_pivot.location = (x, 0.02, 0.55)
    col.objects.link(ant_pivot)
    ant_pivot.parent = head_root
    
    bpy.ops.mesh.primitive_cylinder_add(radius=0.025, depth=0.35, vertices=10, location=(0, 0, 0.17))
    ant_stem = bpy.context.active_object
    ant_stem.name = f"Ant_Stem_{side}"
    ant_stem.data.materials.append(mat_black)
    bpy.ops.object.shade_smooth()
    ant_stem.parent = ant_pivot

    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.06, segments=12, ring_count=8, location=(0, -0.04, 0.35))
    ant_tip = bpy.context.active_object
    ant_tip.name = f"Ant_Tip_{side}"
    ant_tip.data.materials.append(mat_yellow)
    bpy.ops.object.shade_smooth()
    ant_tip.parent = ant_pivot
    
    antennae.append((ant_pivot, side))

# 5. Eyes (With Animated Sleepy Squint / Inhale Blink Scale!)
eye_objs = []
for side, x in [("L", -0.22), ("R", 0.22)]:
    eye_root = bpy.data.objects.new(f"Eye_Root_{side}", None)
    eye_root.location = (x, -0.42, 0.02)
    col.objects.link(eye_root)
    eye_root.parent = head_root
    
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.15, segments=20, ring_count=14, location=(0, 0, 0))
    iris = bpy.context.active_object
    iris.name = f"Eye_Iris_{side}"
    iris.scale = (0.75, 0.35, 1.15)
    bpy.ops.object.transform_apply(scale=True)
    iris.data.materials.append(mat_eye_violet)
    bpy.ops.object.shade_smooth()
    iris.parent = eye_root

    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.09, segments=14, ring_count=10, location=(0, -0.04, 0))
    pupil = bpy.context.active_object
    pupil.name = f"Eye_Pupil_{side}"
    pupil.scale = (0.75, 0.35, 1.05)
    bpy.ops.object.transform_apply(scale=True)
    pupil.data.materials.append(mat_eye_pupil)
    bpy.ops.object.shade_smooth()
    pupil.parent = eye_root

    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.045, segments=10, ring_count=8, location=(-0.035, -0.07, 0.06))
    glint = bpy.context.active_object
    glint.name = f"Eye_Glint_{side}"
    glint.data.materials.append(mat_eye_glint)
    bpy.ops.object.shade_smooth()
    glint.parent = eye_root

    eye_objs.append(eye_root)

# Mouth
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.06, segments=12, ring_count=8, location=(0, -0.49, -0.15))
mouth = bpy.context.active_object
mouth.scale = (0.9, 0.6, 0.5)
bpy.ops.object.transform_apply(scale=True)
mouth.data.materials.append(mat_black)
bpy.ops.object.shade_smooth()
mouth.parent = head_root

# 6. Boots
for side, x in [("L", -0.18), ("R", 0.18)]:
    bpy.ops.mesh.primitive_cylinder_add(radius=0.08, depth=0.28, vertices=12, location=(x, 0, 0.24))
    leg = bpy.context.active_object
    leg.data.materials.append(mat_black)
    bpy.ops.object.shade_smooth()
    leg.parent = root_char

    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.14, segments=14, ring_count=10, location=(x, -0.06, 0.10))
    boot = bpy.context.active_object
    boot.scale = (0.9, 1.5, 0.7)
    bpy.ops.object.transform_apply(scale=True)
    boot.data.materials.append(mat_boot_white)
    bpy.ops.object.shade_smooth()
    boot.parent = root_char

# 7. Arm & Joint
# Left Arm Holding Joint
bpy.ops.mesh.primitive_cylinder_add(radius=0.08, depth=0.35, vertices=12, location=(-0.30, -0.22, 0.88))
arm_l = bpy.context.active_object
arm_l.rotation_euler = (math.radians(-65), math.radians(40), math.radians(20))
bpy.ops.object.transform_apply(rotation=True)
arm_l.data.materials.append(mat_yellow)
bpy.ops.object.shade_smooth()
arm_l.parent = root_char

bpy.ops.mesh.primitive_uv_sphere_add(radius=0.09, segments=12, ring_count=8, location=(-0.16, -0.38, 1.05))
hand = bpy.context.active_object
hand.data.materials.append(mat_black)
bpy.ops.object.shade_smooth()
hand.parent = root_char

bpy.ops.mesh.primitive_cylinder_add(radius=0.035, depth=0.32, vertices=10, location=(-0.10, -0.48, 1.15))
joint = bpy.context.active_object
joint.rotation_euler = (math.radians(25), math.radians(50), math.radians(-30))
bpy.ops.object.transform_apply(rotation=True)
joint.data.materials.append(mat_paper_white)
bpy.ops.object.shade_smooth()
joint.parent = root_char

bpy.ops.mesh.primitive_uv_sphere_add(radius=0.04, segments=10, ring_count=8, location=(-0.02, -0.58, 1.25))
cherry = bpy.context.active_object
cherry.data.materials.append(mat_cherry_red)
bpy.ops.object.shade_smooth()
cherry.parent = root_char

# 8. Dynamic Combustion Point Light at Cherry Tip!
cherry_light_data = bpy.data.lights.new(name="Cherry_Flare_Light", type="POINT")
cherry_light_data.color = (1.0, 0.35, 0.08)
cherry_light_data.energy = 5.0 # baseline
cherry_light = bpy.data.objects.new("Cherry_Light", object_data=cherry_light_data)
cherry_light.location = (-0.02, -0.60, 1.25)
col.objects.link(cherry_light)
cherry_light.parent = root_char

# 9. Animated Smoke Rings (Exhale Follow-Through)
smoke_ring_data = bpy.ops.mesh.primitive_torus_add(major_radius=0.12, minor_radius=0.035, major_segments=20, minor_segments=10, location=(0, -0.65, 1.35))
smoke_ring = bpy.context.active_object
smoke_ring.name = "Smoke_Ring"
smoke_ring.rotation_euler = (math.radians(45), 0, 0)
smoke_ring.data.materials.append(mat_smoke)
smoke_ring.parent = root_char

# Right Arm
bpy.ops.mesh.primitive_cylinder_add(radius=0.08, depth=0.35, vertices=12, location=(0.38, -0.06, 0.70))
arm_r = bpy.context.active_object
arm_r.rotation_euler = (math.radians(-20), math.radians(-25), 0)
bpy.ops.object.transform_apply(rotation=True)
arm_r.data.materials.append(mat_yellow)
bpy.ops.object.shade_smooth()
arm_r.parent = root_char

# 10. The 2 Large Wings of C with High-Speed Flutter Rig
wings = []
for side, x, rot_y in [("L", -0.22, math.radians(-35)), ("R", 0.22, math.radians(35))]:
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.55, segments=20, ring_count=14, location=(x, 0.42, 1.05))
    w_obj = bpy.context.active_object
    w_obj.name = f"Wing_{side}"
    w_obj.scale = (0.75, 0.04, 1.45)
    w_obj.rotation_euler = (math.radians(-25), rot_y, math.radians(-15 if side == "L" else 15))
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    w_obj.data.materials.append(mat_wing_gold)
    bpy.ops.object.shade_smooth()
    w_obj.parent = root_char
    wings.append(w_obj)

# 5-point Studio Lighting
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

# ─── 8-FRAME JUICED ANIMATION CYCLE ──────────────────────────────────────────
# Disney Principle Squash/Stretch, Spring Antenna Follow-Through,
# Dynamic Cherry Combustion Flash, Sleepy Eye Blink, Smoke Ring Exhale
juice_keyframes = [
    # Frame 0: Resting Hover
    {
        "root_z": 0.00, "root_scale": (1.00, 1.00, 1.00),
        "head_tilt": 0.0, "ant_pitch": 0.0, "ant_yaw": 0.0,
        "eye_scale_z": 1.0, "cherry_energy": 5.0,
        "smoke_pos": (0, -0.65, 1.25), "smoke_scale": 0.01,
        "wing_flap": math.radians(25)
    },
    # Frame 1: Anticipation / Inhale Begins (Slight body dip)
    {
        "root_z": -0.03, "root_scale": (1.03, 1.03, 0.96),
        "head_tilt": math.radians(-3), "ant_pitch": math.radians(12), "ant_yaw": math.radians(5), # antennae lag back!
        "eye_scale_z": 0.85, "cherry_energy": 25.0,
        "smoke_pos": (0, -0.65, 1.25), "smoke_scale": 0.01,
        "wing_flap": math.radians(-15)
    },
    # Frame 2: MAX INHALE! Cherry Erupts into Fire Flare! Eyes Sleepy Squint!
    {
        "root_z": -0.06, "root_scale": (1.06, 1.06, 0.92), # deep squash
        "head_tilt": math.radians(-6), "ant_pitch": math.radians(22), "ant_yaw": math.radians(8), # max whip
        "eye_scale_z": 0.30, # sleepy blissful anime squint!
        "cherry_energy": 90.0, # MASSIVE COMBUSTION FLASH!
        "smoke_pos": (0, -0.65, 1.25), "smoke_scale": 0.01,
        "wing_flap": math.radians(30)
    },
    # Frame 3: Apex Spring Release! Head lifts, antennae spring forward!
    {
        "root_z": 0.04, "root_scale": (0.97, 0.97, 1.04), # stretch
        "head_tilt": math.radians(4), "ant_pitch": math.radians(-10), "ant_yaw": math.radians(-4), # overshoot!
        "eye_scale_z": 0.50, "cherry_energy": 45.0,
        "smoke_pos": (0, -0.68, 1.35), "smoke_scale": 0.40, # smoke ring forms!
        "wing_flap": math.radians(-20)
    },
    # Frame 4: Max Hover Apex & Smoke Exhale Ring Expands!
    {
        "root_z": 0.08, "root_scale": (0.95, 0.95, 1.07), # max stretch
        "head_tilt": math.radians(6), "ant_pitch": math.radians(-18), "ant_yaw": math.radians(-8),
        "eye_scale_z": 0.80, "cherry_energy": 12.0,
        "smoke_pos": (0, -0.75, 1.55), "smoke_scale": 0.90, # big expanding smoke ring
        "wing_flap": math.radians(28)
    },
    # Frame 5: Descending & Smoke Rings Dissipate
    {
        "root_z": 0.05, "root_scale": (0.98, 0.98, 1.02),
        "head_tilt": math.radians(2), "ant_pitch": math.radians(-5), "ant_yaw": math.radians(-2),
        "eye_scale_z": 1.00, "cherry_energy": 8.0,
        "smoke_pos": (0, -0.85, 1.78), "smoke_scale": 1.35, # large faded ring
        "wing_flap": math.radians(-18)
    },
    # Frame 6: Antennae Jiggle Settle
    {
        "root_z": 0.02, "root_scale": (1.00, 1.00, 1.00),
        "head_tilt": 0.0, "ant_pitch": math.radians(6), "ant_yaw": math.radians(2), # secondary bounce
        "eye_scale_z": 1.00, "cherry_energy": 5.0,
        "smoke_pos": (0, -0.92, 1.95), "smoke_scale": 0.01,
        "wing_flap": math.radians(25)
    },
    # Frame 7: Settling back to loop start
    {
        "root_z": 0.00, "root_scale": (1.00, 1.00, 1.00),
        "head_tilt": 0.0, "ant_pitch": 0.0, "ant_yaw": 0.0,
        "eye_scale_z": 1.00, "cherry_energy": 5.0,
        "smoke_pos": (0, -0.65, 1.25), "smoke_scale": 0.01,
        "wing_flap": math.radians(-12)
    }
]

directions = [
    ("N", math.radians(180)),
    ("W", math.radians(-90)),
    ("S", math.radians(0)),
    ("E", math.radians(90))
]

raw_frames_dir = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\actions\doob_bee\juiced_frames"
os.makedirs(raw_frames_dir, exist_ok=True)

print("Filming JUICED Doob-bee across 4 directions (Combustion flare, antenna whip, sleepy blink, smoke exhale)...")

for row_idx, (dir_name, base_rot_z) in enumerate(directions):
    for f_idx, kf in enumerate(juice_keyframes):
        # Apply Root Transforms
        root_char.location = (0, 0, kf["root_z"])
        root_char.scale = kf["root_scale"]
        root_char.rotation_euler = (0, 0, base_rot_z)
        
        # Apply Head & Antenna Whip
        head_root.rotation_euler = (kf["head_tilt"], 0, 0)
        for ant_pivot, side in antennae:
            sign = 1 if side == "L" else -1
            ant_pivot.rotation_euler = (kf["ant_pitch"], kf["ant_yaw"] * sign, 0)
        
        # Apply Eye Blink / Squint Scale
        for eye_root in eye_objs:
            eye_root.scale = (1.0, 1.0, kf["eye_scale_z"])
        
        # Apply Dynamic Combustion Light & Cherry Emission
        cherry_light_data.energy = kf["cherry_energy"]
        cherry_bsdf.inputs["Emission Strength"].default_value = kf["cherry_energy"] * 0.4
        
        # Apply Smoke Ring Exhale
        smoke_ring.location = kf["smoke_pos"]
        smoke_ring.scale = (kf["smoke_scale"], kf["smoke_scale"], kf["smoke_scale"])
        
        # Apply Wing Flap
        for w_idx, w_obj in enumerate(wings):
            flap_sign = 1 if w_idx == 0 else -1
            w_obj.rotation_euler = (kf["wing_flap"] * 0.7, kf["wing_flap"] * flap_sign, 0)

        out_f = os.path.join(raw_frames_dir, f"frame_{row_idx}_{dir_name}_{f_idx}.png")
        scene.render.filepath = out_f
        bpy.ops.render.render(write_still=True)

print("All 32 JUICED frames filmed cleanly!")
