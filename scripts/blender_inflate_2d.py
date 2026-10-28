import bpy
import json
import math
import os
import sys

# Clear existing objects
bpy.ops.wm.read_factory_settings(use_empty=True)

# Load contour points
contour_file = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\actions\genx_test\contour.json"
texture_file = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\actions\genx_test\squirrel_clean.png"

with open(contour_file, "r") as f:
    data = json.load(f)

points = data["points"]
img_w = data["width"]
img_h = data["height"]

# Create 2D curve
curve_data = bpy.data.curves.new(name="SquirrelContour", type="CURVE")
curve_data.dimensions = "2D"
curve_data.extrude = 0.05
curve_data.bevel_depth = 0.015
curve_data.bevel_resolution = 4
curve_data.fill_mode = "BOTH"

spline = curve_data.splines.new("POLY")
spline.use_cyclic_u = True
spline.points.add(len(points) - 1)

# Scale to ~2.0 blender units tall
scale_factor = 2.0 / max(img_w, img_h)

for i, pt in enumerate(points):
    px, py = pt
    # Center origin and flip Y for Blender
    bx = (px - img_w / 2.0) * scale_factor
    by = (img_h / 2.0 - py) * scale_factor
    spline.points[i].co = (bx, by, 0.0, 1.0)

curve_obj = bpy.data.objects.new("Squirrel_Mesh", curve_data)
bpy.context.collection.objects.link(curve_obj)

# Convert curve to mesh
bpy.context.view_layer.objects.active = curve_obj
curve_obj.select_set(True)
bpy.ops.object.convert(target="MESH")

# UV unwrap: project from orthographic front (X, Y) normalized to [0, 1]
mesh = curve_obj.data
if not mesh.uv_layers:
    mesh.uv_layers.new(name="UVMap")
uv_layer = mesh.uv_layers.active.data

# Calculate bounds
min_x = min(v.co.x for v in mesh.vertices)
max_x = max(v.co.x for v in mesh.vertices)
min_y = min(v.co.y for v in mesh.vertices)
max_y = max(v.co.y for v in mesh.vertices)
range_x = max_x - min_x if max_x != min_x else 1.0
range_y = max_y - min_y if max_y != min_y else 1.0

for poly in mesh.polygons:
    for loop_idx in poly.loop_indices:
        v_idx = mesh.loops[loop_idx].vertex_index
        v = mesh.vertices[v_idx]
        # Match texture coordinate exactly
        u = (v.co.x - min_x) / range_x
        v_coord = (v.co.y - min_y) / range_y
        uv_layer[loop_idx].uv = (u, v_coord)

# Create Material with texture
mat = bpy.data.materials.new(name="Squirrel_Mat")
mat.use_nodes = True
nodes = mat.node_tree.nodes
links = mat.node_tree.links
nodes.clear()

output_node = nodes.new(type="ShaderNodeOutputMaterial")
bsdf = nodes.new(type="ShaderNodeBsdfPrincipled")
bsdf.inputs["Roughness"].default_value = 0.35
bsdf.inputs["Specular IOR Level"].default_value = 0.5

tex_image = nodes.new(type="ShaderNodeTexImage")
tex_image.image = bpy.data.images.load(texture_file)

links.new(tex_image.outputs["Color"], bsdf.inputs["Base Color"])
links.new(tex_image.outputs["Alpha"], bsdf.inputs["Alpha"])
links.new(bsdf.outputs["BSDF"], output_node.inputs["Surface"])

curve_obj.data.materials.append(mat)

# 5-point studio lighting
lights_data = [
    ("Key_Zenithal", "SUN", (1.5, -2.0, 3.5), 3.2, (1.0, 0.98, 0.94)),
    ("Fill_Cool", "SUN", (-2.5, -1.5, 2.0), 1.6, (0.75, 0.85, 1.0)),
    ("Rim_Back_L", "POINT", (-1.8, 2.2, 2.5), 80.0, (1.0, 0.8, 0.6)),
    ("Rim_Back_R", "POINT", (1.8, 2.2, 2.5), 80.0, (0.8, 0.95, 1.0)),
    ("Bounce_Under", "POINT", (0.0, -1.0, -1.0), 30.0, (0.9, 0.95, 0.9))
]

for name, ltype, pos, energy, color in lights_data:
    ld = bpy.data.lights.new(name=name, type=ltype)
    ld.energy = energy
    ld.color = color
    lo = bpy.data.objects.new(name=name, object_data=ld)
    lo.location = pos
    bpy.context.collection.objects.link(lo)

# Setup Camera angled to show 3D depth and specular bevel
cam_data = bpy.data.cameras.new(name="Camera")
cam_data.type = "PERSP"
cam_data.lens = 50
cam_obj = bpy.data.objects.new(name="Camera", object_data=cam_data)
cam_obj.location = (1.8, -3.2, 0.8)
# Point at center of character
cam_obj.rotation_euler = (math.radians(78), 0, math.radians(28))
bpy.context.collection.objects.link(cam_obj)
bpy.context.scene.camera = cam_obj

# Render settings
scene = bpy.context.scene
scene.render.engine = "BLENDER_EEVEE"
scene.render.resolution_x = 512
scene.render.resolution_y = 512
scene.render.film_transparent = True
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGBA"

out_path = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\actions\genx_test\squirrel_3d_preview.png"
scene.render.filepath = out_path
bpy.ops.render.render(write_still=True)
print("Render completed:", out_path)

blend_out = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\actions\genx_test\squirrel_figurine.blend"
bpy.ops.wm.save_as_mainfile(filepath=blend_out)
print("Saved blend:", blend_out)
