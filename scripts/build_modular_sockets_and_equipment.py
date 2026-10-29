import bpy, os, math
from mathutils import Vector, Euler, Matrix

def build_sockets_and_equipment(blend_path):
    bpy.ops.wm.open_mainfile(filepath=blend_path)
    
    arm = bpy.data.objects['Armature']
    mesh = bpy.data.objects['Mannequin']

    # Set Armature to REST pose during setup
    arm.data.pose_position = 'REST'
    bpy.context.scene.frame_set(0)
    bpy.context.view_layer.update()

    # ----------------------------------------------------
    # 1. ADD / VERIFY SOCKET BONES
    # ----------------------------------------------------
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode='EDIT')
    eb = arm.data.edit_bones

    sockets_spec = [
        ('Hand.R_Socket', 'RightHand', Vector((-0.57, 1.29, 0.98)), Vector((-0.57, 1.29, 0.88))),
        ('Hand.L_Socket', 'LeftHand', Vector((0.57, 1.29, 0.98)), Vector((0.57, 1.29, 0.88))),
        ('Head_Socket', 'Head', Vector((0.007, 1.241, 1.2825)), Vector((0.007, 1.241, 1.3825))),
        ('Face_Socket', 'Head', Vector((0.007, 1.155, 1.138)), Vector((0.007, 1.055, 1.138))),
        ('Spine_Socket', 'Spine01', Vector((0.007, 1.34, 0.88)), Vector((0.007, 1.44, 0.88))),
        ('Shoulder.R_Socket', 'RightShoulder', Vector((-0.15, 1.27, 1.00)), Vector((-0.15, 1.27, 1.10))),
        ('Shoulder.L_Socket', 'LeftShoulder', Vector((0.15, 1.27, 1.00)), Vector((0.15, 1.27, 1.10))),
    ]

    for sname, pname, h, t in sockets_spec:
        old_b = eb.get(sname)
        if old_b:
            eb.remove(old_b)
        b = eb.new(sname)
        b.head = h
        b.tail = t
        b.use_deform = False
        parent = eb.get(pname)
        if parent:
            b.parent = parent

    bpy.ops.object.mode_set(mode='OBJECT')

    # Ensure collection for modular equipment exists
    mod_coll = bpy.data.collections.get('Modular_Equipment')
    if not mod_coll:
        mod_coll = bpy.data.collections.new('Modular_Equipment')
        bpy.context.scene.collection.children.link(mod_coll)

    # ----------------------------------------------------
    # 2. CREATE CONFORMAL ANIME FACE DECAL
    # ----------------------------------------------------
    old_face = bpy.data.objects.get('Chibi_Face_Decal')
    if old_face:
        bpy.data.objects.remove(old_face, do_unlink=True)

    face_mesh = bpy.data.meshes.new('Chibi_Face_Decal_Mesh')
    face_obj = bpy.data.objects.new('Chibi_Face_Decal', face_mesh)
    mod_coll.objects.link(face_obj)

    verts = []
    uvs = []
    faces = []
    nx, ny = 4, 3
    w, h = 0.20, 0.16
    cx, cy, cz = 0.007, 1.154, 1.135
    radius = 0.18

    for j in range(ny + 1):
        v_coord = j / ny
        z = cz - (h / 2.0) + v_coord * h
        for i in range(nx + 1):
            u_coord = i / nx
            x = cx - (w / 2.0) + u_coord * w
            dx = x - cx
            dz = z - cz
            sagitta = radius - math.sqrt(max(0.001, radius**2 - dx**2 - (dz*0.5)**2))
            y = cy + sagitta * 0.4
            verts.append((x, y, z))
            uvs.append((u_coord, v_coord))

    for j in range(ny):
        for i in range(nx):
            i0 = j * (nx + 1) + i
            i1 = i0 + 1
            i2 = (j + 1) * (nx + 1) + i + 1
            i3 = (j + 1) * (nx + 1) + i
            faces.append((i0, i1, i2, i3))

    face_mesh.from_pydata(verts, [], faces)
    face_mesh.update()

    uv_layer = face_mesh.uv_layers.new(name='UVMap')
    for poly in face_mesh.polygons:
        for loop_idx in poly.loop_indices:
            v_idx = face_mesh.loops[loop_idx].vertex_index
            uv_layer.data[loop_idx].uv = uvs[v_idx]

    mat = bpy.data.materials.get('M_Chibi_Face')
    if not mat:
        mat = bpy.data.materials.new('M_Chibi_Face')
    mat.use_nodes = True
    mat.blend_method = 'BLEND'
    mat.show_transparent_back = False
    
    nodes = mat.node_tree.nodes
    nodes.clear()
    node_out = nodes.new('ShaderNodeOutputMaterial')
    node_bsdf = nodes.new('ShaderNodeBsdfPrincipled')
    node_bsdf.inputs['Roughness'].default_value = 0.4
    node_tex = nodes.new('ShaderNodeTexImage')
    node_tex.name = 'FaceTexture'

    tex_path = r'c:\Users\zakde\Desktop\AntiGravity projects\MyOS\assets\textures\chibi_faces\face_neutral.png'
    if os.path.exists(tex_path):
        img = bpy.data.images.load(filepath=tex_path, check_existing=True)
        node_tex.image = img

    mat.node_tree.links.new(node_tex.outputs['Color'], node_bsdf.inputs['Base Color'])
    mat.node_tree.links.new(node_tex.outputs['Alpha'], node_bsdf.inputs['Alpha'])
    mat.node_tree.links.new(node_bsdf.outputs['BSDF'], node_out.inputs['Surface'])
    face_obj.data.materials.append(mat)

    # Use parent_set for face_obj
    bpy.ops.object.select_all(action='DESELECT')
    face_obj.select_set(True)
    arm.select_set(True)
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode='POSE')
    arm.data.bones.active = arm.data.bones['Face_Socket']
    bpy.ops.object.parent_set(type='BONE')
    bpy.ops.object.mode_set(mode='OBJECT')
    print('Bound Chibi_Face_Decal to Face_Socket via parent_set!')

    # ----------------------------------------------------
    # 3. EXTRACT & FIT MODULAR EQUIPMENT
    # ----------------------------------------------------
    knight_glb = r'c:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\models\kaykit_adventurers\Knight.glb'
    mage_glb = r'c:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\models\kaykit_adventurers\Mage.glb'

    def setup_prop(glb_file, prop_name, new_name, socket_bone_name, world_loc, world_scale, world_rot_euler):
        old_o = bpy.data.objects.get(new_name)
        if old_o:
            bpy.data.objects.remove(old_o, do_unlink=True)
            
        existing_objs = set(bpy.data.objects.keys())
        bpy.ops.import_scene.gltf(filepath=glb_file)
        new_imported = [bpy.data.objects[k] for k in bpy.data.objects.keys() if k not in existing_objs]
        
        target_prop = None
        for o in new_imported:
            if o.name == prop_name or o.name.startswith(prop_name):
                target_prop = o
            else:
                if o.type == 'ARMATURE' or (o.type == 'MESH' and o != target_prop):
                    bpy.data.objects.remove(o, do_unlink=True)
                    
        if target_prop:
            target_prop.name = new_name
            for c in list(target_prop.users_collection):
                c.objects.unlink(target_prop)
            mod_coll.objects.link(target_prop)
            
            # Place in world space
            target_prop.parent = None
            target_prop.location = world_loc
            target_prop.scale = world_scale
            target_prop.rotation_euler = Euler(world_rot_euler, 'XYZ')
            bpy.context.view_layer.update()
            
            # Parent to bone via parent_set
            bpy.ops.object.select_all(action='DESELECT')
            target_prop.select_set(True)
            arm.select_set(True)
            bpy.context.view_layer.objects.active = arm
            bpy.ops.object.mode_set(mode='POSE')
            arm.data.bones.active = arm.data.bones[socket_bone_name]
            bpy.ops.object.parent_set(type='BONE')
            bpy.ops.object.mode_set(mode='OBJECT')
            print(f'Equipped {new_name} onto {socket_bone_name}!')
            return target_prop
        return None

    # Sword in right hand
    setup_prop(
        knight_glb, '1H_Sword', 'Modular_1H_Sword', 'Hand.R_Socket',
        world_loc=Vector((-0.57, 1.25, 0.98)),
        world_scale=(0.55, 0.55, 0.55),
        world_rot_euler=(math.radians(90), 0, math.radians(-90))
    )

    # Shield on left forearm
    setup_prop(
        knight_glb, 'Round_Shield', 'Modular_Round_Shield', 'Hand.L_Socket',
        world_loc=Vector((0.60, 1.25, 0.98)),
        world_scale=(0.50, 0.50, 0.50),
        world_rot_euler=(0, math.radians(90), math.radians(90))
    )

    # Wizard Hat on head crown
    setup_prop(
        mage_glb, 'Mage_Hat', 'Modular_Mage_Hat', 'Head_Socket',
        world_loc=Vector((0.007, 1.24, 1.26)),
        world_scale=(0.60, 0.60, 0.60),
        world_rot_euler=(0, 0, 0)
    )

    # Cape on back
    setup_prop(
        knight_glb, 'Knight_Cape', 'Modular_Knight_Cape', 'Spine_Socket',
        world_loc=Vector((0.007, 1.34, 0.88)),
        world_scale=(0.60, 0.60, 0.60),
        world_rot_euler=(0, 0, 0)
    )

    # Staff in right hand (default hidden)
    staff = setup_prop(
        mage_glb, '2H_Staff', 'Modular_2H_Staff', 'Hand.R_Socket',
        world_loc=Vector((-0.57, 1.25, 0.98)),
        world_scale=(0.50, 0.50, 0.50),
        world_rot_euler=(math.radians(90), 0, math.radians(-90))
    )
    if staff:
        staff.hide_viewport = True
        staff.hide_render = True

    # Restore POSE mode for playback
    arm.data.pose_position = 'POSE'
    bpy.context.scene.frame_set(0)
    bpy.context.view_layer.update()

    bpy.ops.wm.save_mainfile(filepath=blend_path)
    print(f'Sockets, Face Decal, and Modular Equipment fully verified and saved into {blend_path}!')

if __name__ == '__main__':
    build_sockets_and_equipment(r'c:\Users\zakde\Desktop\AntiGravity projects\MyOS\mannequin_chibi_basic_rigTest1.blend')
