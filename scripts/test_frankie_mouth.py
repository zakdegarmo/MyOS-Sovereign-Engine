import bpy
import math
import os

BLEND_PATH = r"apps/web/public/actions/hemp_crew/frankie_actor_master.blend"
bpy.ops.wm.open_mainfile(filepath=BLEND_PATH)

to_remove = [obj for obj in bpy.data.objects if any(k in obj.name for k in ["Tooth_", "Lip", "Bite_Line", "Mouth_Dark", "Muzzle_Tan", "Eye_Bag", "Lid_Fold"])]
for obj in to_remove:
    bpy.data.objects.remove(obj, do_unlink=True)

arm_obj = bpy.data.objects.get("Frankie_Armature")
col = bpy.context.collection

def attach_mesh(create_fn, name, bone_name, world_loc, scale=(1,1,1), rot=(0,0,0), mat=None, smooth=True):
    create_fn()
    obj = bpy.context.active_object
    obj.name = name
    obj.location = world_loc
    obj.scale = scale
    obj.rotation_euler = rot
    if mat:
        obj.data.materials.clear()
        obj.data.materials.append(mat)
    if smooth:
        for poly in obj.data.polygons:
            poly.use_smooth = True
    
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    arm_obj.select_set(True)
    bpy.context.view_layer.objects.active = arm_obj
    arm_obj.data.bones.active = arm_obj.data.bones[bone_name]
    bpy.ops.object.parent_set(type='BONE')
    bpy.ops.object.select_all(action='DESELECT')
    return obj

mat_muzzle_tan = bpy.data.materials.get("Muzzle_Tan")
mat_mouth_dark = bpy.data.materials.get("Mouth_Dark")
mat_teeth_corn = bpy.data.materials.get("Teeth_Corn")
mat_black_fur  = bpy.data.materials.get("Black_Fur")
mat_eye_bag    = bpy.data.materials.get("Eye_Bags")

# 1. Smooth, beautifully curved tan muzzle pad
attach_mesh(
    lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=0.34, segments=32, ring_count=24),
    "Muzzle_Tan_Base", "Head", (0, -0.28, 1.20),
    scale=(1.22, 0.70, 0.78), mat=mat_muzzle_tan, smooth=True
)

# 2. Dark recessed mouth cavity
attach_mesh(
    lambda: bpy.ops.mesh.primitive_cylinder_add(radius=0.22, depth=0.08, vertices=32),
    "Mouth_Dark_Cavity", "Head", (0, -0.46, 1.08),
    scale=(1.35, 0.25, 0.42), rot=(math.radians(90), 0, 0),
    mat=mat_mouth_dark, smooth=True
)

# 3. Clean lip outline - sculpted capsule/torus flush with mouth border
attach_mesh(
    lambda: bpy.ops.mesh.primitive_torus_add(major_radius=0.22, minor_radius=0.016, major_segments=32, minor_segments=8),
    "Lip_Rim_Upper", "Head", (0, -0.475, 1.13),
    scale=(1.36, 0.28, 0.36), rot=(math.radians(8), 0, 0),
    mat=mat_black_fur, smooth=True
)
attach_mesh(
    lambda: bpy.ops.mesh.primitive_torus_add(major_radius=0.22, minor_radius=0.016, major_segments=32, minor_segments=8),
    "Lip_Rim_Lower", "Jaw", (0, -0.475, 1.03),
    scale=(1.36, 0.28, 0.36), rot=(math.radians(-8), 0, 0),
    mat=mat_black_fur, smooth=True
)

# 4. Clean Upper Teeth: 8 distinct, neatly aligned chiclets
upper_teeth_count = 8
for i in range(upper_teeth_count):
    u = (i - (upper_teeth_count - 1) / 2.0) / ((upper_teeth_count - 1) / 2.0)
    tx = u * 0.24
    ty = -0.475 + (tx * tx) * 0.40
    tz = 1.115 + (1.0 - u * u) * 0.012
    h_var = 0.038 if (i in [3, 4]) else 0.032
    w_var = 0.026
    rot_z = tx * -40.0
    
    attach_mesh(
        lambda: bpy.ops.mesh.primitive_cube_add(size=1.0),
        f"Tooth_U_{i}", "Head", (tx, ty, tz),
        scale=(w_var, 0.012, h_var),
        rot=(math.radians(-10), 0, math.radians(rot_z)),
        mat=mat_teeth_corn, smooth=False
    )

# 5. Clean Lower Teeth: 8 distinct chiclets rising from lower jaw
lower_teeth_count = 8
for i in range(lower_teeth_count):
    u = (i - (lower_teeth_count - 1) / 2.0) / ((lower_teeth_count - 1) / 2.0)
    tx = u * 0.22
    ty = -0.472 + (tx * tx) * 0.40
    tz = 1.055 + (1.0 - u * u) * 0.010
    h_var = 0.030 if (i in [3, 4]) else 0.026
    w_var = 0.024
    rot_z = tx * -40.0
    
    attach_mesh(
        lambda: bpy.ops.mesh.primitive_cube_add(size=1.0),
        f"Tooth_L_{i}", "Jaw", (tx, ty, tz),
        scale=(w_var, 0.012, h_var),
        rot=(math.radians(10), 0, math.radians(rot_z)),
        mat=mat_teeth_corn, smooth=False
    )

# 6. Eye bags: position cleanly tucked under eyeballs without cutting into pupils
for side, x in [("L", -0.22), ("R", 0.22)]:
    attach_mesh(
        lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=0.10, segments=16, ring_count=12),
        f"Eye_Bag_{side}", "Head", (x, -0.42, 1.25),
        scale=(1.10, 0.35, 0.45),
        rot=(math.radians(-12), math.radians(-15 if side == "L" else 15), 0),
        mat=mat_eye_bag, smooth=True
    )

scene = bpy.context.scene
scene.render.resolution_x = 512
scene.render.resolution_y = 512
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'
scene.render.film_transparent = True

cam = bpy.data.objects.get("Main_Camera")
scene.camera = cam

out_test = r"apps/web/public/actions/hemp_crew/frankie_mouth_test.png"
scene.render.filepath = out_test
bpy.ops.render.render(write_still=True)
print(f"Rendered test mouth to: {out_test}")
