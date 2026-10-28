
import sys
sys.path.append(r'C:\Users\zakde\AppData\Roaming\Python\Python313\site-packages')
import bpy, os, math, bmesh
from PIL import Image

blend_path = os.path.abspath('flesh_female_mannequin.blend')
bpy.ops.wm.open_mainfile(filepath=blend_path)

body = bpy.data.objects['LPC_Decivoxel_Flesh_Female']
arm = bpy.data.objects['Armature']

def make_cel_mat(name, color_base, color_shadow):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()
    out = nodes.new('ShaderNodeOutputMaterial')
    diff = nodes.new('ShaderNodeBsdfDiffuse')
    diff.inputs['Roughness'].default_value = 0.0
    s2rgb = nodes.new('ShaderNodeShaderToRGB')
    ramp = nodes.new('ShaderNodeValToRGB')
    ramp.color_ramp.interpolation = 'CONSTANT'
    ramp.color_ramp.elements[0].position = 0.0
    ramp.color_ramp.elements[0].color = (*color_shadow, 1.0)
    ramp.color_ramp.elements[1].position = 0.40
    ramp.color_ramp.elements[1].color = (*color_base, 1.0)
    links.new(diff.outputs['BSDF'], s2rgb.inputs['Shader'])
    links.new(s2rgb.outputs['Color'], ramp.inputs['Fac'])
    links.new(ramp.outputs['Color'], out.inputs['Surface'])
    return mat

mat_outline = bpy.data.materials.get('LPC_Outline_Mat')

# 1. Create Conformal Tunic
tunic = body.copy()
tunic.data = body.data.copy()
tunic.name = 'LPC_Clothing_Tunic_Female'
bpy.context.collection.objects.link(tunic)

bpy.context.view_layer.objects.active = tunic
bpy.ops.object.mode_set(mode='EDIT')
bm = bmesh.from_edit_mesh(tunic.data)

# Tunic: Z between 0.40 and 0.81, abs(X) <= 0.28
verts_del = [v for v in bm.verts if v.co.z < 0.40 or v.co.z > 0.81 or abs(v.co.x) > 0.28]
bmesh.ops.delete(bm, geom=verts_del, context='VERTS')
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
bmesh.update_edit_mesh(tunic.data)
bpy.ops.object.mode_set(mode='OBJECT')

disp_tunic = tunic.modifiers.new(name='Thickness', type='DISPLACE')
disp_tunic.strength = 0.0035

mat_tunic = make_cel_mat('M_Tunic_Forest', (0.16, 0.48, 0.20), (0.06, 0.20, 0.08))
tunic.data.materials.clear()
tunic.data.materials.append(mat_tunic)
if mat_outline:
    tunic.data.materials.append(mat_outline)

# 2. Create Conformal Pants
pants = body.copy()
pants.data = body.data.copy()
pants.name = 'LPC_Clothing_Pants_Female'
bpy.context.collection.objects.link(pants)

bpy.context.view_layer.objects.active = pants
bpy.ops.object.mode_set(mode='EDIT')
bm = bmesh.from_edit_mesh(pants.data)

# Pants: Z between 0.12 and 0.56, abs(X) <= 0.22
verts_del_p = [v for v in bm.verts if v.co.z < 0.12 or v.co.z > 0.56 or abs(v.co.x) > 0.24]
bmesh.ops.delete(bm, geom=verts_del_p, context='VERTS')
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
bmesh.update_edit_mesh(pants.data)
bpy.ops.object.mode_set(mode='OBJECT')

disp_pants = pants.modifiers.new(name='Thickness', type='DISPLACE')
disp_pants.strength = 0.0020

mat_pants = make_cel_mat('M_Pants_SlateTeal', (0.16, 0.32, 0.40), (0.08, 0.16, 0.22))
pants.data.materials.clear()
pants.data.materials.append(mat_pants)
if mat_outline:
    pants.data.materials.append(mat_outline)

# 3. Create Leather Boots
boots = body.copy()
boots.data = body.data.copy()
boots.name = 'LPC_Clothing_Boots_Female'
bpy.context.collection.objects.link(boots)

bpy.context.view_layer.objects.active = boots
bpy.ops.object.mode_set(mode='EDIT')
bm = bmesh.from_edit_mesh(boots.data)

# Boots: Z <= 0.18
verts_del_b = [v for v in bm.verts if v.co.z > 0.18]
bmesh.ops.delete(bm, geom=verts_del_b, context='VERTS')
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
bmesh.update_edit_mesh(boots.data)
bpy.ops.object.mode_set(mode='OBJECT')

disp_boots = boots.modifiers.new(name='Thickness', type='DISPLACE')
disp_boots.strength = 0.0035

mat_boots = make_cel_mat('M_Boots_Leather', (0.35, 0.22, 0.14), (0.18, 0.10, 0.06))
boots.data.materials.clear()
boots.data.materials.append(mat_boots)
if mat_outline:
    boots.data.materials.append(mat_outline)

# Render a front preview of the full outfit
scene = bpy.context.scene
scene.render.resolution_x = 512
scene.render.resolution_y = 512
scene.render.film_transparent = True
scene.frame_set(1)

cam_rot = bpy.data.objects.get('Cam_Rot_Empty')
cam_rot.rotation_euler[2] = 0.0

out_preview = os.path.abspath('artifacts/verification/test_outfitted_hero_preview.png')
scene.render.filepath = out_preview
bpy.ops.render.render(write_still=True)
print('Rendered outfitted hero preview ->', out_preview)
