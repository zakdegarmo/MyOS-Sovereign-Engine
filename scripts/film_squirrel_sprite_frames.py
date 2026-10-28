import bpy
import math
import os
import sys

bpy.ops.wm.read_factory_settings(use_empty=True)

def make_mat(name, color, roughness=0.3, specular=0.5):
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

mat_fur_orange = make_mat("Fur_Orange", (0.88, 0.35, 0.08, 1.0), roughness=0.35)
mat_fur_white  = make_mat("Fur_White",  (0.96, 0.94, 0.90, 1.0), roughness=0.3)
mat_fur_cream  = make_mat("Fur_Cream",  (0.98, 0.88, 0.68, 1.0), roughness=0.3)
mat_hoodie_grn = make_mat("Hoodie_Green", (0.08, 0.55, 0.18, 1.0), roughness=0.45)
mat_ear_pink   = make_mat("Ear_Pink",   (0.95, 0.45, 0.55, 1.0), roughness=0.3)
mat_leaf_green = make_mat("Leaf_Green", (0.15, 0.70, 0.12, 1.0), roughness=0.3)
mat_eye_dark   = make_mat("Eye_Dark",   (0.10, 0.03, 0.06, 1.0), roughness=0.05, specular=0.95)
mat_eye_high   = make_mat("Eye_Highlight", (1.0, 1.0, 1.0, 1.0), roughness=0.05, specular=1.0)
mat_nose_pink  = make_mat("Nose_Pink",  (0.92, 0.28, 0.42, 1.0), roughness=0.2)

col = bpy.context.collection

# 1. Torso
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.42, segments=24, ring_count=16, location=(0, 0, 0.55))
torso = bpy.context.active_object
torso.name = "Squirrel_Torso"
torso.scale = (0.9, 0.8, 1.3)
bpy.ops.object.transform_apply(scale=True)
torso.data.materials.append(mat_hoodie_grn)
bpy.ops.object.shade_smooth()

# Belly patch
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.34, segments=20, ring_count=14, location=(0, -0.26, 0.48))
belly = bpy.context.active_object
belly.name = "Squirrel_Belly"
belly.scale = (0.75, 0.35, 0.9)
bpy.ops.object.transform_apply(scale=True)
belly.data.materials.append(mat_fur_cream)
bpy.ops.object.shade_smooth()

# 2. Head
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.55, segments=32, ring_count=20, location=(0, 0, 1.25))
head = bpy.context.active_object
head.name = "Squirrel_Head"
head.scale = (1.1, 1.0, 0.95)
bpy.ops.object.transform_apply(scale=True)
head.data.materials.append(mat_fur_orange)
bpy.ops.object.shade_smooth()

# Cheeks
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.46, segments=24, ring_count=16, location=(0, -0.26, 1.15))
cheeks = bpy.context.active_object
cheeks.name = "Squirrel_Cheeks"
cheeks.scale = (0.95, 0.48, 0.65)
bpy.ops.object.transform_apply(scale=True)
cheeks.data.materials.append(mat_fur_cream)
bpy.ops.object.shade_smooth()

# Snout
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.18, segments=16, ring_count=12, location=(0, -0.46, 1.18))
snout = bpy.context.active_object
snout.name = "Squirrel_Snout"
snout.scale = (1.1, 0.8, 0.7)
bpy.ops.object.transform_apply(scale=True)
snout.data.materials.append(mat_fur_white)
bpy.ops.object.shade_smooth()

# Nose
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.07, segments=12, ring_count=8, location=(0, -0.58, 1.22))
nose = bpy.context.active_object
nose.name = "Squirrel_Nose"
nose.scale = (1.2, 0.8, 0.8)
bpy.ops.object.transform_apply(scale=True)
nose.data.materials.append(mat_nose_pink)
bpy.ops.object.shade_smooth()

# Tongue / Derp smile
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.07, segments=12, ring_count=8, location=(0.04, -0.52, 1.11))
tongue = bpy.context.active_object
tongue.name = "Squirrel_Tongue"
tongue.scale = (0.8, 1.2, 0.5)
bpy.ops.object.transform_apply(scale=True)
tongue.data.materials.append(mat_nose_pink)
bpy.ops.object.shade_smooth()

