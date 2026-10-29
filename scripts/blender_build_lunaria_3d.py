import sys
import os
import json
import math
import mathutils
import bpy

# Clear scene
bpy.ops.wm.read_factory_settings(use_empty=True)

contour_file = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\actions\genx_test\lunaria_contour.json"
texture_file = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\actions\lunaria_cutout.png"
out_preview_path = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\actions\lunaria_sorceress_preview.png"
out_glb_path = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\models\lunaria_sorceress.glb"
out_blend_path = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\models\lunaria_sorceress.blend"
temp_dir = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\temp_tiles\lunaria"
os.makedirs(temp_dir, exist_ok=True)
os.makedirs(os.path.dirname(out_glb_path), exist_ok=True)

with open(contour_file, "r") as f:
    data = json.load(f)

pts = data["points"]
img_w = data["width"]
img_h = data["height"]
scale_factor = 2.0 / max(img_w, img_h)

# 1. Create 2D Curve
curve_data = bpy.data.curves.new(name="LunariaContour", type="CURVE")
curve_data.dimensions = "2D"
curve_data.extrude = 0.045
curve_data.fill_mode = "BOTH"

spline = curve_data.splines.new("POLY")
spline.use_cyclic_u = True
spline.points.add(len(pts) - 1)

for i, pt in enumerate(pts):
    bx = (pt[0] - img_w / 2.0) * scale_factor
    by = (img_h / 2.0 - pt[1]) * scale_factor
    spline.points[i].co = (bx, by, 0.0, 1.0)

curve_obj = bpy.data.objects.new("Lunaria_Mesh", curve_data)
bpy.context.collection.objects.link(curve_obj)

# 2. Convert to Mesh
bpy.context.view_layer.objects.active = curve_obj
curve_obj.select_set(True)
bpy.ops.object.convert(target="MESH")

# Stand upright
curve_obj.rotation_euler = (math.radians(90), 0, 0)
bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)

mesh = curve_obj.data

# Bevel modifier for rounded collector miniature rim
mod = curve_obj.modifiers.new(name="Bevel", type="BEVEL")
mod.width = 0.010
mod.segments = 2
mod.limit_method = "ANGLE"
mod.angle_limit = math.radians(35)
mod.use_clamp_overlap = True

for p in mesh.polygons:
    p.use_smooth = True

# 3. UV Mapping: orthographic front projection
xs = [v.co.x for v in mesh.vertices]
zs = [v.co.z for v in mesh.vertices]
min_x, max_x = min(xs), max(xs)
min_z, max_z = min(zs), max(zs)
rx = max_x - min_x if max_x != min_x else 1.0
rz = max_z - min_z if max_z != min_z else 1.0

if not mesh.uv_layers:
    mesh.uv_layers.new(name="UVMap")
uv_layer = mesh.uv_layers.active.data

# Front Material (Slot 0)
mat_front = bpy.data.materials.new(name="Mat_Lunaria_Front")
mat_front.use_nodes = True
nodes_f = mat_front.node_tree.nodes
nodes_f.clear()
out_f = nodes_f.new(type="ShaderNodeOutputMaterial")
bsdf_f = nodes_f.new(type="ShaderNodeBsdfPrincipled")
bsdf_f.inputs["Roughness"].default_value = 0.35
bsdf_f.inputs["Specular IOR Level"].default_value = 0.6

tex_f = nodes_f.new(type="ShaderNodeTexImage")
tex_f.image = bpy.data.images.load(texture_file)
tex_f.interpolation = "Closest" # Crisp pixel art filtering

mat_front.node_tree.links.new(tex_f.outputs["Color"], bsdf_f.inputs["Base Color"])
mat_front.node_tree.links.new(tex_f.outputs["Alpha"], bsdf_f.inputs["Alpha"])
mat_front.node_tree.links.new(bsdf_f.outputs["BSDF"], out_f.inputs["Surface"])
mat_front.blend_method = "HASHED"
curve_obj.data.materials.append(mat_front)

# Rim & Back Material (Slot 1) - Royal Selûnite violet with gold sheen
mat_rim = bpy.data.materials.new(name="Mat_Lunaria_Mantle_Rim")
mat_rim.use_nodes = True
nodes_r = mat_rim.node_tree.nodes
nodes_r.clear()
out_r = nodes_r.new(type="ShaderNodeOutputMaterial")
bsdf_r = nodes_r.new(type="ShaderNodeBsdfPrincipled")
bsdf_r.inputs["Base Color"].default_value = (0.16, 0.08, 0.22, 1.0) # Deep violet
bsdf_r.inputs["Metallic"].default_value = 0.15
bsdf_r.inputs["Roughness"].default_value = 0.45
bsdf_r.inputs["Specular IOR Level"].default_value = 0.5
mat_rim.node_tree.links.new(bsdf_r.outputs["BSDF"], out_r.inputs["Surface"])
curve_obj.data.materials.append(mat_rim)

# Assign material slots: front (dominant negative Y normal) -> slot 0, rim/sides -> slot 1
for poly in mesh.polygons:
    # Front normal points toward -Y (since we look from -Y towards +Y)
    if poly.normal.y < -0.3:
        poly.material_index = 0
    else:
        poly.material_index = 1

for poly in mesh.polygons:
    for loop_idx in poly.loop_indices:
        v_idx = mesh.loops[loop_idx].vertex_index
        v = mesh.vertices[v_idx]
        u = (v.co.x - min_x) / rx
        v_coord = (v.co.z - min_z) / rz
        uv_layer[loop_idx].uv = (u, v_coord)

