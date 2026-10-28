# scripts/tools/forge_junkyard_hideout.py
"""
Bespoke 3D Asset Forge for Uniracers 2: One Wheel Outlaws
Procedurally builds Red's Junkyard Hideout in Blender 5.2:
- Grungy 80s Couch with broken helical steel suspension spring & exposed foam
- 90s Cathode Ray Box CRT TV with rabbit ear antennas, dials, and screen glow
- Stamped Tin 10W-40 Chain Oil Can with pouring spout & grease puddle
- Industrial metal corrugated walls, concrete floor, rusted burn drum
- High-fidelity beveled hard-surface meshes & Chiaroscuro 3-point lighting
- Exports GLB to apps/web/public/models/junkyard_hideout_vignette.glb
- Renders high-res verification still to temp_junkyard_vignette.png
"""

import bpy
import math
import os
import sys

def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    if not bpy.data.collections:
        col = bpy.data.collections.new("Collection")
        bpy.context.scene.collection.children.link(col)

def create_material(name, diffuse_color, roughness=0.5, metalness=0.0, emission_color=(0,0,0,1), emission_strength=0.0):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs['Base Color'].default_value = diffuse_color
        bsdf.inputs['Roughness'].default_value = roughness
        bsdf.inputs['Metallic'].default_value = metalness
        if 'Emission Color' in bsdf.inputs:
            bsdf.inputs['Emission Color'].default_value = emission_color
            bsdf.inputs['Emission Strength'].default_value = emission_strength
        elif 'Emission' in bsdf.inputs:
            bsdf.inputs['Emission'].default_value = emission_color
    return mat

def apply_bevel_and_smooth(obj, width=0.02, segments=2):
    """Adds a clean bevel modifier and smooth shading to give props weight and soft specular highlights."""
    for poly in obj.data.polygons:
        poly.use_smooth = True
    mod = obj.modifiers.new(name="Bevel", type='BEVEL')
    mod.width = width
    mod.segments = segments
    mod.limit_method = 'ANGLE'

def build_helical_spring(location, radius=0.075, height=0.50, turns=6, wire_radius=0.012, mat=None):
    """Procedurally creates a coiled steel spring using a curve with bevel depth converted to mesh."""
    curve_data = bpy.data.curves.new(name="SpringCurve", type='CURVE')
    curve_data.dimensions = '3D'
    curve_data.bevel_depth = wire_radius
    curve_data.bevel_resolution = 4
    curve_data.use_fill_caps = True

    polyline = curve_data.splines.new('POLY')
    steps = int(turns * 28)
    polyline.points.add(steps - 1)

    for i in range(steps):
        t = i / float(steps)
        angle = t * turns * 2.0 * math.pi
        x = radius * math.cos(angle)
        y = radius * math.sin(angle)
        z = t * height
        polyline.points[i].co = (x, y, z, 1.0)

    spring_obj = bpy.data.objects.new("CoiledSpring", curve_data)
    bpy.context.scene.collection.objects.link(spring_obj)
    spring_obj.location = location
    spring_obj.rotation_euler = (math.radians(10), math.radians(-12), math.radians(18)) # Jaunty popped angle
    if mat:
        spring_obj.data.materials.append(mat)

    # Convert curve with bevel to real polygon mesh for flawless GLTF export
    bpy.context.view_layer.objects.active = spring_obj
    spring_obj.select_set(True)
    bpy.ops.object.convert(target='MESH')
    for poly in spring_obj.data.polygons:
        poly.use_smooth = True
    spring_obj.select_set(False)
    return spring_obj

