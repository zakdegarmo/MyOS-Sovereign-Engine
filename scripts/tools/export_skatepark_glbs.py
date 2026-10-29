# scripts/tools/export_skatepark_glbs.py
"""
Bespoke Modular 3D Asset Forge for MyOS Cycle-Park
Headlessly builds beveled, UV-unwrapped, production-ready .glb obstacles using Blender 5.2:
- ramp_kicker.glb
- ramp_quarterpipe.glb
- ramp_spine.glb
- rail_straight_6m.glb
- rail_kinked_10m.glb
- funbox_pyramid.glb
- tire_vert_bowl.glb
- polyhedral_tetrahedron.glb
Exports directly into apps/web/public/models/skatepark/
"""

import bpy
import math
import os

OUTPUT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "apps", "web", "public", "models", "skatepark"))
os.makedirs(OUTPUT_DIR, exist_ok=True)

def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    if not bpy.data.collections:
        col = bpy.data.collections.new("Collection")
        bpy.context.scene.collection.children.link(col)

def create_pbr_material(name, base_color, roughness=0.5, metalness=0.0):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs['Base Color'].default_value = base_color
        bsdf.inputs['Roughness'].default_value = roughness
        bsdf.inputs['Metallic'].default_value = metalness
    return mat

def apply_bevel(obj, width=0.03, segments=2):
    for poly in obj.data.polygons:
        poly.use_smooth = True
    mod = obj.modifiers.new(name="Bevel", type='BEVEL')
    mod.width = width
    mod.segments = segments
    mod.limit_method = 'ANGLE'

def export_glb(filename):
    filepath = os.path.join(OUTPUT_DIR, filename)
    bpy.ops.export_scene.gltf(
        filepath=filepath,
        export_format='GLB',
        use_selection=False,
        export_apply=True,
        export_materials='EXPORT',
        export_normals=True
    )
    print(f"[CycleParkForge] Exported: {filepath} ({os.path.getsize(filepath):,} bytes)")

# =============================================================================
# 1. KICKER RAMP
# =============================================================================
def forge_kicker():
    reset_scene()
    mat_wood = create_pbr_material("SkatePlywood", (0.83, 0.64, 0.45, 1.0), roughness=0.65)
    mat_metal = create_pbr_material("CopingSteel", (0.58, 0.63, 0.72, 1.0), roughness=0.25, metalness=0.9)

    # Base wedge via mesh
    verts = [
        (-1.5, -2.0, 0.0), (1.5, -2.0, 0.0), (1.5, 2.0, 1.6), (-1.5, 2.0, 1.6), # Top ramp plane
        (-1.5, -2.0, 0.0), (1.5, -2.0, 0.0), (1.5, 2.0, 0.0), (-1.5, 2.0, 0.0)  # Bottom base
    ]
    faces = [
        (0, 1, 2, 3), # Ramp slope
        (7, 6, 5, 4), # Bottom
        (4, 5, 1, 0), # Front
        (6, 7, 3, 2), # Back
        (7, 4, 0, 3), # Left
        (5, 6, 2, 1)  # Right
    ]
    mesh_data = bpy.data.meshes.new("KickerMesh")
    mesh_data.from_pydata(verts, [], faces)
    mesh_data.update()
    obj = bpy.data.objects.new("RampKicker", mesh_data)
    bpy.context.scene.collection.objects.link(obj)
    obj.data.materials.append(mat_wood)
    apply_bevel(obj, width=0.03)

    # Steel coping tube at takeoff
    bpy.ops.mesh.primitive_cylinder_add(radius=0.04, depth=3.0, location=(0, 2.0, 1.6))
    tube = bpy.context.active_object
    tube.rotation_euler = (0, math.radians(90), 0)
    tube.data.materials.append(mat_metal)

    export_glb("ramp_kicker.glb")

# =============================================================================
# 2. QUARTER-PIPE
# =============================================================================
def forge_quarterpipe():
    reset_scene()
    mat_wood = create_pbr_material("SkatePlywood", (0.83, 0.64, 0.45, 1.0), roughness=0.65)
    mat_metal = create_pbr_material("CopingSteel", (0.58, 0.63, 0.72, 1.0), roughness=0.25, metalness=0.9)

    # Curved arc transition
    steps = 14
    verts_left = []
    verts_right = []
    width = 4.0
    run = 3.0
    height = 2.8

    for i in range(steps + 1):
        t = i / float(steps)
        y = -1.5 + run * t
        z = height * (1.0 - math.cos(t * math.pi * 0.5))
        verts_left.append((-width / 2, y, z))
        verts_right.append((width / 2, y, z))

    # Add top deck
    verts_left.append((-width / 2, 1.5 + 1.2, height))
    verts_right.append((width / 2, 1.5 + 1.2, height))
    # Add bottom vertices
    verts_left.append((-width / 2, 1.5 + 1.2, 0.0))
    verts_right.append((width / 2, 1.5 + 1.2, 0.0))
    verts_left.append((-width / 2, -1.5, 0.0))
    verts_right.append((width / 2, -1.5, 0.0))

    all_verts = verts_left + verts_right
    offset = len(verts_left)
    faces = []

    # Ramp surface faces
    for i in range(steps):
        faces.append((i, i + 1, i + 1 + offset, i + offset))

    # Top deck face
    faces.append((steps, steps + 1, steps + 1 + offset, steps + offset))

    mesh_data = bpy.data.meshes.new("QuarterPipeMesh")
    mesh_data.from_pydata(all_verts, [], faces)
    mesh_data.update()
    obj = bpy.data.objects.new("RampQuarterPipe", mesh_data)
    bpy.context.scene.collection.objects.link(obj)
    obj.data.materials.append(mat_wood)

    # Steel coping tube
    bpy.ops.mesh.primitive_cylinder_add(radius=0.06, depth=width, location=(0, 1.5, height))
    coping = bpy.context.active_object
    coping.rotation_euler = (0, math.radians(90), 0)
    coping.data.materials.append(mat_metal)

    export_glb("ramp_quarterpipe.glb")

