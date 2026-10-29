import bpy
import math

bpy.ops.wm.read_factory_settings(use_empty=True)

# Run the clean generation
contour_file = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\actions\genx_test\contour.json"
texture_file = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\actions\genx_test\squirrel_clean.png"

import json
with open(contour_file, "r") as f:
    data = json.load(f)

pts = data["points"][::2]
img_w = data["width"]
img_h = data["height"]
scale_factor = 2.0 / max(img_w, img_h)

curve_data = bpy.data.curves.new(name="SquirrelContour", type="CURVE")
curve_data.dimensions = "2D"
curve_data.extrude = 0.04
curve_data.fill_mode = "BOTH"

spline = curve_data.splines.new("POLY")
spline.use_cyclic_u = True
spline.points.add(len(pts) - 1)

for i, pt in enumerate(pts):
    bx = (pt[0] - img_w / 2.0) * scale_factor
    by = (img_h / 2.0 - pt[1]) * scale_factor
    spline.points[i].co = (bx, by, 0.0, 1.0)

curve_obj = bpy.data.objects.new("Squirrel_Mesh", curve_data)
bpy.context.collection.objects.link(curve_obj)

bpy.context.view_layer.objects.active = curve_obj
curve_obj.select_set(True)
bpy.ops.object.convert(target="MESH")

curve_obj.rotation_euler = (math.radians(90), 0, 0)
bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)

mesh = curve_obj.data

# Bevel modifier for rounded vinyl toy / tabletop miniature rim
mod = curve_obj.modifiers.new(name="Bevel", type="BEVEL")
mod.width = 0.010
mod.segments = 2
mod.limit_method = "ANGLE"
mod.angle_limit = math.radians(35)
mod.use_clamp_overlap = True

for p in mesh.polygons:
    p.use_smooth = True

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
mat_front = bpy.data.materials.new(name="Mat_Front")
mat_front.use_nodes = True
nodes_f = mat_front.node_tree.nodes
nodes_f.clear()
out_f = nodes_f.new(type="ShaderNodeOutputMaterial")
bsdf_f = nodes_f.new(type="ShaderNodeBsdfPrincipled")
bsdf_f.inputs["Roughness"].default_value = 0.35
bsdf_f.inputs["Specular IOR Level"].default_value = 0.5
tex_f = nodes_f.new(type="ShaderNodeTexImage")
tex_f.image = bpy.data.images.load(texture_file)
mat_front.node_tree.links.new(tex_f.outputs["Color"], bsdf_f.inputs["Base Color"])
mat_front.node_tree.links.new(bsdf_f.outputs["BSDF"], out_f.inputs["Surface"])
curve_obj.data.materials.append(mat_front)

# Rim Material (Slot 1) - warm stylized chocolate rim
mat_rim = bpy.data.materials.new(name="Mat_Rim")
mat_rim.use_nodes = True
nodes_r = mat_rim.node_tree.nodes
nodes_r.clear()
out_r = nodes_r.new(type="ShaderNodeOutputMaterial")
bsdf_r = nodes_r.new(type="ShaderNodeBsdfPrincipled")
bsdf_r.inputs["Base Color"].default_value = (0.22, 0.12, 0.07, 1.0)
bsdf_r.inputs["Roughness"].default_value = 0.4
bsdf_r.inputs["Specular IOR Level"].default_value = 0.4
mat_rim.node_tree.links.new(bsdf_r.outputs["BSDF"], out_r.inputs["Surface"])
curve_obj.data.materials.append(mat_rim)

# Assign material slots based on face normals:
# Front/Back (Y normal dominant) -> Slot 0
# Sides/Rims (Y normal small) -> Slot 1
for poly in mesh.polygons:
    if abs(poly.normal.y) > 0.4:
        poly.material_index = 0
    else:
        poly.material_index = 1
    
    for loop_idx in poly.loop_indices:
        v_idx = mesh.loops[loop_idx].vertex_index
        v = mesh.vertices[v_idx]
        u = (v.co.x - min_x) / rx
        v_coord = (v.co.z - min_z) / rz
        uv_layer[loop_idx].uv = (u, v_coord)

# 5-point studio lighting
lights_data = [
    ("Key_Zenithal", "SUN", (1.5, -2.5, 3.5), 3.5, (1.0, 0.98, 0.94)),
    ("Fill_Cool", "SUN", (-2.5, -2.0, 1.5), 2.2, (0.75, 0.85, 1.0)),
    ("Rim_Back_L", "POINT", (-1.8, 1.8, 2.5), 80.0, (1.0, 0.8, 0.6)),
    ("Rim_Back_R", "POINT", (1.8, 1.8, 2.5), 80.0, (0.8, 0.95, 1.0)),
    ("Bounce_Under", "POINT", (0.0, -1.0, -1.2), 30.0, (0.9, 1.0, 0.9))
]

for name, ltype, pos, energy, color in lights_data:
    ld = bpy.data.lights.new(name=name, type=ltype)
    ld.energy = energy
    ld.color = color
    lo = bpy.data.objects.new(name=name, object_data=ld)
    lo.location = pos
    bpy.context.collection.objects.link(lo)

# Camera slightly angled (isometric 3/4)
cam_data = bpy.data.cameras.new(name="Camera")
cam_data.type = "PERSP"
cam_data.lens = 50
cam_obj = bpy.data.objects.new(name="Camera", object_data=cam_data)
cam_obj.location = (0.75, -2.5, 0.25)
cam_obj.rotation_euler = (math.radians(85), 0, math.radians(17))
bpy.context.collection.objects.link(cam_obj)
bpy.context.scene.camera = cam_obj

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
print("Updated 3D preview rendered!")