def build_junkyard_couch(materials):
    couch_group = []

    # 1. Base Wooden Frame Feet (beveled)
    foot_coords = [(-0.95, -0.45), (0.95, -0.45), (-0.95, 0.45), (0.95, 0.45)]
    for idx, (fx, fy) in enumerate(foot_coords):
        bpy.ops.mesh.primitive_cube_add(size=0.1, location=(fx, fy, 0.05))
        foot = bpy.context.active_object
        foot.name = f"CouchFoot_{idx}"
        foot.scale = (0.9, 0.9, 1.0)
        apply_bevel_and_smooth(foot, width=0.015, segments=2)
        foot.data.materials.append(materials['wood'])
        couch_group.append(foot)

    # 2. Lower Base Chassis (Sturdy 80s heavy base)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0.22))
    base = bpy.context.active_object
    base.name = "CouchBase"
    base.scale = (1.95, 0.95, 0.22)
    apply_bevel_and_smooth(base, width=0.025, segments=3)
    base.data.materials.append(materials['couch_body'])
    couch_group.append(base)

    # 3. Backrest (Plush beveled cushion tilted slightly back)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0.38, 0.65))
    backrest = bpy.context.active_object
    backrest.name = "CouchBackrest"
    backrest.scale = (1.95, 0.22, 0.68)
    backrest.rotation_euler = (math.radians(-6), 0, 0)
    apply_bevel_and_smooth(backrest, width=0.04, segments=3)
    backrest.data.materials.append(materials['couch_cushion'])
    couch_group.append(backrest)

    # 4. Left and Right Armrests
    for sign, name in [(-1, "CouchArmLeft"), (1, "CouchArmRight")]:
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(sign * 0.98, 0.05, 0.52))
        arm = bpy.context.active_object
        arm.name = name
        arm.scale = (0.24, 0.92, 0.42)
        apply_bevel_and_smooth(arm, width=0.035, segments=3)
        arm.data.materials.append(materials['couch_body'])
        couch_group.append(arm)

    # 5. Left Seat Cushion (Depressed / Compressed from Red sitting on it)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-0.46, -0.05, 0.38))
    cushion_left = bpy.context.active_object
    cushion_left.name = "CushionSatUpon"
    cushion_left.scale = (0.84, 0.72, 0.16)
    cushion_left.rotation_euler = (math.radians(2), math.radians(2), 0)
    apply_bevel_and_smooth(cushion_left, width=0.035, segments=3)
    cushion_left.data.materials.append(materials['couch_cushion_worn'])
    couch_group.append(cushion_left)

    # 6. Right Seat Cushion (Torn with Spring bursting out)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.46, -0.05, 0.41))
    cushion_right = bpy.context.active_object
    cushion_right.name = "CushionRipped"
    cushion_right.scale = (0.84, 0.72, 0.20)
    apply_bevel_and_smooth(cushion_right, width=0.035, segments=3)
    cushion_right.data.materials.append(materials['couch_cushion'])
    couch_group.append(cushion_right)

    # 7. Ripped Hole Rim around the spring
    bpy.ops.mesh.primitive_cylinder_add(radius=0.14, depth=0.03, location=(0.50, -0.02, 0.52))
    tear_hole = bpy.context.active_object
    tear_hole.name = "RippedFabricHole"
    tear_hole.scale = (1.2, 0.9, 0.5)
    tear_hole.data.materials.append(materials['dark_void'])
    couch_group.append(tear_hole)

    # 8. Exposed Yellow Foam Padding Tuft bursting out around rip
    for f_idx, (fx, fy, fz, fs) in enumerate([(0.43, -0.06, 0.51, 0.05), (0.57, 0.03, 0.52, 0.04), (0.47, 0.07, 0.51, 0.045)]):
        bpy.ops.mesh.primitive_cube_add(size=fs, location=(fx, fy, fz))
        foam = bpy.context.active_object
        foam.name = f"FoamTuft_{f_idx}"
        foam.rotation_euler = (math.radians(15 * f_idx), math.radians(25), math.radians(10))
        apply_bevel_and_smooth(foam, width=0.01, segments=2)
        foam.data.materials.append(materials['couch_foam'])
        couch_group.append(foam)

    # 9. The Bursting Steel Suspension Spring!
    spring = build_helical_spring(location=(0.50, -0.02, 0.48), radius=0.075, height=0.50, turns=6, wire_radius=0.013, mat=materials['steel_spring'])
    couch_group.append(spring)

    return couch_group