# Eyes
for side, x in [("L", -0.26), ("R", 0.26)]:
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.15, segments=20, ring_count=14, location=(x, -0.42, 1.30))
    eye = bpy.context.active_object
    eye.name = f"Eye_{side}"
    eye.scale = (0.7, 0.4, 1.1)
    eye.rotation_euler = (0, 0, math.radians(-10 if side == "L" else 10))
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    eye.data.materials.append(mat_eye_dark)
    bpy.ops.object.shade_smooth()
    
    # Eye Specular Glint
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.05, segments=10, ring_count=8, location=(x - 0.04, -0.49, 1.36))
    glint = bpy.context.active_object
    glint.name = f"Eye_Glint_{side}"
    glint.data.materials.append(mat_eye_high)
    bpy.ops.object.shade_smooth()

# Ears
for side, x in [("L", -0.38), ("R", 0.38)]:
    bpy.ops.mesh.primitive_cone_add(radius1=0.20, depth=0.48, vertices=16, location=(x, 0.05, 1.82))
    ear = bpy.context.active_object
    ear.name = f"Ear_Outer_{side}"
    rot_z = math.radians(15 if side == "L" else -15)
    rot_y = math.radians(-20 if side == "L" else 20)
    ear.rotation_euler = (math.radians(-10), rot_y, rot_z)
    ear.scale = (0.8, 0.5, 1.0)
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    ear.data.materials.append(mat_fur_orange)
    bpy.ops.object.shade_smooth()

    bpy.ops.mesh.primitive_cone_add(radius1=0.14, depth=0.38, vertices=14, location=(x, -0.02, 1.80))
    inner = bpy.context.active_object
    inner.name = f"Ear_Inner_{side}"
    inner.rotation_euler = (math.radians(-10), rot_y, rot_z)
    inner.scale = (0.65, 0.3, 0.9)
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    inner.data.materials.append(mat_ear_pink)
    bpy.ops.object.shade_smooth()

# Hoodie Collar
bpy.ops.mesh.primitive_torus_add(major_radius=0.42, minor_radius=0.14, major_segments=24, minor_segments=12, location=(0, -0.02, 0.88))
collar = bpy.context.active_object
collar.name = "Squirrel_Collar"
collar.scale = (1.05, 0.95, 0.9)
bpy.ops.object.transform_apply(scale=True)
collar.data.materials.append(mat_hoodie_grn)
bpy.ops.object.shade_smooth()

# Arms & Hands
for side, x in [("L", -0.44), ("R", 0.44)]:
    bpy.ops.mesh.primitive_cylinder_add(radius=0.13, depth=0.38, vertices=14, location=(x, -0.12, 0.68))
    arm = bpy.context.active_object
    arm.name = f"Arm_{side}"
    arm.rotation_euler = (math.radians(-35), math.radians(25 if side == "L" else -25), 0)
    bpy.ops.object.transform_apply(rotation=True)
    arm.data.materials.append(mat_hoodie_grn)
    bpy.ops.object.shade_smooth()

    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.11, segments=12, ring_count=8, location=(x * 1.05, -0.26, 0.58))
    hand = bpy.context.active_object
    hand.name = f"Hand_{side}"
    hand.scale = (1.0, 1.2, 0.7)
    bpy.ops.object.transform_apply(scale=True)
    hand.data.materials.append(mat_fur_cream)
    bpy.ops.object.shade_smooth()

    bpy.ops.mesh.primitive_cone_add(radius1=0.15, depth=0.28, vertices=5, location=(x * 1.15, -0.32, 0.68))
    leaf = bpy.context.active_object
    leaf.name = f"Prop_Leaf_{side}"
    leaf.scale = (0.8, 0.2, 1.1)
    leaf.rotation_euler = (math.radians(20), math.radians(-15 if side == "L" else 15), 0)
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    leaf.data.materials.append(mat_leaf_green)
    bpy.ops.object.shade_smooth()

# Feet / Paws
for side, x in [("L", -0.22), ("R", 0.22)]:
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.16, segments=14, ring_count=10, location=(x, -0.10, 0.08))
    foot = bpy.context.active_object
    foot.name = f"Foot_{side}"
    foot.scale = (0.9, 1.6, 0.5)
    bpy.ops.object.transform_apply(scale=True)
    foot.data.materials.append(mat_fur_cream)
    bpy.ops.object.shade_smooth()

# Big Bushy Tail
tail_nodes = [
    ((0, 0.35, 0.30), 0.28, mat_fur_orange),
    ((0, 0.60, 0.68), 0.42, mat_fur_orange),
    ((0, 0.70, 1.15), 0.52, mat_fur_orange),
    ((0, 0.52, 1.62), 0.48, mat_fur_white),
    ((0, 0.28, 1.95), 0.35, mat_fur_white)
]

