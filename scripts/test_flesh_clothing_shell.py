
import bpy
import os
import sys

blend_path = r'c:\Users\zakde\Desktop\AntiGravity projects\MyOS\flesh_female_mannequin.blend'
bpy.ops.wm.open_mainfile(filepath=blend_path)

body = bpy.data.objects.get('LPC_Decivoxel_Flesh_Female')
arm = bpy.data.objects.get('Armature')

# Duplicate body to make tunic
tunic = body.copy()
tunic.data = body.data.copy()
tunic.name = 'LPC_Clothing_Tunic_Female'
bpy.context.collection.objects.link(tunic)

# Ensure active
bpy.context.view_layer.objects.active = tunic
bpy.ops.object.mode_set(mode='EDIT')
import bmesh
bm = bmesh.from_edit_mesh(tunic.data)

# Delete vertices outside torso range (e.g. legs, hands, head)
# Z range for tunic: approximately 0.20 to 0.60
verts_to_delete = []
for v in bm.verts:
    # head is Z > 0.62, legs are Z < 0.22, hands are abs(X) > 0.32
    if v.co.z > 0.60 or v.co.z < 0.24:
        verts_to_delete.append(v)
    elif abs(v.co.x) > 0.25 and v.co.z < 0.48: # forearm/hands
        verts_to_delete.append(v)

bmesh.ops.delete(bm, geom=verts_to_delete, context='VERTS')
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
bmesh.update_edit_mesh(tunic.data)
bpy.ops.object.mode_set(mode='OBJECT')

# Add Displace modifier to make it sit cleanly over skin (+0.003m)
disp = tunic.modifiers.new(name='Cloth_Thickness', type='DISPLACE')
disp.strength = 0.003

# Create forest tunic material
mat = bpy.data.materials.new(name='LPC_Tunic_Forest_Cel')
mat.use_nodes = True
nodes = mat.node_tree.nodes
links = mat.node_tree.links
nodes.clear()

out = nodes.new('ShaderNodeOutputMaterial')
diffuse = nodes.new('ShaderNodeBsdfDiffuse')
diffuse.inputs['Color'].default_value = (0.12, 0.35, 0.15, 1.0) # Forest green
ramp = nodes.new('ShaderNodeValToRGB')
ramp.color_ramp.interpolation = 'CONSTANT'
ramp.color_ramp.elements[0].position = 0.45
ramp.color_ramp.elements[0].color = (0.06, 0.18, 0.08, 1.0) # Shadow
ramp.color_ramp.elements[1].position = 0.46
ramp.color_ramp.elements[1].color = (0.16, 0.48, 0.20, 1.0) # Midtone

s2rgb = nodes.new('ShaderNodeShaderToRGB')
links.new(diffuse.outputs['BSDF'], s2rgb.inputs['Shader'])
links.new(s2rgb.outputs['Color'], ramp.inputs['Fac'])

# Belt stripe or trim could be added, or emission
emit = nodes.new('ShaderNodeEmission')
links.new(ramp.outputs['Color'], emit.inputs['Color'])
links.new(emit.outputs['Emission'], out.inputs['Surface'])

tunic.data.materials.clear()
tunic.data.materials.append(mat)
outline_mat = bpy.data.materials.get('LPC_Outline_Mat')
if outline_mat:
    tunic.data.materials.append(outline_mat)

# Render front preview
cam_rot = bpy.data.objects.get('Cam_Rot_Empty')
if cam_rot:
    cam_rot.rotation_euler[2] = 0.0 # South / Front

scene = bpy.context.scene
scene.render.resolution_x = 512
scene.render.resolution_y = 512
scene.render.film_transparent = True
scene.frame_set(1)

out_preview = r'C:\Users\zakde\.gemini\antigravity\brain\5d778f69-db13-4232-9d87-80fc4f0ece4e\test_tunic_preview.png'
scene.render.filepath = out_preview
bpy.ops.render.render(write_still=True)
print('Tunic preview rendered:', out_preview)

# Render 8-frame walk strip
walk_strip_path = r'C:\Users\zakde\.gemini\antigravity\brain\5d778f69-db13-4232-9d87-80fc4f0ece4e\test_tunic_walk_strip.png'
sys.path.append(r'C:\Users\zakde\AppData\Roaming\Python\Python313\site-packages')
from PIL import Image

frames = []
for f in range(1, 9):
    scene.frame_set(f)
    tmp = f'test_tunic_f{f}.png'
    scene.render.filepath = tmp
    bpy.ops.render.render(write_still=True)
    frames.append(Image.open(tmp))
    if os.path.exists(tmp):
        os.remove(tmp)

strip = Image.new('RGBA', (512 * 8, 512))
for i, fr in enumerate(frames):
    strip.paste(fr, (i * 512, 0))
strip.save(walk_strip_path)
print('Walk strip rendered:', walk_strip_path)
