"""
Modular 3D JRPG/Chibi Character Synthesizer
Assembles 3D biped characters from modular sub-mesh libraries
(heads, hairstyles, outfits, accessories, weapons) anchored to standard armature.
Applies Chibi/JRPG stylized scaling and binds animations.
"""

import bpy
import mathutils
import sys
import os
import json
import math

MODELS_ROOT = os.path.abspath("apps/web/public/models")

BASE_CHARACTERS = {
    "male": os.path.join(MODELS_ROOT, "Universal Base Characters[Standard]", "Universal Base Characters[Standard]", "Base Characters", "Godot - UE", "Superhero_Male_FullBody.gltf"),
    "female": os.path.join(MODELS_ROOT, "Universal Base Characters[Standard]", "Universal Base Characters[Standard]", "Base Characters", "Godot - UE", "Superhero_Female_FullBody.gltf"),
    "armored_knight": os.path.join(MODELS_ROOT, "meshy ai glb", "rigged", "Meshy_AI_Armored_Adventurer_biped", "Meshy_AI_Armored_Adventurer_biped", "Meshy_AI_Armored_Adventurer_biped_Character_output.glb"),
    "mage": os.path.join(MODELS_ROOT, "meshy ai glb", "rigged", "Meshy_AI_Moonlit_Mage_biped", "Meshy_AI_Moonlit_Mage_biped", "Meshy_AI_Moonlit_Mage_biped_Character_output.glb"),
    "paladin": os.path.join(MODELS_ROOT, "meshy ai glb", "rigged", "Meshy_AI_Sunlit_Paladin_biped", "Meshy_AI_Sunlit_Paladin_biped", "Meshy_AI_Sunlit_Paladin_biped_Character_output.glb"),
    "huntsman": os.path.join(MODELS_ROOT, "meshy ai glb", "rigged", "Meshy_AI_Midnight_Huntsman_biped", "Meshy_AI_Midnight_Huntsman_biped", "Meshy_AI_Midnight_Huntsman_biped_Character_output.glb"),
    "scout": os.path.join(MODELS_ROOT, "meshy ai glb", "rigged", "Meshy_AI_Wilderness_Scout_biped", "Meshy_AI_Wilderness_Scout_biped", "Meshy_AI_Wilderness_Scout_biped_Character_output.glb"),
    "valor": os.path.join(MODELS_ROOT, "meshy ai glb", "rigged", "Meshy_AI_Sir_Valor_biped", "Meshy_AI_Sir_Valor_biped", "Meshy_AI_Sir_Valor_biped_Character_output.glb"),
    "azure": os.path.join(MODELS_ROOT, "meshy ai glb", "rigged", "Meshy_AI_Azure_Adventurer_biped", "Meshy_AI_Azure_Adventurer_biped", "Meshy_AI_Azure_Adventurer_biped_Character_output.glb")
}

MODULAR_PARTS_DIR = os.path.join(MODELS_ROOT, "Modular Character Outfits - Fantasy[Standard]", "Exports", "glTF (Godot-Unreal)", "Modular Parts")
OUTFITS_DIR = os.path.join(MODELS_ROOT, "Modular Character Outfits - Fantasy[Standard]", "Exports", "glTF (Godot-Unreal)", "Outfits")
if not os.path.exists(MODULAR_PARTS_DIR):
    MODULAR_PARTS_DIR = os.path.join(MODELS_ROOT, "Modular Character Outfits - Fantasy[Standard]", "Modular Character Outfits - Fantasy[Standard]", "Exports", "glTF (Godot-Unreal)", "Modular Parts")
    OUTFITS_DIR = os.path.join(MODELS_ROOT, "Modular Character Outfits - Fantasy[Standard]", "Modular Character Outfits - Fantasy[Standard]", "Exports", "glTF (Godot-Unreal)", "Outfits")

def clean_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def apply_chibi_proportions(arm_obj, head_scale=1.28, leg_compact=0.92):
    """
    Scale head and limbs to achieve classic Chibi/JRPG proportions.
    """
    bpy.context.view_layer.objects.active = arm_obj
    bpy.ops.object.mode_set(mode='EDIT')
    
    for bone in arm_obj.data.edit_bones:
        name_l = bone.name.lower()
        if 'head' in name_l:
            # Enlarge head relative to neck
            bone.length *= head_scale
        elif 'thigh' in name_l or 'calf' in name_l or 'leg' in name_l:
            bone.length *= leg_compact
            
    bpy.ops.object.mode_set(mode='OBJECT')