def build_crt_television(materials, location=(1.45, -0.30, 0.65), yaw_deg=-35):
    """
    Builds an authentic 90s Cathode Ray Box CRT TV (Sony Trinitron style).
    All components built relative to the TV chassis and beveled for 90s CG aesthetics.
    """
    tv_group = []
    rad = math.radians(yaw_deg)

    # 1. Rusted Industrial Crate Stand
    bpy.ops.mesh.primitive_cube_add(size=0.6, location=(location[0], location[1], 0.30))
    crate = bpy.context.active_object
    crate.name = "TVStandCrate"
    crate.scale = (0.85, 0.85, 0.95)
    crate.rotation_euler = (0, 0, rad)
    apply_bevel_and_smooth(crate, width=0.02, segments=2)
    crate.data.materials.append(materials['rusted_iron'])
    tv_group.append(crate)

    # 2. CRT Main Chassis (Beveled chunky 90s dark plastic box)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=location)
    tv_box = bpy.context.active_object
    tv_box.name = "CRT_Chassis"
    tv_box.scale = (0.54, 0.48, 0.44)
    tv_box.rotation_euler = (0, 0, rad)
    apply_bevel_and_smooth(tv_box, width=0.03, segments=3)
    tv_box.data.materials.append(materials['tv_plastic'])
    tv_group.append(tv_box)

    # Helper to calculate world position offset relative to tv_box orientation
    # In local space: +X is right, -X is left, +Y is back, -Y is FRONT, +Z is up
    def local_to_world(lx, ly, lz):
        wx = location[0] + (lx * math.cos(rad) - ly * math.sin(rad))
        wy = location[1] + (lx * math.sin(rad) + ly * math.cos(rad))
        wz = location[2] + lz
        return (wx, wy, wz)

    # 3. Bulbous Curved 4:3 CRT Glass Screen (recessed on front face: local -Y)
    screen_pos = local_to_world(-0.06, -0.245, 0.01)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=screen_pos)
    screen = bpy.context.active_object
    screen.name = "CRT_Screen"
    screen.scale = (0.34, 0.03, 0.26) # 4:3 aspect ratio
    screen.rotation_euler = (0, 0, rad)
    apply_bevel_and_smooth(screen, width=0.03, segments=3)
    screen.data.materials.append(materials['tv_screen_glow'])
    tv_group.append(screen)

    # 4. Vertical Control Strip with Tuning Knobs & Power LED (to the right of screen: local +X)
    for k_idx, lz in enumerate([0.06, -0.04]):
        knob_pos = local_to_world(0.18, -0.245, lz)
        bpy.ops.mesh.primitive_cylinder_add(radius=0.028, depth=0.025, location=knob_pos)
        knob = bpy.context.active_object
        knob.name = f"CRT_Knob_{k_idx}"
        knob.rotation_euler = (math.radians(90), 0, rad)
        apply_bevel_and_smooth(knob, width=0.005, segments=2)
        knob.data.materials.append(materials['tv_knob'])
        tv_group.append(knob)

    # Power LED indicator
    led_pos = local_to_world(0.18, -0.245, -0.11)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.010, depth=0.015, location=led_pos)
    led = bpy.context.active_object
    led.name = "CRT_PowerLED"
    led.rotation_euler = (math.radians(90), 0, rad)
    led.data.materials.append(materials['tv_led_red'])
    tv_group.append(led)

    # 5. Rabbit-Ear Antennas (mounted at back top: local +Y, +Z)
    for ant_idx, (lx, angle_tilt) in enumerate([(-0.09, math.radians(-32)), (0.09, math.radians(28))]):
        ant_pos = local_to_world(lx, 0.12, 0.40)
        bpy.ops.mesh.primitive_cylinder_add(radius=0.006, depth=0.48, location=ant_pos)
        ant = bpy.context.active_object
        ant.name = f"Antenna_{ant_idx}"
        ant.rotation_euler = (math.radians(12), angle_tilt, rad)
        ant.data.materials.append(materials['chrome_metal'])
        tv_group.append(ant)

    # 6. Vivid Electric Cyan CRT Ambient Point Light (emitting outward from front face toward couch)
    light_pos = local_to_world(-0.06, -0.65, 0.05)
    light_data = bpy.data.lights.new(name="CRT_ScreenLight", type='POINT')
    light_data.energy = 60.0
    light_data.color = (0.25, 0.78, 1.0) # Electric cyan CRT hue
    light_obj = bpy.data.objects.new("CRT_ScreenLight", light_data)
    light_obj.location = light_pos
    bpy.context.scene.collection.objects.link(light_obj)

    return tv_group