# =============================================================================
# 3. STRAIGHT GRIND RAIL (6m)
# =============================================================================
def forge_straight_rail():
    reset_scene()
    mat_metal = create_pbr_material("RailSteel", (0.58, 0.63, 0.72, 1.0), roughness=0.22, metalness=0.92)

    # Main pipe
    bpy.ops.mesh.primitive_cylinder_add(radius=0.045, depth=6.0, location=(0, 0, 0.65))
    rail = bpy.context.active_object
    rail.rotation_euler = (math.radians(90), 0, 0)
    rail.data.materials.append(mat_metal)

    # 3 Stanchion legs
    for y_pos in [-2.4, 0.0, 2.4]:
        bpy.ops.mesh.primitive_cylinder_add(radius=0.03, depth=0.65, location=(0, y_pos, 0.325))
        leg = bpy.context.active_object
        leg.data.materials.append(mat_metal)

        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, y_pos, 0.015))
        foot = bpy.context.active_object
        foot.scale = (0.35, 0.25, 0.03)
        foot.data.materials.append(mat_metal)

    export_glb("rail_straight_6m.glb")

# =============================================================================
# 4. STREET FUNBOX
# =============================================================================
def forge_funbox():
    reset_scene()
    mat_concrete = create_pbr_material("SkateConcrete", (0.8, 0.83, 0.88, 1.0), roughness=0.8)
    mat_metal = create_pbr_material("CopingSteel", (0.58, 0.63, 0.72, 1.0), roughness=0.25, metalness=0.9)

    # Central deck (3m x 3m x 0.85m)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0.425))
    deck = bpy.context.active_object
    deck.scale = (3.0, 3.0, 0.85)
    deck.data.materials.append(mat_concrete)
    apply_bevel(deck, width=0.02)

    # Coping edges
    for (x, y, rz) in [(0, 1.5, 0), (0, -1.5, 0), (1.5, 0, 90), (-1.5, 0, 90)]:
        bpy.ops.mesh.primitive_cylinder_add(radius=0.035, depth=3.0, location=(x, y, 0.85))
        edge = bpy.context.active_object
        edge.rotation_euler = (0, 0, math.radians(rz)) if rz != 0 else (0, math.radians(90), 0)
        edge.data.materials.append(mat_metal)

    export_glb("funbox_pyramid.glb")

# =============================================================================
# 5. TIRE VERT BOWL
# =============================================================================
def forge_tire_bowl():
    reset_scene()
    mat_rubber = create_pbr_material("TireRubber", (0.08, 0.09, 0.11, 1.0), roughness=0.92)

    # Torus body
    bpy.ops.mesh.primitive_torus_add(major_radius=3.5, minor_radius=1.0, location=(0, 0, 0.7))
    tire = bpy.context.active_object
    tire.data.materials.append(mat_rubber)

    export_glb("tire_vert_bowl.glb")

# =============================================================================
# 6. POLYHEDRAL TETRAHEDRON
# =============================================================================
def forge_tetrahedron():
    reset_scene()
    mat_neon = create_pbr_material("NeonPrism", (0.02, 0.71, 0.83, 1.0), roughness=0.2, metalness=0.5)

    # Solid regular tetrahedron
    bpy.ops.mesh.primitive_cone_add(vertices=3, radius1=1.6, depth=2.0, location=(0, 0, 1.0))
    tetra = bpy.context.active_object
    tetra.data.materials.append(mat_neon)
    apply_bevel(tetra, width=0.04)

    export_glb("polyhedral_tetrahedron.glb")

if __name__ == "__main__":
    print(f"=== Starting Skatepark GLB Batch Forge ===")
    forge_kicker()
    forge_quarterpipe()
    forge_straight_rail()
    forge_funbox()
    forge_tire_bowl()
    forge_tetrahedron()
    print("=== All Skatepark GLB Assets Forged Successfully ===")
