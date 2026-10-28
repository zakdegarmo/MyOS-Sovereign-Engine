import bpy, bmesh, mathutils, math

def build_flawless_paladin():
    print("=== SYNTHESIZING FLAWLESS SUNLIT PALADIN ===")
    arm = bpy.data.objects['Armature']
    man = bpy.data.objects['Mannequin']
    tunic = bpy.data.objects['Modular_Adventurer_Tunic']
    hair = bpy.data.objects['Modular_Hair_Adventurer']
    boots = bpy.data.objects['Modular_Adventurer_Boots']
    pants = bpy.data.objects['Modular_Adventurer_Pants']
    cape = bpy.data.objects.get('Modular_Knight_Cape')
    sword = bpy.data.objects.get('Modular_1H_Sword')
    shield = bpy.data.objects.get('Modular_Round_Shield')

    # Set Armature to REST pose
    arm.data.pose_position = 'REST'
    bpy.context.view_layer.update()

    mw = man.matrix_world

    # ----------------------------------------------------
    # 1. TABARD / SURCOAT SKIRT EXTENSION
    # ----------------------------------------------------
    print("Extruding clean surcoat skirt down to Z = 0.30...")
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

        for v in new_verts:
            v.co.z = 0.30
            dx = v.co.x - 0.007
            dy = v.co.y - 1.258
            dist = (dx**2 + dy**2)**0.5
            if dist > 0.01:
                v.co.x += (dx / dist) * 0.018
                v.co.y += (dy / dist) * 0.016

        uv_layer = bm.loops.layers.uv.verify()
        for f in new_faces:
            for loop in f.loops:
                pz = loop.vert.co.z
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
    # 2. APPLY PALADIN SURCOAT TEXTURE
    # ----------------------------------------------------
    print("Applying paladin_surcoat_diffuse.png...")
    mat_tunic = bpy.data.materials.get('M_Adventurer_Tunic')
    if mat_tunic:
        tex_path = r'c:\Users\zakde\Desktop\AntiGravity projects\MyOS\assets\textures\paladin_surcoat_diffuse.png'
        img_surcoat = bpy.data.images.load(tex_path, check_existing=True)
        tex_node = mat_tunic.node_tree.nodes.get('Image Texture')
        if tex_node:
            tex_node.image = img_surcoat
        bsdf = mat_tunic.node_tree.nodes.get('Principled BSDF')
        if bsdf:
            bsdf.inputs['Roughness'].default_value = 0.40

    # ----------------------------------------------------
    # 3. HAIR: Radiant Golden Blonde
    # ----------------------------------------------------
    print("Styling Golden Blonde Hair...")
    if hair:
        mat_hair = bpy.data.materials.get('M_Hair_Adventurer')
        if mat_hair:
            bsdf_h = mat_hair.node_tree.nodes.get('Principled BSDF')
            if bsdf_h:
                # Radiant golden wheat blonde
                bsdf_h.inputs['Base Color'].default_value = (0.95, 0.78, 0.30, 1.0)
                bsdf_h.inputs['Roughness'].default_value = 0.35
        hair.hide_render = False
        hair.hide_viewport = False

    # ----------------------------------------------------
    # 4. PANTS & BOOTS PALETTE
    # ----------------------------------------------------
    print("Styling Pants & Boots...")
    mat_pants = bpy.data.materials.get('M_Adventurer_Pants')
    if mat_pants:
        bsdf_p = mat_pants.node_tree.nodes.get('Principled BSDF')
        if bsdf_p:
            # Clear image links to get pure ivory breeches
            for l in list(mat_pants.node_tree.links):
                if l.to_socket == bsdf_p.inputs['Base Color']:
                    mat_pants.node_tree.links.remove(l)
            bsdf_p.inputs['Base Color'].default_value = (0.92, 0.93, 0.96, 1.0)
            bsdf_p.inputs['Roughness'].default_value = 0.60

    mat_boots = bpy.data.materials.get('M_Adventurer_Boots')
    if mat_boots:
        bsdf_b = mat_boots.node_tree.nodes.get('Principled BSDF')
        if bsdf_b:
            bsdf_b.inputs['Base Color'].default_value = (0.18, 0.10, 0.05, 1.0) # Dark leather
            bsdf_b.inputs['Roughness'].default_value = 0.35

    mat_cuff = bpy.data.materials.get('M_Adventurer_BootCuff')
    if mat_cuff:
        bsdf_c = mat_cuff.node_tree.nodes.get('Principled BSDF')
        if bsdf_c:
            bsdf_c.inputs['Base Color'].default_value = (0.85, 0.68, 0.28, 1.0)

    # ----------------------------------------------------
    # 5. CAPE: Pristine Ivory & Gold
    # ----------------------------------------------------
    print("Styling Knight Cape...")
    if cape:
        cape.hide_render = False
        cape.hide_viewport = False
        if cape.data.materials:
            mat_cape = cape.data.materials[0]
            bsdf_c = mat_cape.node_tree.nodes.get('Principled BSDF')
            if bsdf_c:
                for l in list(mat_cape.node_tree.links):
                    if l.to_socket == bsdf_c.inputs['Base Color']:
                        mat_cape.node_tree.links.remove(l)
                bsdf_c.inputs['Base Color'].default_value = (0.95, 0.95, 0.97, 1.0)
                bsdf_c.inputs['Roughness'].default_value = 0.45

    # ----------------------------------------------------
    # 6. WEAPONS: Sword & Round Shield
    # ----------------------------------------------------
    print("Equipping Paladin Sword & Shield...")
    if sword:
        sword.hide_render = False
        sword.hide_viewport = False

    if shield:
        shield.hide_render = False
        shield.hide_viewport = False

    # Hide mage gear
    for obj_name in ['Modular_Mage_Hat', 'Modular_2H_Staff']:
        o = bpy.data.objects.get(obj_name)
        if o:
            o.hide_render = True
            o.hide_viewport = True

    # ----------------------------------------------------
    # 7. ZERO-CLIPPING BODY MASK
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
        is_foot = (wco.z <= 0.28)

        if is_head or is_hand or is_foot:
            vg_vis.add([i], 1.0, 'REPLACE')
        else:
            vg_vis.add([i], 0.0, 'REPLACE')

    arm.data.pose_position = 'POSE'
    bpy.context.view_layer.update()

    bpy.ops.wm.save_as_mainfile(filepath='sunlit_paladin_chibi_master.blend')
    print("SUCCESS: Flawless Sunlit Paladin ready in sunlit_paladin_chibi_master.blend!")

if __name__ == '__main__':
    build_flawless_paladin()