def build_chain_oil_can_and_spill(materials, location=(-0.35, -0.65, 0.15)):
    can_group = []

    # 1. Main Tin Can Body (Classic Stamped Red Enamel)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.08, depth=0.22, location=location)
    body = bpy.context.active_object
    body.name = "OilCan_Body"
    apply_bevel_and_smooth(body, width=0.008, segments=2)
    body.data.materials.append(materials['oil_can_enamel'])
    can_group.append(body)

    # 2. Can Top Spout Cap
    bpy.ops.mesh.primitive_cylinder_add(radius=0.03, depth=0.05, location=(location[0], location[1], location[2] + 0.13))
    cap = bpy.context.active_object
    cap.name = "OilCan_Cap"
    apply_bevel_and_smooth(cap, width=0.004, segments=2)
    cap.data.materials.append(materials['copper_metal'])
    can_group.append(cap)

    # 3. Angled Pouring Spout
    bpy.ops.mesh.primitive_cylinder_add(radius=0.011, depth=0.18, location=(location[0] + 0.03, location[1] - 0.03, location[2] + 0.22))
    spout = bpy.context.active_object
    spout.name = "OilCan_Spout"
    spout.rotation_euler = (math.radians(-25), math.radians(25), 0)
    spout.data.materials.append(materials['copper_metal'])
    can_group.append(spout)

    # 4. Glossy Motor Oil Puddle on the Concrete Floor
    bpy.ops.mesh.primitive_cylinder_add(radius=0.26, depth=0.004, location=(location[0] + 0.08, location[1] + 0.05, 0.003))
    puddle = bpy.context.active_object
    puddle.name = "OilPuddle"
    puddle.scale = (1.4, 0.85, 1.0)
    puddle.rotation_euler = (0, 0, math.radians(35))
    for poly in puddle.data.polygons:
        poly.use_smooth = True
    puddle.data.materials.append(materials['oil_slick'])
    can_group.append(puddle)

    # 5. Dropped Mechanics Wrench on the floor
    bpy.ops.mesh.primitive_cube_add(size=0.03, location=(location[0] + 0.40, location[1] - 0.10, 0.015))
    wrench = bpy.context.active_object
    wrench.name = "MechanicWrench"
    wrench.scale = (0.7, 5.0, 0.3)
    wrench.rotation_euler = (0, 0, math.radians(-22))
    apply_bevel_and_smooth(wrench, width=0.004, segments=2)
    wrench.data.materials.append(materials['chrome_metal'])
    can_group.append(wrench)

    return can_group

