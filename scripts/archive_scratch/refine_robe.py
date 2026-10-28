import bpy, bmesh, mathutils, math

def refine_robe():
    arm = bpy.data.objects['Armature']
    man = bpy.data.objects['Mannequin']
    tunic = bpy.data.objects['Modular_Adventurer_Tunic']

    arm.data.pose_position = 'REST'
    bpy.context.view_layer.update()

    # Re-map the bottom extruded vertices of tunic
    # Find verts with Z <= 0.45
    bm = bmesh.new()
    bm.from_mesh(tunic.data)
    bm.verts.ensure_lookup_table()
    bm.faces.ensure_lookup_table()

    uv_layer = bm.loops.layers.uv.verify()

    # Adjust coordinates of extruded verts to look like tailored wizard robe
    for v in bm.verts:
        if abs(v.co.z - 0.35) < 0.03:
            # mid skirt ring
            dx = v.co.x - 0.007
            dy = v.co.y - 1.241
            dist = (dx**2 + dy**2)**0.5
            target_radius = 0.165
            if dist > 0.01:
                v.co.x = 0.007 + (dx / dist) * target_radius
                v.co.y = 1.241 + (dy / dist) * (target_radius * 0.95)
        elif abs(v.co.z - 0.24) < 0.03:
            # bottom hem ring
            dx = v.co.x - 0.007
            dy = v.co.y - 1.241
            dist = (dx**2 + dy**2)**0.5
            target_radius = 0.185
            if dist > 0.01:
                v.co.x = 0.007 + (dx / dist) * target_radius
                v.co.y = 1.241 + (dy / dist) * (target_radius * 0.95)

    # Re-calculate UVs for the lower skirt faces
    for f in bm.faces:
        cz = f.calc_center_median().z
        if cz < 0.46:
            for loop in f.loops:
                pz = loop.vert.co.z
                # Z: 0.24 -> V: 0.04 (gold hem)
                # Z: 0.46 -> V: 0.22 (midnight indigo body)
                v_coord = (pz - 0.24) / (0.46 - 0.24) * 0.18 + 0.04
                dx = loop.vert.co.x - 0.007
                dy = loop.vert.co.y - 1.241
                angle = math.atan2(dx, -dy)
                # U coordinate: front center is U=0.32
                u_coord = ((angle / (2 * math.pi)) % 1.0) * 0.65
                loop[uv_layer].uv = (u_coord, v_coord)

    bm.to_mesh(tunic.data)
    bm.free()
    tunic.data.update()

    arm.data.pose_position = 'POSE'
    bpy.context.view_layer.update()

    bpy.ops.wm.save_as_mainfile(filepath='moonlit_mage_chibi_master.blend')
    print('Refined robe geometry and UV mapping!')

if __name__ == '__main__':
    refine_robe()
