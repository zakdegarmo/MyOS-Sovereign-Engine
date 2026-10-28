import bpy, bmesh, os, math, mathutils

blend_path = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\flesh_base_comic.blend"
bpy.ops.wm.open_mainfile(filepath=os.path.abspath(blend_path))

scene = bpy.context.scene
scene.render.engine = 'BLENDER_EEVEE'
scene.render.film_transparent = True
scene.render.resolution_x = 256
scene.render.resolution_y = 256

body = bpy.data.objects['LPC_Decivoxel_Flesh_Fused']
arm = bpy.data.objects['Armature']
face = bpy.data.objects.get('LPC_Face_Decal')
if face:
    face.hide_render = False

arm.data.pose_position = 'REST'
bpy.context.view_layer.update()

mat_outline = bpy.data.materials.get('LPC_Outline_Mat')

def apply_solidify_outline(obj, outline_mat, thickness=0.005):
    if outline_mat.name not in [s.material.name for s in obj.material_slots if s.material]:
        obj.data.materials.append(outline_mat)
    slot_idx = [s.material.name for s in obj.material_slots if s.material].index(outline_mat.name)
    mod = obj.modifiers.get('LPC_Ink_Outline') or obj.modifiers.new(name='LPC_Ink_Outline', type='SOLIDIFY')
    mod.thickness = -abs(thickness)
    mod.offset = 0.0
    mod.material_offset = slot_idx
    mod.use_flip_normals = True
    return mod

mat_hair = bpy.data.materials.new(name="Oriented_Hair_Cel")
mat_hair.use_nodes = True
nodes = mat_hair.node_tree.nodes
links = mat_hair.node_tree.links
nodes.clear()
diff = nodes.new('ShaderNodeBsdfDiffuse')
diff.inputs['Roughness'].default_value = 0.0
s2rgb = nodes.new('ShaderNodeShaderToRGB')
ramp = nodes.new('ShaderNodeValToRGB')
ramp.color_ramp.interpolation = 'CONSTANT'
while len(ramp.color_ramp.elements) > 1:
    ramp.color_ramp.elements.remove(ramp.color_ramp.elements[-1])
el0 = ramp.color_ramp.elements[0]
el0.position = 0.0
el0.color = (0.16, 0.10, 0.06, 1.0)
el1 = ramp.color_ramp.elements.new(0.40)
el1.color = (0.35, 0.22, 0.14, 1.0)
el2 = ramp.color_ramp.elements.new(0.75)
el2.color = (0.50, 0.35, 0.24, 1.0)
emit = nodes.new('ShaderNodeEmission')
out = nodes.new('ShaderNodeOutputMaterial')
links.new(diff.outputs['BSDF'], s2rgb.inputs['Shader'])
links.new(s2rgb.outputs['Color'], ramp.inputs['Fac'])
links.new(ramp.outputs['Color'], emit.inputs['Color'])
links.new(emit.outputs['Emission'], out.inputs['Surface'])

hair_dir = r"C:\Users\zakde\AppData\Roaming\Blender Foundation\Blender\5.2\extensions\.user\blender_org\mpfb\data\hair"
f = os.path.join(hair_dir, "short01", "short01.obj")
bpy.ops.wm.obj_import(filepath=f)
h_obj = bpy.context.selected_objects[0]
h_obj.name = "Properly_Oriented_Hair"

# TRUE ORIENTATION: 90 deg around X, 180 deg around Z
h_obj.rotation_euler = (math.radians(90), 0, math.radians(180))
bpy.ops.object.transform_apply(rotation=True)

xs = [v.co.x for v in h_obj.data.vertices]
ys = [v.co.y for v in h_obj.data.vertices]
zs = [v.co.z for v in h_obj.data.vertices]

cx = (max(xs) + min(xs)) / 2.0
cy = (max(ys) + min(ys)) / 2.0
z_max = max(zs)
z_min = min(zs)

# Fit precisely to chibi cranium:
# Head width: 0.509 -> hair width: 0.535
# Head depth: 0.457 -> hair depth: 0.485
# Head height: 0.379 -> hair height: 0.320
scale_x = 0.535 / (max(xs) - min(xs))
scale_y = 0.485 / (max(ys) - min(ys))
scale_z = 0.320 / (z_max - z_min)

for v in h_obj.data.vertices:
    v.co.x = (v.co.x - cx) * scale_x
    v.co.y = (v.co.y - cy) * scale_y + 0.005
    v.co.z = 1.280 + (v.co.z - z_max) * scale_z

h_obj.data.update()
h_obj.data.materials.clear()
h_obj.data.materials.append(mat_hair)
apply_solidify_outline(h_obj, mat_outline, thickness=0.004)

h_obj.parent = arm
h_mod = h_obj.modifiers.new('Armature', 'ARMATURE')
h_mod.object = arm
vg_h = h_obj.vertex_groups.new(name='Head')
vg_h.add(list(range(len(h_obj.data.vertices))), 1.0, 'REPLACE')

# Use Idle_Loop so character is animated and camera aligns with Cam_Rot_Empty at (0, -1.20, 0.62)
cam = bpy.data.objects['RenderCam']
rot = bpy.data.objects['Cam_Rot_Empty']
tgt = bpy.data.objects['CamTarget']

rot.location = (0.0, -1.20, 0.62)
tgt.location = (0.0, -1.20, 0.62)
cam.location = (0.0, -2.15, 0.25)
cam.data.lens = 45.0

arm.data.pose_position = 'POSE'
idle = bpy.data.actions.get('Idle_Loop')
arm.animation_data.action = idle
if hasattr(idle, 'slots') and len(idle.slots) > 0:
    arm.animation_data.action_slot = idle.slots[0]
scene.frame_set(0)

for deg in [0, 45, 90, 180]:
    rot.rotation_euler[2] = math.radians(deg)
    bpy.context.view_layer.update()
    scene.render.filepath = os.path.abspath(f'artifacts/verification/oriented_hair_{deg}.png')
    bpy.ops.render.render(write_still=True)
print("Rendered properly oriented hair!")
