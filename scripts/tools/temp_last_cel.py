& "C:\Program Files\Blender Foundation\Blender 5.2\blender.exe" -b "flesh_base_comic.blend" --python-expr "
import bpy, os, math, bmesh, mathutils

scene = bpy.context.scene
scene.render.engine = 'BLENDER_EEVEE'
scene.render.film_transparent = True
scene.render.resolution_x = 256
scene.render.resolution_y = 256

arm = bpy.data.objects['Armature']
body = bpy.data.objects['LPC_Decivoxel_Flesh_Fused']
face = bpy.data.objects.get('LPC_Face_Decal')
if face:
    face.hide_render = False

arm.data.pose_position = 'REST'
bpy.context.view_layer.update()

mat_outline = bpy.data.materials.get('LPC_Outline_Mat')

def make_true_comic_cel(name, stops):
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

# Canonical materials with warm comic palette
mat_skin = bpy.data.materials.get('LPC_Skin_Cel')
mat_shirt = make_true_comic_cel('Larry_Shirt_Cel', [
    (0.00, (0.75, 0.78, 0.85)),
    (0.38, (0.88, 0.90, 0.95)),
    (0.46, (0.98, 0.98, 1.00))
])
mat_slacks = make_true_comic_cel('Larry_Slacks_Cel', [
    (0.00, (0.15, 0.22, 0.32)),
    (0.38, (0.24, 0.34, 0.48)),
    (0.46, (0.35, 0.48, 0.65))
])
mat_belt = make_true_comic_cel('Larry_Belt_Cel', [
    (0.00, (0.08, 0.06, 0.04)),
    (0.40, (0.16, 0.12, 0.08))
])
mat_shoes = make_true_comic_cel('Larry_Shoes_Cel', [
    (0.00, (0.05, 0.04, 0.03)),
    (0.40, (0.12, 0.09, 0.07))
])
mat_tie = make_true_comic_cel('Larry_Tie_Cel', [
    (0.00, (0.50, 0.02, 0.04)),
    (0.38, (0.75, 0.04, 0.06)),
    (0.44, (0.95, 0.08, 0.10))
])
mat_buckle = make_true_comic_cel('Larry_Buckle_Cel', [
    (0.00, (0.52, 0.40, 0.08)),
    (0.42, (0.95, 0.80, 0.22))
])

body.data.materials.clear()
body.data.materials.append(mat_skin)   # 0
body.data.materials.append(mat_shirt)  # 1
body.data.materials.append(mat_slacks) # 2
body.data.materials.append(mat_belt)   # 3
body.data.materials.append(mat_shoes)  # 4
body.data.materials.append(mat_outline)# 5

vg_map = {vg.index: vg.name for vg in body.vertex_groups}

for p in body.data.polygons:
    vs = [body.data.vertices[vi] for vi in p.vertices]
    avg_z = sum(v.co.z for v in vs) / len(vs)
    avg_x = sum(abs(v.co.x) for v in vs) / len(vs)
    
    # Check vertex groups of face
    v_groups = set()
    for vi in p.vertices:
        for g in body.data.vertices[vi].groups:
            if g.weight > 0.30:
                v_groups.add(vg_map.get(g.group, ''))
                
    # Shoes
    if any('Foot' in g or 'Toe' in g for g in v_groups) or avg_z < 0.085:
        p.material_index = 4
    # Slacks
    elif avg_z < 0.520 and any('Leg' in g or 'Hips' in g for g in v_groups):
        p.material_index = 2
    # Belt
    elif 0.520 <= avg_z <= 0.555 and avg_x < 0.20:
        p.material_index = 3
    # Hands
    elif any('Hand' in g for g in v_groups) or (avg_x > 0.47 and avg_z < 0.85):
        p.material_index = 0
    # Head & Neck
    elif any('Head' in g or 'neck' in g for g in v_groups) or (avg_z > 0.865 and avg_x < 0.24):
        p.material_index = 0
    # White dress shirt (torso and sleeves)
    else:
        p.material_index = 1

body.data.update()
if mat_outline:
    mod = body.modifiers.get('LPC_Ink_Outline') or body.modifiers.new(name='LPC_Ink_Outline', type='SOLIDIFY')
    mod.thickness = -0.008
    mod.offset = 0.0
    mod.material_offset = 5
    mod.use_flip_normals = True

# Add Hair (short02)
hair_dir = r'C:\Users\zakde\AppData\Roaming\Blender Foundation\Blender\5.2\extensions\.user\blender_org\mpfb\data\hair'
bpy.ops.wm.obj_import(filepath=os.path.join(hair_dir, 'short02', 'short02.obj'))
hair = bpy.context.selected_objects[0]
hair.name = 'Larry_Hair'
hair.rotation_euler[0] = math.radians(90)
bpy.ops.object.transform_apply(rotation=True)