def tint_materials(objects, tint_rgb):
    """
    Applies procedural color tinting to Principled BSDF materials.
    """
    if not tint_rgb:
        return
    for obj in objects:
        if obj.type == 'MESH':
            for slot in obj.material_slots:
                mat = slot.material
                if mat and mat.use_nodes:
                    bsdf = next((n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None)
                    if bsdf:
                        # Multiply or tint base color
                        current_color = bsdf.inputs['Base Color'].default_value
                        bsdf.inputs['Base Color'].default_value = (
                            current_color[0] * tint_rgb[0],
                            current_color[1] * tint_rgb[1],
                            current_color[2] * tint_rgb[2],
                            current_color[3]
                        )

def assemble_character(spec, output_glb_path):
    """
    Assembles modular parts into a unified GLB character according to JSON spec:
    {
        "character_name": "elven_shadow_rogue",
        "gender": "male" | "female",
        "base_archetype": "male" | "female" | "huntsman" | "mage" ...,
        "hair": "Hair_Long" | "Hair_Buns" | "Hair_Beard" | "Hair_Buzzed" | "none",
        "eyebrows": "Eyebrows_Regular" | "Eyebrows_Female" | "none",
        "modular_parts": ["Male_Ranger_Head_Hood", "Male_Ranger_Body", "Male_Ranger_Acc_Pauldron", "Male_Ranger_Arms", "Male_Ranger_Legs", "Male_Ranger_Feet_Boots"],
        "tint": [0.3, 0.4, 0.6],
        "chibi": true
    }
    """
    clean_scene()
    
    gender = spec.get("gender", "male").lower()
    base_arch = spec.get("base_archetype", gender)
    base_path = BASE_CHARACTERS.get(base_arch, BASE_CHARACTERS[gender])
    
    if not os.path.exists(base_path):
        # Fallback to male
        base_path = BASE_CHARACTERS["male"]
        
    print(f"Loading Base Character: {base_path}")
    bpy.ops.import_scene.gltf(filepath=base_path)
    
    armatures = [o for o in bpy.context.scene.objects if o.type == 'ARMATURE']
    if not armatures:
        raise RuntimeError("No armature found in base character!")
    main_arm = armatures[0]
    
    imported_meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
    
    # 1. Attach Hairstyle if specified
    hair_name = spec.get("hair")
    if hair_name and hair_name != "none":
        hair_file = f"{hair_name}.gltf"
        hair_path = os.path.join(HAIRSTYLES_DIR, hair_file)
        if os.path.exists(hair_path):
            print(f"Attaching Hairstyle: {hair_path}")
            before_objs = set(bpy.context.scene.objects)
            bpy.ops.import_scene.gltf(filepath=hair_path)
            new_objs = set(bpy.context.scene.objects) - before_objs
            for obj in new_objs:
                if obj.type == 'MESH':
                    imported_meshes.append(obj)
                    # Re-parent / Bind armature modifier to main_arm
                    arm_mod = next((m for m in obj.modifiers if m.type == 'ARMATURE'), None)
                    if not arm_mod:
                        arm_mod = obj.modifiers.new(name="Armature", type='ARMATURE')
                    arm_mod.object = main_arm
                    obj.parent = main_arm

    # 2. Attach Modular Parts (Outfits / Armor / Hoods / Boots)
    modular_parts = spec.get("modular_parts", [])
    for part in modular_parts:
        part_file = part if part.endswith(".gltf") else f"{part}.gltf"
        part_path = os.path.join(MODULAR_PARTS_DIR, part_file)
        if os.path.exists(part_path):
            print(f"Attaching Modular Part: {part_path}")
            before_objs = set(bpy.context.scene.objects)
            bpy.ops.import_scene.gltf(filepath=part_path)
            new_objs = set(bpy.context.scene.objects) - before_objs
            for obj in new_objs:
                if obj.type == 'MESH':
                    imported_meshes.append(obj)
                    arm_mod = next((m for m in obj.modifiers if m.type == 'ARMATURE'), None)
                    if not arm_mod:
                        arm_mod = obj.modifiers.new(name="Armature", type='ARMATURE')
                    arm_mod.object = main_arm
                    obj.parent = main_arm

    # 3. Apply Tinting
    tint = spec.get("tint")
    if tint:
        tint_materials(imported_meshes, tint)

    # 4. Apply Chibi JRPG proportions if requested
    if spec.get("chibi", True):
        apply_chibi_proportions(main_arm, head_scale=1.28, leg_compact=0.92)

    # 5. Import & Link Universal Animations
    if os.path.exists(UAL1_ANIMATIONS):
        print(f"Importing Universal Animations from: {UAL1_ANIMATIONS}")
        bpy.ops.import_scene.gltf(filepath=UAL1_ANIMATIONS)
        
    os.makedirs(os.path.dirname(os.path.abspath(output_glb_path)), exist_ok=True)
    
    # Export assembled GLB
    bpy.ops.export_scene.gltf(
        filepath=output_glb_path,
        export_format='GLB',
        export_apply=True,
        export_animations=True
    )
    print(f"SUCCESS: Synthesized modular 3D character saved to -> {output_glb_path}")
    return output_glb_path

if __name__ == "__main__":
    if "--" in sys.argv:
        args = sys.argv[sys.argv.index("--") + 1:]
        spec_path = args[0]
        output_glb = args[1]
        
        with open(spec_path, 'r') as f:
            spec = json.load(f)
            
        assemble_character(spec, output_glb)