# 4. Floating 3D Celestial Orbiting Magic Sigils (Twin Runes)
def make_sigil_ring(name, loc, radius, color):
    bpy.ops.mesh.primitive_torus_add(major_radius=radius, minor_radius=0.015, location=loc)
    ring = bpy.context.active_object
    ring.name = name
    ring.rotation_euler = (math.radians(45), math.radians(30), 0)
    
    mat = bpy.data.materials.new(name=f"Mat_{name}")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    nodes.clear()
    out = nodes.new(type="ShaderNodeOutputMaterial")
    emission = nodes.new(type="ShaderNodeEmission")
    emission.inputs["Color"].default_value = color
    emission.inputs["Strength"].default_value = 4.0
    mat.node_tree.links.new(emission.outputs["Emission"], out.inputs["Surface"])
    ring.data.materials.append(mat)
    ring.parent = curve_obj
    return ring

ring_l = make_sigil_ring("Sigil_Ring_L", (-0.68, 0.0, 0.18), 0.12, (1.0, 0.78, 0.30, 1.0))
ring_r = make_sigil_ring("Sigil_Ring_R", (0.68, 0.0, 0.18), 0.12, (1.0, 0.78, 0.30, 1.0))

# 5. Studio Lighting
sun_key = bpy.data.lights.new(name="SunKey", type="SUN")
sun_key.energy = 2.8
sun_key.color = (1.0, 0.96, 0.90)
obj_key = bpy.data.objects.new(name="SunKey", object_data=sun_key)
obj_key.location = (2.0, -3.0, 3.5)
obj_key.rotation_euler = (math.radians(45), math.radians(15), math.radians(-30))
bpy.context.collection.objects.link(obj_key)

sun_fill = bpy.data.lights.new(name="SunFill", type="SUN")
sun_fill.energy = 1.4
sun_fill.color = (0.75, 0.85, 1.0)
obj_fill = bpy.data.objects.new(name="SunFill", object_data=sun_fill)
obj_fill.location = (-2.5, -2.5, 2.0)
obj_fill.rotation_euler = (math.radians(50), math.radians(-20), math.radians(40))
bpy.context.collection.objects.link(obj_fill)

sun_rim = bpy.data.lights.new(name="SunRim", type="SUN")
sun_rim.energy = 2.2
sun_rim.color = (1.0, 0.85, 0.6)
obj_rim = bpy.data.objects.new(name="SunRim", object_data=sun_rim)
obj_rim.location = (0.0, 3.0, 2.5)
obj_rim.rotation_euler = (math.radians(-45), 0, math.radians(180))
bpy.context.collection.objects.link(obj_rim)

# 6. Camera Setup
cam_data = bpy.data.cameras.new(name="OrthoCam")
cam_data.type = "ORTHO"
cam_data.ortho_scale = 2.35
cam_obj = bpy.data.objects.new(name="OrthoCam", object_data=cam_data)
bpy.context.collection.objects.link(cam_obj)
bpy.context.scene.camera = cam_obj

cam_dist = 4.5
cam_pitch = math.radians(14) # Slight natural downward 3/4 tilt

scene = bpy.context.scene
scene.render.film_transparent = True
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGBA"

# 7. Render High-Res Front 3/4 Preview
cam_obj.location = (0.0, -cam_dist * math.cos(cam_pitch), cam_dist * math.sin(cam_pitch) + 0.05)
cam_obj.rotation_euler = (math.radians(90) - cam_pitch, 0, 0)

scene.render.resolution_x = 512
scene.render.resolution_y = 512
scene.render.filepath = out_preview_path
bpy.ops.render.render(write_still=True)
print(f"Rendered high-res preview to {out_preview_path}")

# 8. Export 3D Model (.glb and .blend)
curve_obj.select_set(True)
bpy.context.view_layer.objects.active = curve_obj
bpy.ops.export_scene.gltf(
    filepath=out_glb_path,
    export_format='GLB',
    use_selection=False,
    export_apply=True
)
print(f"Exported 3D GLB to {out_glb_path}")

bpy.ops.wm.save_as_mainfile(filepath=out_blend_path)
print(f"Saved 3D Blend file to {out_blend_path}")

# 9. Render 8 Compass Directions for 8-Way HD Action Loop
DIR_ANGLES = [0, -45, -90, -135, 180, 135, 90, 45]
scene.render.resolution_x = 256
scene.render.resolution_y = 256

for row_idx, angle_deg in enumerate(DIR_ANGLES):
    # Orbit character around Z axis
    curve_obj.rotation_euler = (0, 0, math.radians(angle_deg))
    
    # Render 8 subtle hovering/sigil breathing frames per direction
    for frame_idx in range(8):
        # Subtle hover breathing: +/- 0.025m
        hover_z = 0.025 * math.sin(frame_idx * (2 * math.pi / 8))
        curve_obj.location = (0, 0, hover_z)
        
        # Subtle sigil ring spin
        ring_l.rotation_euler = (math.radians(45) + frame_idx * 0.15, math.radians(30), frame_idx * 0.2)
        ring_r.rotation_euler = (math.radians(45) - frame_idx * 0.15, math.radians(-30), -frame_idx * 0.2)
        
        tile_path = os.path.join(temp_dir, f"dir_{row_idx}_frame_{frame_idx}.png")
        scene.render.filepath = tile_path
        bpy.ops.render.render(write_still=True)

print("Finished rendering all 64 tiles (8 directions x 8 frames)!")