zs = [v.co.z for v in hair.data.vertices]
ys = [v.co.y for v in hair.data.vertices]
xs = [v.co.x for v in hair.data.vertices]
z_min_orig, z_max_orig = min(zs), max(zs)
y_min_orig, y_max_orig = min(ys), max(ys)
x_min_orig, x_max_orig = min(xs), max(xs)

target_z_min, target_z_max = 0.94, 1.28
target_y_min, target_y_max = -0.25, 0.24
target_x_min, target_x_max = -0.28, 0.28

scale_z = (target_z_max - target_z_min) / (z_max_orig - z_min_orig)
scale_y = (target_y_max - target_y_min) / (y_max_orig - y_min_orig)
scale_x = (target_x_max - target_x_min) / (x_max_orig - x_min_orig)

for v in hair.data.vertices:
    v.co.x = target_x_min + (v.co.x - x_min_orig) * scale_x
    v.co.y = target_y_min + (v.co.y - y_min_orig) * scale_y
    v.co.z = target_z_min + (v.co.z - z_min_orig) * scale_z
hair.data.update()

hair.parent = arm
hair_mod = hair.modifiers.new(name='Armature', type='ARMATURE')
hair_mod.object = arm
vg_h = hair.vertex_groups.new(name='Head')
vg_h.add(list(range(len(hair.data.vertices))), 1.0, 'REPLACE')

mat_hair = make_true_comic_cel('Larry_Hair_Cel', [
    (0.00, (0.12, 0.07, 0.04)),
    (0.38, (0.24, 0.15, 0.08)),
    (0.46, (0.35, 0.22, 0.12))
])
hair.data.materials.clear()
hair.data.materials.append(mat_hair)
if mat_outline:
    hair.data.materials.append(mat_outline)
    h_solid = hair.modifiers.new(name='Outline', type='SOLIDIFY')
    h_solid.thickness = -0.007
    h_solid.use_flip_normals = True
    h_solid.material_offset = 1

# 3D Red Necktie
bm = bmesh.new()
# Windsor Knot at throat
bmesh.ops.create_cube(
    bm, size=1.0,
    matrix=(
        mathutils.Matrix.Translation((0.0, -0.225, 0.865)) @
        mathutils.Euler((math.radians(12), 0, 0)).to_matrix().to_4x4() @
        mathutils.Matrix.Diagonal((0.052, 0.032, 0.048, 1.0))
    )
)
# Upper tie blade (chest)
bmesh.ops.create_cube(
    bm, size=1.0,
    matrix=(
        mathutils.Matrix.Translation((0.0, -0.215, 0.755)) @
        mathutils.Euler((math.radians(8), 0, 0)).to_matrix().to_4x4() @
        mathutils.Matrix.Diagonal((0.042, 0.022, 0.200, 1.0))
    )
)
# Lower tie blade (stomach to belt)
bmesh.ops.create_cube(
    bm, size=1.0,
    matrix=(
        mathutils.Matrix.Translation((0.0, -0.200, 0.635)) @
        mathutils.Euler((math.radians(2), 0, 0)).to_matrix().to_4x4() @
        mathutils.Matrix.Diagonal((0.050, 0.022, 0.125, 1.0))
    )
)
# Diamond tip
bmesh.ops.create_cube(
    bm, size=1.0,
    matrix=(
        mathutils.Matrix.Translation((0.0, -0.190, 0.555)) @
        mathutils.Euler((0, 0, math.radians(45))).to_matrix().to_4x4() @
        mathutils.Matrix.Diagonal((0.036, 0.036, 0.020, 1.0))
    )
)
tie_mesh = bpy.data.meshes.new('Larry_Tie_Mesh')
bm.to_mesh(tie_mesh)
bm.free()
tie_obj = bpy.data.objects.new('Larry_Tie', tie_mesh)
bpy.context.collection.objects.link(tie_obj)
tie_obj.data.materials.append(mat_tie)
if mat_outline:
    tie_obj.data.materials.append(mat_outline)
    t_solid = tie_obj.modifiers.new(name='Outline', type='SOLIDIFY')
    t_solid.thickness = -0.003
    t_solid.use_flip_normals = True
    t_solid.material_offset = 1

