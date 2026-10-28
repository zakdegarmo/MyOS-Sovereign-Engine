"""
Sovereign Engine: Headless Blender GLB Baker for Chrono-Hyperdrive Craft
Creates a high-performance, stylized anti-gravity racer and exports to GLB.
"""

import bpy
import bmesh
import math
import os

WORKSPACE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
OUTPUT_GLB = os.path.join(WORKSPACE_ROOT, "apps/web/public/models/chrono_pulse_craft.glb")

# Reset Blender to clean slate
bpy.ops.wm.read_factory_settings(use_empty=True)

# 1. Create Materials
def create_mat(name, base_color, metallic=0.0, roughness=0.5, emissive_color=None, emissive_strength=1.0):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    bsdf = nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs['Base Color'].default_value = base_color
        bsdf.inputs['Metallic'].default_value = metallic
        bsdf.inputs['Roughness'].default_value = roughness
        if emissive_color:
            # Blender 4+ Principled BSDF has 'Emission Color' and 'Emission Strength'
            if 'Emission Color' in bsdf.inputs:
                bsdf.inputs['Emission Color'].default_value = emissive_color
                bsdf.inputs['Emission Strength'].default_value = emissive_strength
            elif 'Emission' in bsdf.inputs:
                bsdf.inputs['Emission'].default_value = emissive_color
    return mat

hull_mat = create_mat("CraftHull", (0.05, 0.08, 0.15, 1.0), metallic=0.92, roughness=0.22)
canopy_mat = create_mat("CraftCanopy", (0.1, 0.6, 0.9, 1.0), metallic=0.1, roughness=0.05, emissive_color=(0.2, 0.7, 1.0, 1.0), emissive_strength=2.5)
trim_mat = create_mat("CraftTrim", (0.6, 0.1, 0.9, 1.0), metallic=0.5, roughness=0.3, emissive_color=(0.75, 0.2, 1.0, 1.0), emissive_strength=3.0)
engine_mat = create_mat("CraftThruster", (0.2, 0.9, 1.0, 1.0), metallic=0.0, roughness=0.1, emissive_color=(0.2, 0.9, 1.0, 1.0), emissive_strength=6.0)

# 2. Build Fuselage Mesh
mesh = bpy.data.meshes.new("ChronoCraftMesh")
obj = bpy.data.objects.new("ChronoCraft", mesh)
bpy.context.collection.objects.link(obj)

bm = bmesh.new()

# Craft dimensions:
# Forward is -Y in standard Three.js import, or -Z. Let's orient forward as -Z, Up as +Y, Right as +X.
# Nose: (0, 0.1, -1.8)
# Cockpit: (0, 0.45, -0.6)
# Tail center: (0, 0.2, 1.2)
# Wingtips: (-1.6, 0.1, 0.8) and (1.6, 0.1, 0.8)

def to_b(x, y, z):
    # Converts Three.js coordinates (X: right, Y: up, Z: back, -Z: forward)
    # to Blender native coordinates (X: right, Y: forward, Z: up)
    return (x, -z, y)

# Center fuselage vertices
v_nose = bm.verts.new(to_b(0.0, 0.05, -2.1))
v_nose_top = bm.verts.new(to_b(0.0, 0.25, -1.6))
v_cockpit_top = bm.verts.new(to_b(0.0, 0.55, -0.4))
v_spine_mid = bm.verts.new(to_b(0.0, 0.45, 0.5))
v_spine_tail = bm.verts.new(to_b(0.0, 0.35, 1.3))

v_belly_nose = bm.verts.new(to_b(0.0, -0.15, -1.5))
v_belly_mid = bm.verts.new(to_b(0.0, -0.22, 0.2))
v_belly_tail = bm.verts.new(to_b(0.0, -0.15, 1.3))

# Left side vertices
v_l_nose_rim = bm.verts.new(to_b(-0.2, 0.1, -1.5))
v_l_canopy_rim = bm.verts.new(to_b(-0.35, 0.3, -0.4))
v_l_shoulder = bm.verts.new(to_b(-0.55, 0.25, 0.4))
v_l_tail_rim = bm.verts.new(to_b(-0.4, 0.2, 1.3))
v_l_wing_root = bm.verts.new(to_b(-0.55, 0.1, 0.2))
v_l_wing_tip = bm.verts.new(to_b(-1.85, 0.05, 0.9))
v_l_wing_trail = bm.verts.new(to_b(-0.8, 0.08, 1.25))

# Right side vertices
v_r_nose_rim = bm.verts.new(to_b(0.2, 0.1, -1.5))
v_r_canopy_rim = bm.verts.new(to_b(0.35, 0.3, -0.4))
v_r_shoulder = bm.verts.new(to_b(0.55, 0.25, 0.4))
v_r_tail_rim = bm.verts.new(to_b(0.4, 0.2, 1.3))
v_r_wing_root = bm.verts.new(to_b(0.55, 0.1, 0.2))
v_r_wing_tip = bm.verts.new(to_b(1.85, 0.05, 0.9))
v_r_wing_trail = bm.verts.new(to_b(0.8, 0.08, 1.25))

