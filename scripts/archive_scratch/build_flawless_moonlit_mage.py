import bpy, bmesh, mathutils, math

def build_flawless_mage():
    print("=== SYNTHESIZING FLAWLESS MOONLIT MAGE ===")
    arm = bpy.data.objects['Armature']
    man = bpy.data.objects['Mannequin']
    tunic = bpy.data.objects['Modular_Adventurer_Tunic']
    hair = bpy.data.objects['Modular_Hair_Adventurer']
    boots = bpy.data.objects['Modular_Adventurer_Boots']
    pants = bpy.data.objects['Modular_Adventurer_Pants']

    # Set Armature to REST pose
    arm.data.pose_position = 'REST'
    bpy.context.view_layer.update()

    mw = man.matrix_world

    # ----------------------------------------------------
    # 1. CLEAN ROBE EXTENSION (Single Clean Quad Ring)
    # ----------------------------------------------------
    print("Extruding clean robe hem down to Z = 0.30...")
    bm = bmesh.new()
    bm.from_mesh(tunic.data)
    bm.verts.ensure_lookup_table()
    bm.edges.ensure_lookup_table()

    # Find the 24 bottom boundary edges at Z == 0.46
    bottom_edges = [e for e in bm.edges if len(e.link_faces) == 1 and all(abs(v.co.z - 0.46) < 0.01 for v in e.verts)]
    print(f"Found {len(bottom_edges)} bottom edges")

    if len(bottom_edges) == 24:
        res = bmesh.ops.extrude_edge_only(bm, edges=bottom_edges)
        new_verts = [v for v in res['geom'] if isinstance(v, bmesh.types.BMVert)]
        new_faces = [f for f in res['geom'] if isinstance(f, bmesh.types.BMFace)]
        print(f"Extruded {len(new_verts)} new verts, {len(new_faces)} new faces")

        # Lower new verts down to Z = 0.30 with graceful flare
        for v in new_verts:
            v.co.z = 0.30
            dx = v.co.x - 0.007
            dy = v.co.y - 1.258
            dist = (dx**2 + dy**2)**0.5
            if dist > 0.01:
                v.co.x += (dx / dist) * 0.020
                v.co.y += (dy / dist) * 0.018

        # Clean UV mapping for the new faces
        uv_layer = bm.loops.layers.uv.verify()
        for f in new_faces:
            for loop in f.loops:
                pz = loop.vert.co.z
                # Z: 0.30 -> V: 0.04 (gold hem)
                # Z: 0.46 -> V: 0.18 (indigo body)
                v_coord = max(0.04, min(0.18, (pz - 0.30) / (0.46 - 0.30) * 0.14 + 0.04))
                dx = loop.vert.co.x - 0.007
                dy = loop.vert.co.y - 1.258
                angle = math.atan2(dx, -dy)
                u_coord = ((angle / (2 * math.pi)) % 1.0) * 0.65
                loop[uv_layer].uv = (u_coord, v_coord)

    bm.to_mesh(tunic.data)
    bm.free()
    tunic.data.update()

    # ----------------------------------------------------
    # 2. APPLY MAGE ROBE TEXTURE
    # ----------------------------------------------------
    print("Applying mage_robe_diffuse.png...")
    mat_tunic = bpy.data.materials.get('M_Adventurer_Tunic')
    if mat_tunic:
        tex_path = r'c:\Users\zakde\Desktop\AntiGravity projects\MyOS\assets\textures\mage_robe_diffuse.png'
        img_robe = bpy.data.images.load(tex_path, check_existing=True)
        tex_node = mat_tunic.node_tree.nodes.get('Image Texture')
        if tex_node:
            tex_node.image = img_robe
        bsdf = mat_tunic.node_tree.nodes.get('Principled BSDF')
        if bsdf:
            bsdf.inputs['Roughness'].default_value = 0.45

    # ----------------------------------------------------
    # 3. HAIR: Trim topknot bun, dark sapphire navy
    # ----------------------------------------------------
    print("Trimming hair under hat...")
    if hair:
        bm_h = bmesh.new()
        bm_h.from_mesh(hair.data)
        del_verts = [v for v in bm_h.verts if v.co.z > 1.20]
        bmesh.ops.delete(bm_h, geom=del_verts, context='VERTS')
        bm_h.to_mesh(hair.data)
        bm_h.free()
        hair.data.update()

        mat_hair = bpy.data.materials.get('M_Hair_Adventurer')
        if mat_hair:
            bsdf_h = mat_hair.node_tree.nodes.get('Principled BSDF')
            if bsdf_h:
                bsdf_h.inputs['Base Color'].default_value = (0.07, 0.09, 0.20, 1.0)
                bsdf_h.inputs['Roughness'].default_value = 0.30
        hair.hide_render = False
        hair.hide_viewport = False

    # ----------------------------------------------------
    # 4. PANTS & BOOTS PALETTE
    # ----------------------------------------------------
    mat_boots = bpy.data.materials.get('M_Adventurer_Boots')
    if mat_boots:
        bsdf_b = mat_boots.node_tree.nodes.get('Principled BSDF')
        if bsdf_b:
            bsdf_b.inputs['Base Color'].default_value = (0.12, 0.13, 0.25, 1.0)
            bsdf_b.inputs['Roughness'].default_value = 0.40

    mat_cuff = bpy.data.materials.get('M_Adventurer_BootCuff')
    if mat_cuff:
        bsdf_c = mat_cuff.node_tree.nodes.get('Principled BSDF')
        if bsdf_c:
            bsdf_c.inputs['Base Color'].default_value = (0.85, 0.68, 0.28, 1.0)

    # ----------------------------------------------------
    # 5. ZERO-CLIPPING BODY MASK
    # ----------------------------------------------------
    print("Applying body mask...")
    vg_vis = man.vertex_groups.get('Body_Visible')
    if not vg_vis:
        vg_vis = man.vertex_groups.new(name='Body_Visible')

    for i, v in enumerate(man.data.vertices):
        wco = mw @ v.co
        dx = abs(wco.x - 0.007)
        is_head = (wco.z >= 0.98)
        is_hand = (wco.z >= 0.70 and dx >= 0.34)
        is_foot = (wco.z <= 0.28)

        if is_head or is_hand or is_foot:
            vg_vis.add([i], 1.0, 'REPLACE')
        else:
            vg_vis.add([i], 0.0, 'REPLACE')

    # ----------------------------------------------------
    # 6. WEARABLES: Hat & Staff
    # ----------------------------------------------------
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

    arm.data.pose_position = 'POSE'
    bpy.context.view_layer.update()

    bpy.ops.wm.save_as_mainfile(filepath='moonlit_mage_chibi_master.blend')
    print("SUCCESS: Flawless Moonlit Mage ready in moonlit_mage_chibi_master.blend!")

if __name__ == '__main__':
    build_flawless_mage()