tie_obj.parent = arm
t_mod = tie_obj.modifiers.new(name='Armature', type='ARMATURE')
t_mod.object = arm
vg_t_nk = tie_obj.vertex_groups.new(name='neck')
vg_t_sp1 = tie_obj.vertex_groups.new(name='Spine01')
vg_t_sp = tie_obj.vertex_groups.new(name='Spine')
for vi, v in enumerate(tie_mesh.vertices):
    z = v.co.z
    if z > 0.83:
        vg_t_nk.add([vi], 0.75, 'REPLACE')
        vg_t_sp1.add([vi], 0.25, 'REPLACE')
    elif z > 0.66:
        vg_t_sp1.add([vi], 0.90, 'REPLACE')
        vg_t_sp.add([vi], 0.10, 'REPLACE')
    else:
        vg_t_sp1.add([vi], 0.20, 'REPLACE')
        vg_t_sp.add([vi], 0.80, 'REPLACE')

# 3D Collar Wings (Crisp White)
bm = bmesh.new()
for sign in [-1.0, 1.0]:
    bmesh.ops.create_cube(
        bm, size=1.0,
        matrix=(
            mathutils.Matrix.Translation((sign * 0.055, -0.170, 0.875)) @
            mathutils.Euler((math.radians(22), math.radians(sign * 15), math.radians(-sign * 28))).to_matrix().to_4x4() @
            mathutils.Matrix.Diagonal((0.055, 0.024, 0.065, 1.0))
        )
    )
collar_mesh = bpy.data.meshes.new('Larry_Collar_Mesh')
bm.to_mesh(collar_mesh)
bm.free()
collar_obj = bpy.data.objects.new('Larry_Collar', collar_mesh)
bpy.context.collection.objects.link(collar_obj)
collar_obj.data.materials.append(mat_shirt)
if mat_outline:
    collar_obj.data.materials.append(mat_outline)
    c_solid = collar_obj.modifiers.new(name='Outline', type='SOLIDIFY')
    c_solid.thickness = -0.004
    c_solid.use_flip_normals = True
    c_solid.material_offset = 1
collar_obj.parent = arm
c_mod = collar_obj.modifiers.new(name='Armature', type='ARMATURE')
c_mod.object = arm
vg_c_nk = collar_obj.vertex_groups.new(name='neck')
vg_c_sp = collar_obj.vertex_groups.new(name='Spine01')
for vi, v in enumerate(collar_mesh.vertices):
    if v.co.z > 0.87:
        vg_c_nk.add([vi], 0.7, 'REPLACE')
        vg_c_sp.add([vi], 0.3, 'REPLACE')
    else:
        vg_c_sp.add([vi], 1.0, 'REPLACE')

# 3D Brass Buckle
bm = bmesh.new()
bmesh.ops.create_cube(
    bm, size=1.0,
    matrix=(
        mathutils.Matrix.Translation((0.0, -0.170, 0.535)) @
        mathutils.Matrix.Diagonal((0.048, 0.016, 0.035, 1.0))
    )
)
buckle_mesh = bpy.data.meshes.new('Larry_Buckle_Mesh')
bm.to_mesh(buckle_mesh)
bm.free()
buckle_obj = bpy.data.objects.new('Larry_Buckle', buckle_mesh)
bpy.context.collection.objects.link(buckle_obj)
buckle_obj.data.materials.append(mat_buckle)
if mat_outline:
    buckle_obj.data.materials.append(mat_outline)
    b_solid = buckle_obj.modifiers.new(name='Outline', type='SOLIDIFY')
    b_solid.thickness = -0.003
    b_solid.use_flip_normals = True
    b_solid.material_offset = 1
buckle_obj.parent = arm
bk_mod = buckle_obj.modifiers.new(name='Armature', type='ARMATURE')
bk_mod.object = arm
vg_bk = buckle_obj.vertex_groups.new(name='Spine')
vg_bk.add(list(range(len(buckle_mesh.vertices))), 1.0, 'REPLACE')

# Camera Setup
cam = bpy.data.objects['RenderCam']
rot = bpy.data.objects['Cam_Rot_Empty']
rot.location = (0.0, -1.20, 0.62)
tgt = bpy.data.objects['CamTarget']
tgt.location = (0.0, -1.20, 0.62)
cam.location = (0.0, -2.15, 0.25)
cam.data.lens = 45.0

# Switch to POSE with Idle_Loop
arm.data.pose_position = 'POSE'
idle = bpy.data.actions.get('Idle_Loop')
arm.animation_data.action = idle
scene.frame_set(int(idle.frame_range[0]))
bpy.context.view_layer.update()

os.makedirs('artifacts/verification', exist_ok=True)
for deg in [0, 45, 90, 180]:
    rot.rotation_euler[2] = math.radians(deg)
    bpy.context.view_layer.update()
    scene.render.filepath = os.path.abspath(f'artifacts/verification/larry_true_cel_{deg}.png')
    bpy.ops.render.render(write_still=True)

out_blend = os.path.abspath('flesh_larry_technician.blend')
bpy.ops.wm.save_as_mainfile(filepath=out_blend)
print('Rendered larry_true_cel_0, 45, 90, 180!')
"