for idx, (pos, rad, mat) in enumerate(tail_nodes):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=rad, segments=20, ring_count=14, location=pos)
    t_obj = bpy.context.active_object
    t_obj.name = f"Tail_Segment_{idx}"
    t_obj.scale = (1.0, 1.15, 1.1)
    bpy.ops.object.transform_apply(scale=True)
    t_obj.data.materials.append(mat)
    bpy.ops.object.shade_smooth()

# Join all into one character mesh
bpy.ops.object.select_all(action="DESELECT")
for obj in col.objects:
    if obj.type == "MESH":
        obj.select_set(True)
bpy.context.view_layer.objects.active = torso
bpy.ops.object.join()
squirrel = bpy.context.active_object
squirrel.name = "Stoner_Squirrel"
bpy.ops.object.origin_set(type="ORIGIN_CURSOR", center="MEDIAN")

# Target Empty at center
target_empty = bpy.data.objects.new("LookTarget", None)
target_empty.location = (0, 0, 1.05)
col.objects.link(target_empty)

# Soft World Ambient Light so shadows remain rich and readable
world = bpy.context.scene.world
if not world:
    world = bpy.data.worlds.new("World")
    bpy.context.scene.world = world
world.use_nodes = True
bg_node = world.node_tree.nodes.get("Background")
if bg_node:
    bg_node.inputs[0].default_value = (0.7, 0.75, 0.82, 1.0)
    bg_node.inputs[1].default_value = 0.85

# 5-point Studio Lights
lights = [
    ("Key_Zenithal", "SUN", (1.8, -2.5, 4.0), 3.0, (1.0, 0.98, 0.92)),
    ("Fill_Cool", "SUN", (-2.8, -2.0, 2.0), 2.5, (0.78, 0.88, 1.0)),
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

# Camera (Orthographic / fixed distance for zero parallax)
cam_data = bpy.data.cameras.new(name="Sprite_Camera")
cam_data.type = "PERSP"
cam_data.lens = 50
cam_obj = bpy.data.objects.new(name="Sprite_Camera", object_data=cam_data)
# Backed up to 3.8 so whole character with tail and ears fits perfectly
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

# 8-frame bouncy idle loop parameters
# Frames 0 to 7
# We animate: Z location (bounce), squash & stretch scale, and slight body sway tilt
anim_params = [
    # (z_offset, scale_x, scale_y, scale_z, tilt_deg)
    (0.000, 1.00, 1.00, 1.00,  0.0), # Frame 0: Rest
    (-0.025, 1.02, 1.02, 0.97, -1.5), # Frame 1: Anticipation / dip
    (-0.045, 1.04, 1.04, 0.95, -2.5), # Frame 2: Max squash
    (-0.010, 1.01, 1.01, 0.99, -1.0), # Frame 3: Rising
    (0.040, 0.97, 0.97, 1.04,  1.5), # Frame 4: Max stretch peak
    (0.065, 0.96, 0.96, 1.05,  2.5), # Frame 5: Apex of idle bounce
    (0.035, 0.98, 0.98, 1.02,  1.5), # Frame 6: Descending
    (0.010, 1.00, 1.00, 1.00,  0.5), # Frame 7: Settling
]

# Cardinal Directions for 2.5D Spritesheet (Standard LPC ordering):
# Row 0: North (Back / facing up)
# Row 1: West (Left profile)
# Row 2: South (Front / facing down)
# Row 3: East (Right profile)
directions = [
    ("N", math.radians(180)),
    ("W", math.radians(-90)),
    ("S", math.radians(0)),
    ("E", math.radians(90))
]

raw_frames_dir = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\actions\genx_test\raw_frames"
os.makedirs(raw_frames_dir, exist_ok=True)

print("Starting Sprite-Inator Multi-Direction Filming...")

for row_idx, (dir_name, base_rot_z) in enumerate(directions):
    print(f"Filming direction {dir_name} (Row {row_idx})...")
    for f_idx, (z_off, sx, sy, sz, tilt) in enumerate(anim_params):
        # Set pose
        squirrel.location = (0, 0, z_off)
        squirrel.scale = (sx, sy, sz)
        squirrel.rotation_euler = (0, math.radians(tilt), base_rot_z)
        
        # Render frame
        out_f = os.path.join(raw_frames_dir, f"frame_{row_idx}_{dir_name}_{f_idx}.png")
        scene.render.filepath = out_f
        bpy.ops.render.render(write_still=True)

print("All 32 frames rendered cleanly with transparent background!")
