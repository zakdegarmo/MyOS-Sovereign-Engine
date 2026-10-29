#!/usr/bin/env python3
"""
MyOS Autonomous 3D Animation Studio: Deterministic Headless Blender Filming Engine
Ingests production_manifest.json and deterministically configures:
- 3D set & procedural terrain (cliff plateau, arena, dungeon corridor)
- Cyclorama sky backdrop with emission gradient
- 3-point Sun lighting rig (Key, Rim, Fill)
- Character staging, duplication, and cel chiaroscuro skin shaders + inverted hull ink outlines
- Bone socket weapon/equipment binding (Hand.R_Socket, etc.)
- Multi-shot kinematic bone posing and keyframing
- Cinematic camera choreography (dollies, cranes, cuts, explicit lens keyframing)
- Headless EEVEE rendering to temp_studio_frames/frame_####.png
"""

import os
import sys
import math
import json
import glob
import bpy
import bmesh

WORKSPACE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
DEFAULT_MANIFEST = os.path.join(WORKSPACE_ROOT, "temp_studio_frames", "production_manifest.json")
CANONICAL_MANIFEST = os.path.join(WORKSPACE_ROOT, "scripts", "tools", "manifest_crimson_zenith.json")
FRAMES_DIR = os.path.join(WORKSPACE_ROOT, "temp_studio_frames")
SCREENINGS_DIR = os.path.join(WORKSPACE_ROOT, "apps", "web", "public", "screenings")

os.makedirs(FRAMES_DIR, exist_ok=True)
os.makedirs(SCREENINGS_DIR, exist_ok=True)

BONE_MAP = {
    "arm.R": "RightArm", "forearm.R": "RightForeArm", "hand.R": "RightHand",
    "arm.L": "LeftArm", "forearm.L": "LeftForeArm", "hand.L": "LeftHand",
    "thigh.R": "RightUpLeg", "shin.R": "RightLeg", "foot.R": "RightFoot",
    "thigh.L": "LeftUpLeg", "shin.L": "LeftLeg", "foot.L": "LeftFoot",
    "spine": "Spine", "chest": "Spine01", "neck": "neck", "head": "Head"
}


def parse_arguments():
    """Parses Blender CLI arguments after the '--' separator."""
    manifest_path = None
    args = sys.argv
    if "--" in args:
        user_args = args[args.index("--") + 1:]
        for i, a in enumerate(user_args):
            if a == "--manifest" and i + 1 < len(user_args):
                manifest_path = user_args[i + 1]

    if not manifest_path or not os.path.isfile(manifest_path):
        if os.path.isfile(DEFAULT_MANIFEST):
            manifest_path = DEFAULT_MANIFEST
        elif os.path.isfile(CANONICAL_MANIFEST):
            manifest_path = CANONICAL_MANIFEST
        else:
            raise FileNotFoundError("No valid production manifest found on disk.")

    return os.path.abspath(manifest_path)