def build_junkyard_backdrop(materials):
    # 1. Concrete / Dirty Steel Floor
    bpy.ops.mesh.primitive_plane_add(size=14.0, location=(0, 0, 0))
    floor = bpy.context.active_object
    floor.name = "JunkyardFloor"
    floor.data.materials.append(materials['floor_concrete'])

    # 2. Rear Corrugated Container Wall
    bpy.ops.mesh.primitive_plane_add(size=12.0, location=(0, 2.4, 2.8))
    wall_back = bpy.context.active_object
    wall_back.name = "ContainerBackWall"
    wall_back.rotation_euler = (math.radians(90), 0, 0)
    wall_back.scale = (1.4, 0.6, 1.0)
    wall_back.data.materials.append(materials['corrugated_rust'])

    # 3. Left Container Wall
    bpy.ops.mesh.primitive_plane_add(size=12.0, location=(-3.6, 0, 2.8))
    wall_left = bpy.context.active_object
    wall_left.name = "ContainerLeftWall"
    wall_left.rotation_euler = (math.radians(90), 0, math.radians(90))
    wall_left.scale = (1.4, 0.6, 1.0)
    wall_left.data.materials.append(materials['corrugated_rust'])

    # 4. Rusted 55-Gallon Burn Drum in the Corner
    bpy.ops.mesh.primitive_cylinder_add(radius=0.35, depth=1.0, location=(-2.4, 1.5, 0.50))
    drum = bpy.context.active_object
    drum.name = "BurnBarrel"
    apply_bevel_and_smooth(drum, width=0.02, segments=2)
    drum.data.materials.append(materials['rusted_iron'])

    # Burning Fire Glow inside barrel
    drum_light = bpy.data.lights.new(name="BarrelFireLight", type='POINT')
    drum_light.energy = 75.0
    drum_light.color = (1.0, 0.38, 0.05) # Intense orange ember
    drum_light_obj = bpy.data.objects.new("BarrelFireLight", drum_light)
    drum_light_obj.location = (-2.4, 1.5, 1.1)
    bpy.context.scene.collection.objects.link(drum_light_obj)

def setup_cinematic_lighting():
    # Warm Tungsten Overhead Work Light (shop bulb)
    shop_light = bpy.data.lights.new(name="WorkLight", type='POINT')
    shop_light.energy = 90.0
    shop_light.color = (1.0, 0.85, 0.70)
    shop_obj = bpy.data.objects.new("WorkLight", shop_light)
    shop_obj.location = (0.2, -0.6, 2.5)
    bpy.context.scene.collection.objects.link(shop_obj)

    # Cool Moonlit Rim Light (slanted from exterior container door)
    moon_sun = bpy.data.lights.new(name="MoonlightRim", type='SUN')
    moon_sun.energy = 1.6
    moon_sun.color = (0.45, 0.65, 1.0)
    moon_obj = bpy.data.objects.new("MoonlightRim", moon_sun)
    moon_obj.location = (4.0, -4.0, 5.0)
    moon_obj.rotation_euler = (math.radians(45), math.radians(20), math.radians(-35))
    bpy.context.scene.collection.objects.link(moon_obj)

def setup_camera():
    cam_data = bpy.data.cameras.new("DirectorCam")
    cam_data.lens = 30 # 30mm wide cinematic framing
    cam_data.sensor_width = 36
    cam_obj = bpy.data.objects.new("DirectorCam", cam_data)
    bpy.context.scene.collection.objects.link(cam_obj)
    bpy.context.scene.camera = cam_obj

    # Positioned for dynamic 3/4 low angle showcasing spring, couch, TV, and oil can
    cam_obj.location = (0.75, -3.10, 1.15)
    cam_obj.rotation_euler = (math.radians(76), 0, math.radians(14))

def render_verification_still(output_path):
    scene = bpy.context.scene
    scene.render.resolution_x = 1280
    scene.render.resolution_y = 720
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    scene.render.filepath = output_path

    # Eevee fast high-quality render
    scene.render.engine = 'BLENDER_EEVEE'

    print(f"[Forge] Rendering verification still to {output_path}...")
    bpy.ops.render.render(write_still=True)
    print("[Forge] Verification render complete!")

def export_glb(output_path):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    print(f"[Forge] Exporting GLB to {output_path}...")
    bpy.ops.export_scene.gltf(
        filepath=output_path,
        export_format='GLB',
        use_selection=False,
        export_yup=True
    )
    print("[Forge] GLB export complete!")

