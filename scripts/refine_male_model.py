import bpy, bmesh, mathutils, math, os

MALE_BLEND = os.path.abspath("flesh_male_mannequin.blend")
bpy.ops.wm.open_mainfile(filepath=MALE_BLEND)

# Remove old chunky spike hair if present
old_hair = bpy.data.objects.get("Modular_Hair_JRPG_Hero_Spikes")
if old_hair:
    bpy.data.objects.remove(old_hair, do_unlink=True)

def make_sphere(name, loc=(0,0,0), rx=0.1, ry=0.1, rz=0.1):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=20, ring_count=14, radius=1.0, location=loc)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = (rx, ry, rz)
    return obj

def make_capsule(name, p1, p2, r1, r2):
    mesh = bpy.data.meshes.new(name + '_mesh')
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    bm = bmesh.new()
    delta = p2 - p1
    length = delta.length
    rot = delta.to_track_quat('Z', 'Y').to_euler()
    mid = (p1 + p2) / 2
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=16, radius1=r1, radius2=r2, depth=length)
    bm.to_mesh(mesh)
    bm.free()
    obj.location = mid
    obj.rotation_euler = rot
    return obj

pieces = []
# 1. Main skull dome
pieces.append(make_sphere("Hair_Cap", loc=(0.0, 0.01, 1.05), rx=0.258, ry=0.238, rz=0.225))
# Crown volume
pieces.append(make_sphere("Hair_Crown", loc=(0.0, 0.04, 1.18), rx=0.22, ry=0.21, rz=0.14))

# 2. Layered JRPG Bangs (FF4/5/6 style swept fringe - Locke/Bartz/Cecil)
p_start = mathutils.Vector((-0.12, -0.15, 1.16))
p_end   = mathutils.Vector((0.08, -0.22, 1.02))
pieces.append(make_capsule("Bang_Main_Swoop", p_start, p_end, 0.055, 0.030))

p_start2 = mathutils.Vector((-0.02, -0.18, 1.18))
p_end2   = mathutils.Vector((0.14, -0.20, 1.03))
pieces.append(make_capsule("Bang_Layer_2", p_start2, p_end2, 0.045, 0.025))

p_start3 = mathutils.Vector((-0.08, -0.17, 1.15))
p_end3   = mathutils.Vector((-0.04, -0.22, 1.03))
pieces.append(make_capsule("Bang_Center_Tuft", p_start3, p_end3, 0.045, 0.022))

p_start_L = mathutils.Vector((0.18, -0.05, 1.10))
p_end_L   = mathutils.Vector((0.23, -0.12, 0.92))
pieces.append(make_capsule("Temple_Lock_L", p_start_L, p_end_L, 0.048, 0.025))

p_start_R = mathutils.Vector((-0.18, -0.05, 1.10))
p_end_R   = mathutils.Vector((-0.23, -0.12, 0.92))
pieces.append(make_capsule("Temple_Lock_R", p_start_R, p_end_R, 0.048, 0.025))

pieces.append(make_sphere("Hair_Nape", loc=(0.0, 0.16, 0.96), rx=0.20, ry=0.12, rz=0.14))

bpy.ops.object.select_all(action='DESELECT')
for p in pieces: p.select_set(True)
bpy.context.view_layer.objects.active = pieces[0]
bpy.ops.object.join()

hair_obj = bpy.context.view_layer.objects.active
hair_obj.name = "Modular_Hair_JRPG_Adventurer"
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

hair_obj.data.remesh_voxel_size = 0.008
bpy.ops.object.voxel_remesh()

dec = hair_obj.modifiers.new(name="Decimate", type="DECIMATE")
dec.ratio = 0.35
bpy.ops.object.modifier_apply(modifier="Decimate")

for f in hair_obj.data.polygons: f.use_smooth = True
smooth = hair_obj.modifiers.new(name="Smooth", type="SMOOTH")
smooth.factor = 0.4
smooth.iterations = 2
bpy.ops.object.modifier_apply(modifier="Smooth")

mat = bpy.data.materials.new(name="M_Hair_Adventurer_Cel")
mat.use_nodes = True
nodes = mat.node_tree.nodes
links = mat.node_tree.links
nodes.clear()
out = nodes.new("ShaderNodeOutputMaterial")
diff = nodes.new("ShaderNodeBsdfDiffuse")
diff.inputs["Roughness"].default_value = 0.0
s2rgb = nodes.new("ShaderNodeShaderToRGB")
ramp = nodes.new("ShaderNodeValToRGB")
ramp.color_ramp.interpolation = "CONSTANT"
r_elems = ramp.color_ramp.elements
r_elems[0].position = 0.0
r_elems[0].color = (0.35, 0.18, 0.08, 1.0)
r_elems[1].position = 0.35
r_elems[1].color = (0.78, 0.48, 0.22, 1.0)
links.new(diff.outputs["BSDF"], s2rgb.inputs["Shader"])
links.new(s2rgb.outputs["Color"], ramp.inputs["Fac"])
links.new(ramp.outputs["Color"], out.inputs["Surface"])
hair_obj.data.materials.clear()
hair_obj.data.materials.append(mat)

mat_out = bpy.data.materials.get("LPC_Outline_Mat")
if mat_out:
    hair_obj.data.materials.append(mat_out)
    outline = hair_obj.modifiers.new(name="Hair_Outline", type="SOLIDIFY")
    outline.thickness = -0.007
    outline.use_flip_normals = True
    outline.material_offset = 1
    outline.material_offset_rim = 1

arm = bpy.data.objects["Armature"]
bpy.ops.object.select_all(action="DESELECT")
hair_obj.select_set(True)
arm.select_set(True)
bpy.context.view_layer.objects.active = arm
arm.data.bones.active = arm.data.bones["Head"]
bpy.ops.object.parent_set(type="BONE")

bpy.ops.wm.save_as_mainfile(filepath=MALE_BLEND)
print("Saved refined male mannequin blend!")

scene = bpy.context.scene
scene.render.filepath = os.path.abspath("artifacts/verification/flesh_male_refined_preview.png")
bpy.ops.render.render(write_still=True)
print("Rendered refined male preview!")