# Upper faces
f_nose_l = bm.faces.new((v_nose, v_nose_top, v_l_nose_rim))
f_nose_r = bm.faces.new((v_nose, v_r_nose_rim, v_nose_top))

f_canopy_l = bm.faces.new((v_nose_top, v_cockpit_top, v_l_canopy_rim, v_l_nose_rim))
f_canopy_r = bm.faces.new((v_nose_top, v_r_nose_rim, v_r_canopy_rim, v_cockpit_top))

f_spine_l = bm.faces.new((v_cockpit_top, v_spine_mid, v_l_shoulder, v_l_canopy_rim))
f_spine_r = bm.faces.new((v_cockpit_top, v_r_canopy_rim, v_r_shoulder, v_spine_mid))

f_tail_l = bm.faces.new((v_spine_mid, v_spine_tail, v_l_tail_rim, v_l_shoulder))
f_tail_r = bm.faces.new((v_spine_mid, v_r_shoulder, v_r_tail_rim, v_spine_tail))

# Wings
f_wing_l = bm.faces.new((v_l_canopy_rim, v_l_shoulder, v_l_wing_tip))
f_wing_l2 = bm.faces.new((v_l_shoulder, v_l_wing_trail, v_l_wing_tip))
f_wing_r = bm.faces.new((v_r_canopy_rim, v_r_wing_tip, v_r_shoulder))
f_wing_r2 = bm.faces.new((v_r_shoulder, v_r_wing_tip, v_r_wing_trail))

# Lower belly faces
f_belly_nl = bm.faces.new((v_nose, v_l_nose_rim, v_belly_nose))
f_belly_nr = bm.faces.new((v_nose, v_belly_nose, v_r_nose_rim))

f_belly_mid_l = bm.faces.new((v_belly_nose, v_l_nose_rim, v_l_wing_trail, v_belly_mid))
f_belly_mid_r = bm.faces.new((v_belly_nose, v_belly_mid, v_r_wing_trail, v_r_nose_rim))

f_belly_tail_l = bm.faces.new((v_belly_mid, v_l_wing_trail, v_l_tail_rim, v_belly_tail))
f_belly_tail_r = bm.faces.new((v_belly_mid, v_belly_tail, v_r_tail_rim, v_r_wing_trail))

# Rear thruster bulkhead
f_rear = bm.faces.new((v_spine_tail, v_l_tail_rim, v_belly_tail, v_r_tail_rim))

# Assign material indices
f_canopy_l.material_index = 1
f_canopy_r.material_index = 1
f_wing_l.material_index = 2
f_wing_l2.material_index = 2
f_wing_r.material_index = 2
f_wing_r2.material_index = 2

bm.to_mesh(mesh)
bm.free()

obj.data.materials.append(hull_mat)
obj.data.materials.append(canopy_mat)
obj.data.materials.append(trim_mat)
obj.data.materials.append(engine_mat)

# 3. Add Dual Engine Plasma Cones (Exhaust pointing rearwards along -Y in Blender, which exports to +Z in glTF)
bpy.ops.mesh.primitive_cone_add(vertices=16, radius1=0.28, radius2=0.18, depth=0.45, location=to_b(-0.35, 0.1, 1.45), rotation=(-math.pi/2, 0, 0))
engine_l = bpy.context.active_object
engine_l.name = "EngineLeft"
engine_l.data.materials.append(engine_mat)

bpy.ops.mesh.primitive_cone_add(vertices=16, radius1=0.28, radius2=0.18, depth=0.45, location=to_b(0.35, 0.1, 1.45), rotation=(-math.pi/2, 0, 0))
engine_r = bpy.context.active_object
engine_r.name = "EngineRight"
engine_r.data.materials.append(engine_mat)

# 4. Add Dual Canting Tail Fins
bpy.ops.mesh.primitive_cube_add(size=1.0, location=to_b(-0.4, 0.45, 1.05), rotation=(0, -0.28, 0))
fin_l = bpy.context.active_object
fin_l.scale = (0.04, 0.35, 0.45)
fin_l.name = "FinLeft"
fin_l.data.materials.append(trim_mat)

bpy.ops.mesh.primitive_cube_add(size=1.0, location=to_b(0.4, 0.45, 1.05), rotation=(0, 0.28, 0))
fin_r = bpy.context.active_object
fin_r.scale = (0.04, 0.35, 0.45)
fin_r.name = "FinRight"
fin_r.data.materials.append(trim_mat)

# Select all craft parts and join into single sovereign asset
bpy.ops.object.select_all(action='DESELECT')
for o in [obj, engine_l, engine_r, fin_l, fin_r]:
    o.select_set(True)
bpy.context.view_layer.objects.active = obj
bpy.ops.object.join()
obj.name = "SovereignPulseCraft"

# Ensure smooth shading
for f in obj.data.polygons:
    f.use_smooth = True

# Export clean GLB
bpy.ops.export_scene.gltf(
    filepath=OUTPUT_GLB,
    export_format='GLB',
    use_selection=True,
    export_apply=True
)

print(f"SUCCESS: Baked Chrono-Hyperdrive Craft to {OUTPUT_GLB}")