def main():
    print("[Forge] === INITIATING BESPOKE JUNKYARD ASSET FORGE v2 ===")
    reset_scene()

    # Materials Palette (90s Industrial Comic-Noir)
    materials = {
        'couch_body': create_material("Mat_CouchBody", (0.16, 0.18, 0.15, 1.0), roughness=0.75, metalness=0.05),
        'couch_cushion': create_material("Mat_CouchCushion", (0.24, 0.22, 0.18, 1.0), roughness=0.85, metalness=0.0),
        'couch_cushion_worn': create_material("Mat_CouchWorn", (0.18, 0.15, 0.12, 1.0), roughness=0.92, metalness=0.0),
        'couch_foam': create_material("Mat_CouchFoam", (0.85, 0.72, 0.35, 1.0), roughness=0.95, metalness=0.0),
        'steel_spring': create_material("Mat_SteelSpring", (0.75, 0.78, 0.82, 1.0), roughness=0.22, metalness=0.95),
        'wood': create_material("Mat_FootWood", (0.20, 0.12, 0.08, 1.0), roughness=0.8, metalness=0.0),
        'dark_void': create_material("Mat_TornVoid", (0.02, 0.02, 0.02, 1.0), roughness=0.95, metalness=0.0),

        'tv_plastic': create_material("Mat_TVPlastic", (0.07, 0.08, 0.09, 1.0), roughness=0.45, metalness=0.2),
        'tv_screen_glow': create_material("Mat_TVScreen", (0.35, 0.82, 1.0, 1.0), roughness=0.08, metalness=0.1, emission_color=(0.35, 0.85, 1.0, 1.0), emission_strength=5.5),
        'tv_knob': create_material("Mat_TVKnob", (0.15, 0.15, 0.15, 1.0), roughness=0.3, metalness=0.6),
        'tv_led_red': create_material("Mat_TVLEDRed", (0.9, 0.1, 0.1, 1.0), roughness=0.2, emission_color=(1.0, 0.05, 0.05, 1.0), emission_strength=3.0),
        'chrome_metal': create_material("Mat_Chrome", (0.9, 0.92, 0.95, 1.0), roughness=0.15, metalness=0.98),
        'copper_metal': create_material("Mat_Copper", (0.85, 0.45, 0.25, 1.0), roughness=0.3, metalness=0.85),
        'oil_can_enamel': create_material("Mat_OilCan", (0.85, 0.12, 0.12, 1.0), roughness=0.35, metalness=0.3),
        'oil_slick': create_material("Mat_OilSlick", (0.02, 0.02, 0.02, 1.0), roughness=0.04, metalness=0.92),

        'floor_concrete': create_material("Mat_Floor", (0.10, 0.11, 0.12, 1.0), roughness=0.8, metalness=0.15),
        'corrugated_rust': create_material("Mat_RustWall", (0.22, 0.14, 0.10, 1.0), roughness=0.7, metalness=0.4),
        'rusted_iron': create_material("Mat_RustedIron", (0.18, 0.12, 0.09, 1.0), roughness=0.65, metalness=0.6)
    }

    # Build Scene Props
    build_junkyard_couch(materials)
    build_crt_television(materials, location=(1.45, -0.30, 0.65), yaw_deg=-35)
    build_chain_oil_can_and_spill(materials)
    build_junkyard_backdrop(materials)

    # Lighting & Camera
    setup_cinematic_lighting()
    setup_camera()

    # Targets
    glb_out = os.path.abspath("apps/web/public/models/junkyard_hideout_vignette.glb")
    render_out = os.path.abspath("temp_junkyard_vignette.png")

    export_glb(glb_out)
    render_verification_still(render_out)
    print(f"[Forge] SUCCESS: GLB saved to {glb_out}")
    print(f"[Forge] SUCCESS: Render still saved to {render_out}")

if __name__ == "__main__":
    main()