def load_manifest(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def make_cel_material(name, base_rgba, shadow_rgba, rim_rgba=(1.0, 0.3, 0.5, 1.0)):
    """Creates a 3-stop constant cel shader with Diffuse -> ShaderToRGB -> ColorRamp -> Emission."""
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    diff = nodes.new('ShaderNodeBsdfDiffuse')
    diff.inputs['Color'].default_value = (1.0, 1.0, 1.0, 1.0)
    diff.inputs['Roughness'].default_value = 0.1

    s2rgb = nodes.new('ShaderNodeShaderToRGB')
    ramp = nodes.new('ShaderNodeValToRGB')
    ramp.color_ramp.interpolation = 'CONSTANT'

    while len(ramp.color_ramp.elements) > 1:
        ramp.color_ramp.elements.remove(ramp.color_ramp.elements[-1])

    e0 = ramp.color_ramp.elements[0]
    e0.position = 0.0
    e0.color = tuple(shadow_rgba)

    e1 = ramp.color_ramp.elements.new(0.35)
    e1.color = tuple(base_rgba)

    e2 = ramp.color_ramp.elements.new(0.75)
    e2.color = tuple(rim_rgba)

    emit = nodes.new('ShaderNodeEmission')
    out = nodes.new('ShaderNodeOutputMaterial')

    links.new(diff.outputs['BSDF'], s2rgb.inputs['Shader'])
    links.new(s2rgb.outputs['Color'], ramp.inputs['Fac'])
    links.new(ramp.outputs['Color'], emit.inputs['Color'])
    links.new(emit.outputs['Emission'], out.inputs['Surface'])
    return mat


def get_or_create_outline_material():
    """Gets or creates the inverted hull black ink outline material."""
    mat_name = "LPC_Outline_Mat"
    mat = bpy.data.materials.get(mat_name)
    if not mat:
        mat = bpy.data.materials.new(name=mat_name)
        mat.use_nodes = True
        nodes = mat.node_tree.nodes
        links = mat.node_tree.links
        nodes.clear()
        emit = nodes.new('ShaderNodeEmission')
        emit.inputs['Color'].default_value = (0.0, 0.0, 0.0, 1.0)
        out = nodes.new('ShaderNodeOutputMaterial')
        links.new(emit.outputs['Emission'], out.inputs['Surface'])
    mat.use_backface_culling = True
    return mat


def apply_ink_outline(obj, outline_mat):
    """Applies Solidify inverted hull outline modifier to a mesh object."""
    if outline_mat.name not in [m.name for m in obj.data.materials if m]:
        obj.data.materials.append(outline_mat)
    outline_idx = [m.name for m in obj.data.materials if m].index(outline_mat.name)

    mod = obj.modifiers.get("LPC_Ink_Outline")
    if not mod:
        mod = obj.modifiers.new(name="LPC_Ink_Outline", type='SOLIDIFY')
    mod.thickness = -0.008
    mod.offset = 0.0
    mod.use_flip_normals = True
    mod.material_offset = outline_idx


def build_terrain(terrain_cfg):
    """Procedurally generates the terrain set based on manifest specifications."""
    t_type = terrain_cfg.get("type", "cliff_plateau")
    dims = terrain_cfg.get("dimensions", [12.0, 8.0, 15.0])
    w, d, h = dims[0], dims[1], dims[2]

    mat_cfg = terrain_cfg.get("material", {})
    mat_name = mat_cfg.get("name", "Terrain_Material")
    base_rgba = mat_cfg.get("base_rgba", [0.35, 0.25, 0.22, 1.0])
    shadow_rgba = mat_cfg.get("shadow_rgba", [0.12, 0.08, 0.15, 1.0])
    rim_rgba = mat_cfg.get("rim_rgba", [0.8, 0.3, 0.1, 1.0])
    mat_terrain = make_cel_material(mat_name, base_rgba, shadow_rgba, rim_rgba)

    mesh_terrain = bpy.data.meshes.new(f"{t_type}_Mesh")
    obj_terrain = bpy.data.objects.new(f"Terrain_{t_type}", mesh_terrain)
    bpy.context.scene.collection.objects.link(obj_terrain)

    bm = bmesh.new()

    if t_type == "cliff_plateau":
        hw = w / 2.0
        # Plateau top
        v1 = bm.verts.new((-hw, -d / 2.0, 0.0))
        v2 = bm.verts.new(( hw, -d / 2.0, 0.0))
        v3 = bm.verts.new(( hw,  d / 2.0, 0.0))
        v4 = bm.verts.new((-hw,  d / 2.0, 0.0))
        bm.faces.new((v1, v2, v3, v4))

        # Sheer cliff drop face in front (-Y)
        v1_b = bm.verts.new((-hw, -d / 2.0, -h))
        v2_b = bm.verts.new(( hw, -d / 2.0, -h))
        bm.faces.new((v1_b, v2_b, v2, v1))

        # Left drop face (-X)
        v4_b = bm.verts.new((-hw, d / 2.0, -h))
        bm.faces.new((v4_b, v1_b, v1, v4))

        # Right drop face (+X)
        v3_b = bm.verts.new((hw, d / 2.0, -h))
        bm.faces.new((v2_b, v3_b, v3, v2))

        bmesh.ops.subdivide_edges(bm, edges=list(bm.edges), cuts=4, use_grid_fill=True)
        for v in bm.verts:
            if v.co.z == 0.0:
                v.co.z += math.sin(v.co.x * 1.5) * 0.15 + math.cos(v.co.y * 1.8) * 0.12
            elif v.co.z < 0:
                v.co.y += math.sin(v.co.z * 0.8) * 0.35 + math.cos(v.co.x * 1.2) * 0.2

    elif t_type == "arena":
        # Octagonal combat ring
        segments = 16
        radius = max(w, d) / 2.0
        center_v = bm.verts.new((0, 0, 0))
        ring_verts = []
        for i in range(segments):
            angle = (2 * math.pi * i) / segments
            rx = radius * math.cos(angle)
            ry = radius * math.sin(angle)
            ring_verts.append(bm.verts.new((rx, ry, 0)))
        for i in range(segments):
            next_i = (i + 1) % segments
            bm.faces.new((center_v, ring_verts[i], ring_verts[next_i]))

        # Raised border wall
        for i in range(segments):
            next_i = (i + 1) % segments
            v_a = ring_verts[i]
            v_b = ring_verts[next_i]
            v_a_up = bm.verts.new((v_a.co.x * 1.05, v_a.co.y * 1.05, 0.4))
            v_b_up = bm.verts.new((v_b.co.x * 1.05, v_b.co.y * 1.05, 0.4))
            bm.faces.new((v_a, v_b, v_b_up, v_a_up))

    else:
        # Default flat ground plane with subtle noise
        hw = w / 2.0
        hd = d / 2.0
        v1 = bm.verts.new((-hw, -hd, 0.0))
        v2 = bm.verts.new(( hw, -hd, 0.0))
        v3 = bm.verts.new(( hw,  hd, 0.0))
        v4 = bm.verts.new((-hw,  hd, 0.0))
        bm.faces.new((v1, v2, v3, v4))
        bmesh.ops.subdivide_edges(bm, edges=list(bm.edges), cuts=4, use_grid_fill=True)

    bm.to_mesh(mesh_terrain)
    bm.free()
    obj_terrain.data.materials.append(mat_terrain)
    return obj_terrain


def build_backdrop(backdrop_cfg):
    """Procedurally creates a vertical emission cyclorama backdrop with custom color gradient."""
    b_type = backdrop_cfg.get("type", "cyclorama_gradient")
    emission_str = backdrop_cfg.get("emission_strength", 1.8)
    stops = backdrop_cfg.get("gradient_stops", [
        {"position": 0.0, "color_rgba": [1.0, 0.45, 0.05, 1.0]},
        {"position": 0.4, "color_rgba": [0.75, 0.08, 0.18, 1.0]},
        {"position": 1.0, "color_rgba": [0.06, 0.04, 0.18, 1.0]}
    ])

    mesh_sky = bpy.data.meshes.new("Sky_Cyclorama_Mesh")
    obj_sky = bpy.data.objects.new("Sky_Cyclorama", mesh_sky)
    bpy.context.scene.collection.objects.link(obj_sky)

    bm_sky = bmesh.new()
    sv1 = bm_sky.verts.new((-25.0, 12.0, -12.0))
    sv2 = bm_sky.verts.new(( 25.0, 12.0, -12.0))
    sv3 = bm_sky.verts.new(( 25.0, 12.0,  18.0))
    sv4 = bm_sky.verts.new((-25.0, 12.0,  18.0))
    bm_sky.faces.new((sv1, sv2, sv3, sv4))
    bm_sky.to_mesh(mesh_sky)
    bm_sky.free()

    mat_sky = bpy.data.materials.new("Studio_Sky_Gradient")
    mat_sky.use_nodes = True
    nodes = mat_sky.node_tree.nodes
    links = mat_sky.node_tree.links
    nodes.clear()

    tex_coord = nodes.new('ShaderNodeTexCoord')
    separate_xyz = nodes.new('ShaderNodeSeparateXYZ')
    color_ramp = nodes.new('ShaderNodeValToRGB')
    color_ramp.color_ramp.interpolation = 'EASE'

    while len(color_ramp.color_ramp.elements) > 1:
        color_ramp.color_ramp.elements.remove(color_ramp.color_ramp.elements[-1])

    for idx, stop in enumerate(stops):
        pos = stop.get("position", 0.0)
        col = tuple(stop.get("color_rgba", [1.0, 1.0, 1.0, 1.0]))
        if idx == 0:
            elem = color_ramp.color_ramp.elements[0]
            elem.position = pos
            elem.color = col
        else:
            elem = color_ramp.color_ramp.elements.new(pos)
            elem.color = col

    sky_emit = nodes.new('ShaderNodeEmission')
    sky_emit.inputs['Strength'].default_value = emission_str
    sky_out = nodes.new('ShaderNodeOutputMaterial')

    links.new(tex_coord.outputs['Object'], separate_xyz.inputs['Vector'])
    links.new(separate_xyz.outputs['Z'], color_ramp.inputs['Fac'])
    links.new(color_ramp.outputs['Color'], sky_emit.inputs['Color'])
    links.new(sky_emit.outputs['Emission'], sky_out.inputs['Surface'])

    obj_sky.data.materials.append(mat_sky)
    return obj_sky


def setup_lighting(lighting_cfg):
    """Sets up the 3-point Sun chiaroscuro lighting rig from manifest."""
    for light_info in lighting_cfg:
        name = light_info.get("name", "StudioLight")
        l_type = light_info.get("type", "SUN")
        energy = light_info.get("energy", 5.0)
        color = tuple(light_info.get("color_rgb", [1.0, 1.0, 1.0]))
        rot_deg = light_info.get("rotation_deg", [0.0, 0.0, 0.0])
        rot_rad = (math.radians(rot_deg[0]), math.radians(rot_deg[1]), math.radians(rot_deg[2]))

        light_obj = bpy.data.objects.get(name)
        if not light_obj:
            light_data = bpy.data.lights.new(name=name, type=l_type)
            light_obj = bpy.data.objects.new(name, light_data)
            bpy.context.scene.collection.objects.link(light_obj)
        else:
            light_obj.data.type = l_type

        light_obj.data.energy = energy
        light_obj.data.color = color
        light_obj.rotation_euler = rot_rad


def create_procedural_equipment(name, eq_type, material):
    """Creates a stylized 3D weapon/equipment piece with clean bmesh geometry."""
    mesh = bpy.data.meshes.new(f"{name}_Mesh")
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)

    bm = bmesh.new()

    if eq_type in ["broadsword", "dagger"]:
        length = 0.6 if eq_type == "dagger" else 1.4
        blade_w = 0.05 if eq_type == "dagger" else 0.08
        bmesh.ops.create_cube(bm, size=1.0)
        for v in bm.verts:
            v.co.x *= blade_w
            v.co.y *= 0.02
            v.co.z *= length
            if v.co.z > (length * 0.45):
                v.co.x *= 0.25
        bmesh.ops.create_cube(bm, size=0.25)
        for v in bm.verts[-8:]:
            v.co.x *= 1.3
            v.co.y *= 0.2
            v.co.z = (v.co.z * 0.2) - (length * 0.5)

    elif eq_type == "staff":
        # Cylindrical staff shaft + finial head
        bmesh.ops.create_cube(bm, size=1.0)
        for v in bm.verts:
            v.co.x *= 0.03
            v.co.y *= 0.03
            v.co.z *= 2.0
        # Orb on top
        bmesh.ops.create_icosphere(bm, subdivisions=2, radius=0.15)
        for v in bm.verts[-42:]:
            v.co.z += 1.1

    elif eq_type == "greataxe":
        # Shaft
        bmesh.ops.create_cube(bm, size=1.0)
        for v in bm.verts:
            v.co.x *= 0.04
            v.co.y *= 0.04
            v.co.z *= 1.6
        # Axe head
        bmesh.ops.create_cube(bm, size=0.5)
        for v in bm.verts[-8:]:
            v.co.x = (v.co.x * 1.5) + 0.3
            v.co.y *= 0.06
            v.co.z = (v.co.z * 0.8) + 0.6

    elif eq_type == "shield":
        # Curvaceous heater shield
        bmesh.ops.create_cube(bm, size=1.0)
        for v in bm.verts:
            v.co.x *= 0.4
            v.co.y *= 0.05
            v.co.z *= 0.6
            if v.co.z < 0:
                v.co.x *= (1.0 + v.co.z)
    else:
        bmesh.ops.create_cube(bm, size=0.5)

    bm.to_mesh(mesh)
    bm.free()

    obj.data.materials.append(material)
    return obj


