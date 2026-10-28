import bpy, bmesh, mathutils, math

def apply_moonlit_mage():
    print("=== APPLYING MOONLIT MAGE TO CHIBI MASTER ===")
    arm = bpy.data.objects['Armature']
    man = bpy.data.objects['Mannequin']

    # Set Armature to REST pose for precise geometry modification
    arm.data.pose_position = 'REST'
    bpy.context.view_layer.update()

    mw = man.matrix_world
    mw_inv = mw.inverted()

    # ----------------------------------------------------
    # 1. ROBE MESH: Extrude skirt and flare sleeves
    # ----------------------------------------------------
    print("Extruding flowing robe skirt and flaring sleeves...")
    tunic = bpy.data.objects['Modular_Adventurer_Tunic']
    bm = bmesh.new()
    bm.from_mesh(tunic.data)
    bm.verts.ensure_lookup_table()
    bm.edges.ensure_lookup_table()

    # Find the 24 bottom boundary edges at Z == 0.46
    bottom_edges = [e for e in bm.edges if len(e.link_faces) == 1 and all(abs(v.co.z - 0.46) < 0.02 for v in e.verts)]
    print(f"Found {len(bottom_edges)} bottom boundary edges")

    if len(bottom_edges) == 24:
        # Segment 1: down to Z = 0.35 (knees)
        res1 = bmesh.ops.extrude_edge_only(bm, edges=bottom_edges)
        new_verts1 = [v for v in res1['geom'] if isinstance(v, bmesh.types.BMVert)]
        new_edges1 = [e for e in res1['geom'] if isinstance(e, bmesh.types.BMEdge)]

        for v in new_verts1:
            v.co.z = 0.35
            dx = v.co.x - 0.007
            dy = v.co.y - 1.241
            dist = (dx**2 + dy**2)**0.5
            if dist > 0.01:
                v.co.x += (dx / dist) * 0.020
                v.co.y += (dy / dist) * 0.020

        # Segment 2: down to Z = 0.24 (boot tops)
        boundary_edges2 = [e for e in new_edges1 if len(e.link_faces) == 1]
        res2 = bmesh.ops.extrude_edge_only(bm, edges=boundary_edges2)
        new_verts2 = [v for v in res2['geom'] if isinstance(v, bmesh.types.BMVert)]

        for v in new_verts2:
            v.co.z = 0.24
            dx = v.co.x - 0.007
            dy = v.co.y - 1.241
            dist = (dx**2 + dy**2)**0.5
            if dist > 0.01:
                v.co.x += (dx / dist) * 0.040
                v.co.y += (dy / dist) * 0.040

        # Map UVs for the newly extruded skirt faces
        uv_layer = bm.loops.layers.uv.verify()
        for f in [elem for elem in res1['geom'] + res2['geom'] if isinstance(elem, bmesh.types.BMFace)]:
            for loop in f.loops:
                pz = loop.vert.co.z
                # Bottom of skirt maps to gold hem area (V: 0.00 to 0.08)
                v_coord = max(0.01, min(0.08, (pz - 0.24) / (0.46 - 0.24) * 0.07 + 0.01))
                dx = loop.vert.co.x - 0.007
                dy = loop.vert.co.y - 1.241
                angle = math.atan2(dx, -dy)
                u_coord = (angle / (2 * math.pi)) % 1.0 * 0.65
                loop[uv_layer].uv = (u_coord, v_coord)

    # Flare sleeve cuffs slightly outwards
    sleeve_boundary = [e for e in bm.edges if len(e.link_faces) == 1 and any(abs(v.co.x - 0.007) > 0.24 for v in e.verts)]
    for e in sleeve_boundary:
        for v in e.verts:
            is_left = (v.co.x > 0.007)
            v.co.x += 0.015 if is_left else -0.015
            # expand radially
            dz = v.co.z - 0.90
            v.co.z += dz * 0.15

    bm.to_mesh(tunic.data)
    bm.free()
    tunic.data.update()

    # Transfer vertex weights from Mannequin to Tunic for the new vertices
    # We use Blender's Data Transfer modifier temporarily to guarantee 100% smooth weights
    dt_mod = tunic.modifiers.new('WeightTransfer', 'DATA_TRANSFER')
    dt_mod.object = man
    dt_mod.use_vert_data = True
    dt_mod.data_types_verts = {'VGROUP_WEIGHTS'}
    dt_mod.vert_mapping = 'NEAREST'
    bpy.context.view_layer.objects.active = tunic
    bpy.ops.object.modifier_apply(modifier='WeightTransfer')
    print("Vertex weights transferred successfully!")

    # ----------------------------------------------------
    # 2. ROBE MATERIAL: Apply mage_robe_diffuse.png
    # ----------------------------------------------------
    print("Applying mage_robe_diffuse.png texture...")
    mat_tunic = bpy.data.materials.get('M_Adventurer_Tunic')
    if mat_tunic:
        # Load or get mage_robe_diffuse.png
        tex_path = r'c:\Users\zakde\Desktop\AntiGravity projects\MyOS\assets\textures\mage_robe_diffuse.png'
        img_robe = bpy.data.images.load(tex_path, check_existing=True)
        tex_node = mat_tunic.node_tree.nodes.get('Image Texture')
        if tex_node:
            tex_node.image = img_robe
        bsdf = mat_tunic.node_tree.nodes.get('Principled BSDF')
        if bsdf:
            bsdf.inputs['Roughness'].default_value = 0.45

    # ----------------------------------------------------
    # 3. HAIR: Trim top bun so it stays under hat, Dark Sapphire
    # ----------------------------------------------------
    print("Styling Dark Sapphire Anime Hair...")
    hair = bpy.data.objects.get('Modular_Hair_Adventurer')
    if hair:
        bm_hair = bmesh.new()
        bm_hair.from_mesh(hair.data)
        # Delete topknot bun vertices that poke through hat (local Z > 1.20)
        del_verts = [v for v in bm_hair.verts if v.co.z > 1.20]
        bmesh.ops.delete(bm_hair, geom=del_verts, context='VERTS')
        bm_hair.to_mesh(hair.data)
        bm_hair.free()
        hair.data.update()

        # Dark sapphire navy hair
        mat_hair = bpy.data.materials.get('M_Hair_Adventurer')
        if mat_hair:
            bsdf_h = mat_hair.node_tree.nodes.get('Principled BSDF')
            if bsdf_h:
                bsdf_h.inputs['Base Color'].default_value = (0.07, 0.09, 0.20, 1.0)
                bsdf_h.inputs['Roughness'].default_value = 0.30
        hair.hide_render = False
        hair.hide_viewport = False

    # ----------------------------------------------------
    # 4. PANTS & BOOTS: Midnight Indigo Palette
    # ----------------------------------------------------
    print("Styling Pants & Boots...")
    mat_pants = bpy.data.materials.get('M_Adventurer_Pants')
    if mat_pants:
        bsdf_p = mat_pants.node_tree.nodes.get('Principled BSDF')
        if bsdf_p:
            # Deep slate indigo
            bsdf_p.inputs['Roughness'].default_value = 0.60

    mat_boots = bpy.data.materials.get('M_Adventurer_Boots')
    if mat_boots:
        bsdf_b = mat_boots.node_tree.nodes.get('Principled BSDF')
        if bsdf_b:
            bsdf_b.inputs['Base Color'].default_value = (0.12, 0.13, 0.25, 1.0) # Midnight indigo leather
            bsdf_b.inputs['Roughness'].default_value = 0.40

    mat_cuff = bpy.data.materials.get('M_Adventurer_BootCuff')
    if mat_cuff:
        bsdf_c = mat_cuff.node_tree.nodes.get('Principled BSDF')
        if bsdf_c:
            bsdf_c.inputs['Base Color'].default_value = (0.85, 0.68, 0.28, 1.0) # Gilded tan cuff

    # ----------------------------------------------------
    # 5. BODY MASKING: Zero Flesh Clipping
    # ----------------------------------------------------
    print("Applying zero-clipping body mask...")
    vg_vis = man.vertex_groups.get('Body_Visible')
    if not vg_vis:
        vg_vis = man.vertex_groups.new(name='Body_Visible')

    for i, v in enumerate(man.data.vertices):
        wco = mw @ v.co
        dx = abs(wco.x - 0.007)
        is_head = (wco.z >= 0.98)
        is_hand = (wco.z >= 0.70 and dx >= 0.34)
        is_foot = (wco.z <= 0.24)

        if is_head or is_hand or is_foot:
            vg_vis.add([i], 1.0, 'REPLACE')
        else:
            vg_vis.add([i], 0.0, 'REPLACE')

    # ----------------------------------------------------
    # 6. WEAPONS & WEARABLES
    # ----------------------------------------------------
    print("Equipping Mage Hat & 2H Staff...")
    hat = bpy.data.objects.get('Modular_Mage_Hat')
    if hat:
        hat.hide_render = False
        hat.hide_viewport = False

    staff = bpy.data.objects.get('Modular_2H_Staff')
    if staff:
        staff.hide_render = False
        staff.hide_viewport = False

    for obj_name in ['Modular_1H_Sword', 'Modular_Round_Shield', 'Modular_Knight_Cape']:
        o = bpy.data.objects.get(obj_name)
        if o:
            o.hide_render = True
            o.hide_viewport = True

    # Restore POSE mode
    arm.data.pose_position = 'POSE'
    bpy.context.view_layer.update()

    bpy.ops.wm.save_as_mainfile(filepath='moonlit_mage_chibi_master.blend')
    print("SUCCESS: Native Chibi Moonlit Mage fully assembled in moonlit_mage_chibi_master.blend!")

if __name__ == '__main__':
    apply_moonlit_mage()
