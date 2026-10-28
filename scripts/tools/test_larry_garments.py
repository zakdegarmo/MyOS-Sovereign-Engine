import bpy, bmesh, os, math, mathutils

blend_path = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\flesh_base_comic.blend"
bpy.ops.wm.open_mainfile(filepath=os.path.abspath(blend_path))

clothes_dir = r"C:\Users\zakde\AppData\Roaming\Blender Foundation\Blender\5.2\extensions\.user\blender_org\mpfb\data\clothes"
hair_dir = r"C:\Users\zakde\AppData\Roaming\Blender Foundation\Blender\5.2\extensions\.user\blender_org\mpfb\data\hair"

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

# Outline material
mat_outline = bpy.data.materials.get('LPC_Outline_Mat')

def make_cel_mat(name, stops):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()
    
    diff = nodes.new('ShaderNodeBsdfDiffuse')
    diff.inputs['Color'].default_value = (1.0, 1.0, 1.0, 1.0)
    diff.inputs['Roughness'].default_value = 0.0
    
    s2rgb = nodes.new('ShaderNodeShaderToRGB')
    ramp = nodes.new('ShaderNodeValToRGB')
    ramp.color_ramp.interpolation = 'CONSTANT'
    
    while len(ramp.color_ramp.elements) > 1:
        ramp.color_ramp.elements.remove(ramp.color_ramp.elements[-1])
        
    for i, (pos, col) in enumerate(stops):
        if i == 0:
            el = ramp.color_ramp.elements[0]
            el.position = pos
            el.color = (*col, 1.0)
        else:
            el = ramp.color_ramp.elements.new(pos)
            el.color = (*col, 1.0)
            
    emit = nodes.new('ShaderNodeEmission')
    out = nodes.new('ShaderNodeOutputMaterial')
    
    links.new(diff.outputs['BSDF'], s2rgb.inputs['Shader'])
    links.new(s2rgb.outputs['Color'], ramp.inputs['Fac'])
    links.new(ramp.outputs['Color'], emit.inputs['Color'])
    links.new(emit.outputs['Emission'], out.inputs['Surface'])
    return mat

mat_shirt = make_cel_mat('Larry_Shirt_Cel', [
    (0.00, (0.72, 0.76, 0.84)),
    (0.32, (0.85, 0.88, 0.94)),
    (0.48, (0.97, 0.97, 1.00)),
    (0.85, (1.00, 1.00, 1.00))
])

mat_slacks = make_cel_mat('Larry_Slacks_Cel', [
    (0.00, (0.12, 0.18, 0.28)),
    (0.32, (0.20, 0.30, 0.44)),
    (0.48, (0.34, 0.46, 0.62)),
    (0.85, (0.50, 0.64, 0.80))
])

mat_belt = make_cel_mat('Larry_Belt_Cel', [
    (0.00, (0.05, 0.04, 0.03)),
    (0.35, (0.12, 0.09, 0.07)),
    (0.50, (0.22, 0.16, 0.12))
])

mat_tie = make_cel_mat('Larry_Tie_Cel', [
    (0.00, (0.45, 0.02, 0.04)),
    (0.32, (0.72, 0.04, 0.06)),
    (0.48, (0.95, 0.08, 0.10)),
    (0.85, (1.00, 0.25, 0.28))
])

mat_shoes = make_cel_mat('Larry_Shoes_Cel', [
    (0.00, (0.04, 0.03, 0.02)),
    (0.35, (0.10, 0.08, 0.06)),
    (0.50, (0.18, 0.14, 0.11))
])

mat_hair = make_cel_mat('Larry_Hair_Cel', [
    (0.00, (0.10, 0.06, 0.03)),
    (0.32, (0.20, 0.12, 0.07)),
    (0.48, (0.34, 0.22, 0.13)),
    (0.85, (0.50, 0.35, 0.22))
])

print("Materials created.")