def loop_action(action):
    """Ensures an action repeats indefinitely across all channels using CYCLES modifiers."""
    if not action:
        return
    if hasattr(action, 'layers'):
        for layer in action.layers:
            for strip in layer.strips:
                for cb in strip.channelbags:
                    for fc in cb.fcurves:
                        if not any(m.type == 'CYCLES' for m in fc.modifiers):
                            mod = fc.modifiers.new('CYCLES')
                            mod.mode_after = 'REPEAT'
                            mod.mode_before = 'REPEAT'
    elif hasattr(action, 'fcurves'):
        for fc in action.fcurves:
            if not any(m.type == 'CYCLES' for m in fc.modifiers):
                mod = fc.modifiers.new('CYCLES')
                mod.mode_after = 'REPEAT'
                mod.mode_before = 'REPEAT'


def film_manifest():
    """Main deterministic execution routine."""
    manifest_path = parse_arguments()
    print(f"[Studio Filming Engine] 🎬 Ingesting manifest: {manifest_path}")
    manifest = load_manifest(manifest_path)

    meta = manifest.get("metadata", {})
    env = manifest.get("environment", {})
    shots = manifest.get("shots", [])
    characters = manifest.get("characters", [])
    lighting = manifest.get("lighting", [])

    # 1. Open Base Blend
    base_blend_name = env.get("base_blend", "flesh_female_comic.blend")
    base_blend_path = os.path.join(WORKSPACE_ROOT, base_blend_name)
    if not os.path.isfile(base_blend_path):
        base_blend_path = os.path.join(WORKSPACE_ROOT, "flesh_female_comic.blend")

    print(f"[Studio Filming Engine] 📦 Opening base stage: {base_blend_path}")
    bpy.ops.wm.open_mainfile(filepath=base_blend_path)

    # 2. Configure Scene & Render Engine
    scene = bpy.context.scene
    engine_map = {
        "BLENDER_EEVEE_NEXT": "BLENDER_EEVEE",
        "BLENDER_EEVEE": "BLENDER_EEVEE",
        "CYCLES": "CYCLES"
    }
    scene.render.engine = engine_map.get(meta.get("engine", "BLENDER_EEVEE"), "BLENDER_EEVEE")
    scene.render.film_transparent = False

    res = meta.get("resolution", {})
    scene.render.resolution_x = res.get("width", 640)
    scene.render.resolution_y = res.get("height", 360)
    scene.render.resolution_percentage = 100
    scene.render.fps = meta.get("fps", 24)

    total_frames = meta.get("total_frames", 96)
    scene.frame_start = 1
    scene.frame_end = total_frames

    outline_mat = get_or_create_outline_material()

    # 3. Procedural Set: Terrain & Backdrop
    if "terrain" in env:
        build_terrain(env["terrain"])
    if "backdrop" in env:
        build_backdrop(env["backdrop"])

    # 4. Lighting Rig
    setup_lighting(lighting)

    # 5. Characters & Armatures
    base_body = bpy.data.objects.get("LPC_Decivoxel_Flesh_Female")
    base_arm = bpy.data.objects.get("Armature")

    char_armatures = {}

    for char_idx, char_cfg in enumerate(characters):
        char_id = char_cfg.get("id", f"char_{char_idx}")
        char_name = char_cfg.get("name", char_id)
        mat_info = char_cfg.get("material", {})
        mat_char = make_cel_material(
            mat_info.get("name", f"Mat_{char_id}"),
            mat_info.get("base_rgba", [0.92, 0.72, 0.58, 1.0]),
            mat_info.get("shadow_rgba", [0.45, 0.18, 0.22, 1.0]),
            mat_info.get("rim_rgba", [1.0, 0.3, 0.5, 1.0])
        )

        if char_idx == 0:
            body = base_body
            arm = base_arm
        else:
            # Duplicate base model for second character
            body = base_body.copy()
            body.data = base_body.data.copy()
            bpy.context.scene.collection.objects.link(body)

            arm = base_arm.copy()
            arm.data = base_arm.data.copy()
            bpy.context.scene.collection.objects.link(arm)

            for mod in body.modifiers:
                if mod.type == 'ARMATURE':
                    mod.object = arm

        char_armatures[char_id] = arm

        # Apply cel skin material & outline
        if body:
            body.data.materials.clear()
            body.data.materials.append(mat_char)
            apply_ink_outline(body, outline_mat)

        # Initial Transform
        init_tx = char_cfg.get("initial_transform", {})
        loc = tuple(init_tx.get("location", [0.0, 0.0, 0.0]))
        rot_deg = init_tx.get("rotation_deg", [0.0, 0.0, 0.0])
        rot_rad = (math.radians(rot_deg[0]), math.radians(rot_deg[1]), math.radians(rot_deg[2]))

        if arm:
            arm.location = loc
            arm.rotation_euler = rot_rad

        # Equipment & Weapons
        for eq_cfg in char_cfg.get("equipment", []):
            eq_name = eq_cfg.get("name", f"{char_id}_Equip")
            eq_type = eq_cfg.get("type", "broadsword")
            eq_mat_info = eq_cfg.get("material", {})
            mat_eq = make_cel_material(
                eq_mat_info.get("name", f"Mat_{eq_name}"),
                eq_mat_info.get("base_rgba", [0.8, 0.88, 0.95, 1.0]),
                eq_mat_info.get("shadow_rgba", [0.15, 0.2, 0.35, 1.0]),
                eq_mat_info.get("rim_rgba", [1.0, 0.9, 0.5, 1.0])
            )

            eq_obj = create_procedural_equipment(eq_name, eq_type, mat_eq)
            apply_ink_outline(eq_obj, outline_mat)

            # Bind to bone socket
            target_socket = eq_cfg.get("parent_socket", "Hand.R_Socket")
            if arm and arm.data and hasattr(arm.data, "bones"):
                if target_socket not in arm.data.bones:
                    target_socket = "Hand.R_Socket" if "Hand.R_Socket" in arm.data.bones else (arm.data.bones[0].name if arm.data.bones else "")
            eq_obj.parent = arm
            eq_obj.parent_type = 'BONE'
            eq_obj.parent_bone = target_socket

            rot_off_deg = eq_cfg.get("rotation_offset_deg", [0.0, 0.0, 0.0])
            eq_obj.rotation_euler = (
                math.radians(rot_off_deg[0]),
                math.radians(rot_off_deg[1]),
                math.radians(rot_off_deg[2])
            )
            eq_obj.location = (0.0, 0.0, 0.0)

        # Assign skeletal animation action if available
        act_to_use = None
        actions_list = char_cfg.get("actions", [])
        if actions_list:
            first_act = actions_list[0]
            anim_name = first_act.get("animation") or first_act.get("pose_name", "")
            for cand in [anim_name, "Melee_Weapon_Attack" if char_idx == 0 else "Melee_Weapon_Idle", "Unarmed_Walk"]:
                if cand and cand in bpy.data.actions:
                    act_to_use = bpy.data.actions.get(cand)
                    break

        if not act_to_use:
            default_cand = "Melee_Weapon_Attack" if char_idx == 0 else "Melee_Weapon_Idle"
            if default_cand in bpy.data.actions:
                act_to_use = bpy.data.actions.get(default_cand)

        if act_to_use and arm:
            loop_action(act_to_use)
            arm.animation_data_create()
            arm.animation_data.action = act_to_use

        # Poses and kinematic keyframing adjustments
        for action in actions_list:
            shot_id = action.get("shot_id")
            matching_shot = next((s for s in shots if s.get("shot_id") == shot_id), None)
            f_start = matching_shot["frame_start"] if matching_shot else 1
            f_end = matching_shot["frame_end"] if matching_shot else total_frames

            bone_rots = action.get("bone_rotations_deg", {})
            if arm and arm.pose:
                bpy.context.view_layer.objects.active = arm
                for b_name, b_deg in bone_rots.items():
                    pbone = arm.pose.bones.get(b_name) or (arm.pose.bones.get(BONE_MAP.get(b_name)) if BONE_MAP.get(b_name) else None)
                    if pbone:
                        pbone.rotation_mode = 'XYZ'
                        pbone.rotation_euler = (
                            math.radians(b_deg[0]),
                            math.radians(b_deg[1]),
                            math.radians(b_deg[2])
                        )
                        pbone.keyframe_insert(data_path="rotation_euler", frame=f_start)
                        pbone.keyframe_insert(data_path="rotation_euler", frame=f_end)

    # 6. Cinematic Camera Staging & Keyframing
    cam = bpy.data.objects.get('RenderCam')
    if not cam:
        cam_data = bpy.data.cameras.new("RenderCam")
        cam = bpy.data.objects.new("RenderCam", cam_data)
        bpy.context.scene.collection.objects.link(cam)
    scene.camera = cam
    cam.animation_data_clear()

    for shot in sorted(shots, key=lambda s: s.get("frame_start", 1)):
        f_start = shot.get("frame_start", 1)
        f_end = shot.get("frame_end", total_frames)
        lens_mm = shot.get("lens_mm", 35.0)

        cm = shot.get("camera_movement", {})
        s_loc = tuple(cm.get("start_location", [0, -4, 1]))
        s_rot_deg = cm.get("start_rotation_deg", [75, 0, 0])
        s_rot = (math.radians(s_rot_deg[0]), math.radians(s_rot_deg[1]), math.radians(s_rot_deg[2]))

        e_loc = tuple(cm.get("end_location", s_loc))
        e_rot_deg = cm.get("end_rotation_deg", s_rot_deg)
        e_rot = (math.radians(e_rot_deg[0]), math.radians(e_rot_deg[1]), math.radians(e_rot_deg[2]))

        # Keyframe Start of Shot
        cam.location = s_loc
        cam.rotation_euler = s_rot
        cam.data.lens = lens_mm
        cam.data.keyframe_insert(data_path="lens", frame=f_start)
        cam.keyframe_insert(data_path="location", frame=f_start)
        cam.keyframe_insert(data_path="rotation_euler", frame=f_start)

        # Keyframe End of Shot
        cam.location = e_loc
        cam.rotation_euler = e_rot
        cam.data.lens = lens_mm
        cam.data.keyframe_insert(data_path="lens", frame=f_end)
        cam.keyframe_insert(data_path="location", frame=f_end)
        cam.keyframe_insert(data_path="rotation_euler", frame=f_end)

    # 7. Render Frame Sequence with Explicit Python Loop (Preventing Background Truncation)
    title = meta.get("title", "Studio Reel")
    safe_title = "".join(c if c.isalnum() else "_" for c in title).lower()
    print(f"[Studio Filming Engine] 🎥 ACTION! Filming '{title}' ({total_frames} frames @ {scene.render.fps} fps)...")

    # Clear stale frames before rendering new sequence
    for old_frame in glob.glob(os.path.join(FRAMES_DIR, "frame_*.png")):
        try:
            os.remove(old_frame)
        except OSError:
            pass

    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGB'

    for frame_idx in range(1, total_frames + 1):
        scene.frame_set(frame_idx)
        scene.render.filepath = os.path.join(FRAMES_DIR, f"frame_{frame_idx:04d}.png")
        bpy.ops.render.render(write_still=True)

    # Write output metadata record
    meta_record = {
        "title": title,
        "fps": scene.render.fps,
        "total_frames": total_frames,
        "resolution": {"width": scene.render.resolution_x, "height": scene.render.resolution_y},
        "output_mp4": os.path.join(SCREENINGS_DIR, f"{safe_title}.mp4")
    }
    with open(os.path.join(FRAMES_DIR, "film_meta.json"), "w", encoding="utf-8") as f:
        json.dump(meta_record, f, indent=2)

    print(f"[Studio Filming Engine] ✅ Filming complete! {total_frames} frames rendered to {FRAMES_DIR}")


if __name__ == "__main__":
    film_manifest()
    sys.exit(0)
