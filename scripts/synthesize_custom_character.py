import sys
sys.path.append(r'C:\Users\zakde\AppData\Roaming\Python\Python313\site-packages')
import bpy
import mathutils
import math
import os
import json
import argparse
import time
import numpy as np
from PIL import Image, ImageFilter, ImageEnhance
import cv2

def apply_miniature_cel(im, outline_px=2, zenithal_strength=0.25, wash_strength=0.45, highlight_strength=0.30):
    """Miniature painting & 2D anime cel shader"""
    im = im.convert('RGBA')
    w, h = im.size
    r, g, b, a = im.split()
    alpha = np.array(a, dtype=np.float32) / 255.0
    mask = alpha > 0.1

    im_boost = ImageEnhance.Color(im).enhance(1.22)
    rgb = np.array(im_boost.convert('RGB'), dtype=np.float32) / 255.0

    y_idx, x_idx = np.ogrid[:h, :w]
    face_mask = (
        (x_idx >= int(0.40 * w)) & (x_idx <= int(0.60 * w)) &
        (y_idx >= int(0.24 * h)) & (y_idx <= int(0.45 * h))
    )

    # 1. Bilateral smoothing
    lum_raw = 0.299 * rgb[:,:,0] + 0.587 * rgb[:,:,1] + 0.114 * rgb[:,:,2]
    lum_u8 = (np.clip(lum_raw, 0, 1) * 255).astype(np.uint8)
    lum_smooth_u8 = cv2.bilateralFilter(lum_u8, d=7, sigmaColor=35, sigmaSpace=5)
    lum_smooth = lum_smooth_u8.astype(np.float32) / 255.0

    # 2. Digital Zenithal Priming
    norm_y = y_idx / float(h)
    zenith_falloff = np.clip(1.0 - (norm_y - 0.20) * 0.32, 0.78, 1.15)
    dy = np.zeros_like(lum_smooth)
    dy[1:-1, :] = lum_smooth[:-2, :] - lum_smooth[2:, :]
    local_zenith = np.clip(1.0 + dy * 1.4, 0.85, 1.20)
    zenith_map = (zenith_falloff * (1.0 - zenithal_strength)) + (local_zenith * zenithal_strength)
    rgb_zenith = np.clip(rgb * np.expand_dims(zenith_map, 2), 0.0, 1.0)

    # 3. Recess Nuln Oil Wash
    k_sm = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    k_med = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    tophat_sm = cv2.morphologyEx(lum_smooth_u8, cv2.MORPH_BLACKHAT, k_sm).astype(np.float32) / 255.0
    tophat_med = cv2.morphologyEx(lum_smooth_u8, cv2.MORPH_BLACKHAT, k_med).astype(np.float32) / 255.0
    cavity = np.clip(tophat_sm * 1.1 + tophat_med * 0.7, 0.0, 1.0)
    cavity = cv2.GaussianBlur(cavity, (3, 3), 0)
    cavity[face_mask] *= 0.10

    wash_color = np.array([0.08, 0.09, 0.13])
    wash_factor = np.expand_dims(cavity * wash_strength, 2)
    rgb_washed = rgb_zenith * (1.0 - wash_factor) + wash_color * wash_factor

    # 4. Drybrush Edge Catch-Lights
    whitehat = cv2.morphologyEx(lum_smooth_u8, cv2.MORPH_TOPHAT, k_sm).astype(np.float32) / 255.0
    lap = cv2.Laplacian(lum_smooth_u8, cv2.CV_32F, ksize=3)
    ridge = np.clip(-lap / 255.0, 0.0, 1.0)
    highlight_smooth = cv2.GaussianBlur(np.clip(whitehat * 1.0 + ridge * 0.6, 0.0, 1.0), (3, 3), 0)
    highlight_smooth[face_mask] *= 0.15
    highlight_boost = np.expand_dims(highlight_smooth * highlight_strength, 2)
    rgb_highlighted = np.clip(rgb_washed * (1.0 + highlight_boost), 0.0, 1.0)

    # 5. Atmospheric Color Glaze
    cur_lum = 0.299 * rgb_highlighted[:,:,0] + 0.587 * rgb_highlighted[:,:,1] + 0.114 * rgb_highlighted[:,:,2]
    warm_tint = np.array([1.03, 1.01, 0.97])
    cool_tint = np.array([0.95, 0.97, 1.05])
    t = np.clip((cur_lum - 0.35) / 0.35, 0.0, 1.0)
    glaze = cool_tint * (1.0 - np.expand_dims(t, 2)) + warm_tint * np.expand_dims(t, 2)
    rgb_glazed = np.clip(rgb_highlighted * glaze, 0.0, 1.0)

    # 6. Stepped Anime Cel Quantization
    lum_final = 0.299 * rgb_glazed[:,:,0] + 0.587 * rgb_glazed[:,:,1] + 0.114 * rgb_glazed[:,:,2]
    lum_final_u8 = (np.clip(lum_final, 0, 1) * 255).astype(np.uint8)
    lum_final_smooth = cv2.bilateralFilter(lum_final_u8, d=5, sigmaColor=30, sigmaSpace=4).astype(np.float32) / 255.0

    lum_cel = np.copy(lum_final_smooth)
    lum_cel[(lum_final_smooth < 0.38) & mask] = 0.44
    lum_cel[(lum_final_smooth >= 0.38) & (lum_final_smooth < 0.64) & mask] = 0.68
    lum_cel[(lum_final_smooth >= 0.64) & (lum_final_smooth < 0.84) & mask] = 0.86
    lum_cel[(lum_final_smooth >= 0.84) & mask] = 1.00

    scale = np.ones_like(lum_final)
    np.divide(lum_cel, lum_final, out=scale, where=(lum_final > 0.03))
    scale = np.clip(scale, 0.65, 1.30)
    rgb_cel = np.clip(rgb_glazed * np.expand_dims(scale, 2), 0.0, 1.0)

    # 7. Comic Silhouette & Inking
    dx_cel = np.zeros_like(lum_final_smooth)
    dy_cel = np.zeros_like(lum_final_smooth)
    dx_cel[:, 1:-1] = lum_final_smooth[:, 2:] - lum_final_smooth[:, :-2]
    dy_cel[1:-1, :] = lum_final_smooth[2:, :] - lum_final_smooth[:-2, :]
    grad = np.sqrt(dx_cel**2 + dy_cel**2)
    
    is_seam = (grad > 0.30) & mask & (~face_mask)
    ink_color = np.array([0.08, 0.09, 0.14])
    for c in range(3):
        rgb_cel[is_seam, c] = rgb_cel[is_seam, c] * 0.20 + ink_color[c] * 0.80

    char_img = Image.fromarray((rgb_cel * 255).astype(np.uint8))
    char_img.putalpha(a)

    sil = Image.fromarray((mask * 255).astype(np.uint8))
    sil_dil = sil.filter(ImageFilter.MaxFilter(2 * outline_px + 1))
    outline_mask = np.array(sil_dil) > 100

    out = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    ink_outline = Image.new('RGBA', (w, h), (18, 20, 30, 255))
    out.paste(ink_outline, (0, 0), Image.fromarray((outline_mask * 255).astype(np.uint8)))
    out.paste(char_img, (0, 0), char_img)
    return out

ACTIONS_MAP = [
    ('idle', 'Idle_Loop'),
    ('walk', 'Walk_Loop'),
    ('run', 'Jog_Fwd_Loop'),
    ('slash', 'Melee_Weapon_Attack'),
    ('spellcast', 'Spell_Simple_Shoot'),
    ('hurt', 'Hit_Chest'),
    ('death', 'Death01'),
]

DIR_ANGLES = [0, -45, -90, -135, 180, 135, 90, 45]

DIR_ACTIONS = os.path.abspath('apps/web/public/actions')
DIR_TEMP = os.path.abspath('temp_tiles')
os.makedirs(DIR_ACTIONS, exist_ok=True)
os.makedirs(DIR_TEMP, exist_ok=True)

def parse_color(c):
    if isinstance(c, (list, tuple)):
        if len(c) == 3: return (c[0], c[1], c[2], 1.0)
        return tuple(c)
    if isinstance(c, str):
        c = c.lstrip('#')
        if len(c) == 6:
            r = int(c[0:2], 16) / 255.0
            g = int(c[2:4], 16) / 255.0
            b = int(c[4:6], 16) / 255.0
            return (r, g, b, 1.0)
    return (0.5, 0.5, 0.5, 1.0)

def assemble_character(recipe: dict):
    blend_path = "chibi_universal_wardrobe_master.blend"
    bpy.ops.wm.open_mainfile(filepath=blend_path)

    hair_opt = recipe.get("hair", "fighter")
    headwear_opt = recipe.get("headwear", "none")
    bottom_opt = recipe.get("bottom", "pants")
    cape_opt = recipe.get("cape", "none")
    mainhand_opt = recipe.get("mainhand", "sword")
    offhand_opt = recipe.get("offhand", "shield")

    # 1. Hair
    hair_map = {
        "fighter": "Modular_Hair_Fighter",
        "paladin": "Modular_Hair_Paladin",
        "adventurer": "Modular_Hair_Adventurer"
    }
    for k, mesh_name in hair_map.items():
        obj = bpy.data.objects.get(mesh_name)
        if obj:
            visible = (k == hair_opt)
            obj.hide_viewport = not visible
            obj.hide_render = not visible

    # 2. Headwear
    hat = bpy.data.objects.get("Modular_Mage_Hat")
    if hat:
        hat.hide_viewport = (headwear_opt != "mage_hat")
        hat.hide_render = (headwear_opt != "mage_hat")

    # 3. Bottoms
    pants = bpy.data.objects.get("Modular_Adventurer_Pants")
    skirt = bpy.data.objects.get("Modular_Combat_Skirt")
    
    show_pants = bottom_opt in ["pants", "skirt_and_pants"]
    show_skirt = bottom_opt in ["skirt", "skirt_and_pants"]
    
    if pants:
        pants.hide_viewport = not show_pants
        pants.hide_render = not show_pants
    if skirt:
        skirt.hide_viewport = not show_skirt
        skirt.hide_render = not show_skirt

    # 4. Cape
    cape = bpy.data.objects.get("Modular_Knight_Cape")
    if cape:
        cape.hide_viewport = (cape_opt != "knight_cape")
        cape.hide_render = (cape_opt != "knight_cape")

    # 5. Weapons Right (Mainhand)
    sword = bpy.data.objects.get("Modular_1H_Sword")
    staff = bpy.data.objects.get("Modular_2H_Staff")
    dagger_r = bpy.data.objects.get("Modular_Rogue_Dagger_R")

    if sword:
        sword.hide_viewport = (mainhand_opt != "sword")
        sword.hide_render = (mainhand_opt != "sword")
    if staff:
        staff.hide_viewport = (mainhand_opt != "staff")
        staff.hide_render = (mainhand_opt != "staff")
    if dagger_r:
        dagger_r.hide_viewport = (mainhand_opt != "dagger")
        dagger_r.hide_render = (mainhand_opt != "dagger")

    # 6. Weapons Left (Offhand)
    shield = bpy.data.objects.get("Modular_Round_Shield")
    dagger_l = bpy.data.objects.get("Modular_Rogue_Dagger_L")

    if shield:
        shield.hide_viewport = (offhand_opt != "shield")
        shield.hide_render = (offhand_opt != "shield")
    if dagger_l:
        dagger_l.hide_viewport = (offhand_opt != "dagger")
        dagger_l.hide_render = (offhand_opt != "dagger")

    # 7. Face Texture Mapping
    face_opt = recipe.get("face", "neutral")
    face_img_map = {
        "neutral": "assets/textures/chibi_faces/face_neutral.png",
        "happy": "assets/textures/chibi_faces/face_happy.png",
        "combat": "assets/textures/chibi_faces/face_combat.png",
        "expressive": "assets/textures/chibi_faces/face_chibi_expressive.png",
        "rogue": "assets/textures/chibi_faces/face_rogue_phantom.png"
    }
    face_path = face_img_map.get(face_opt)
    if face_path and os.path.exists(face_path):
        face_mat = bpy.data.materials.get("M_Chibi_Face")
        if face_mat and face_mat.node_tree:
            tex_node = face_mat.node_tree.nodes.get("FaceTexture")
            if tex_node:
                new_img = bpy.data.images.load(os.path.abspath(face_path), check_existing=True)
                tex_node.image = new_img

    # 8. Demi-Human / Species Skeletal Scaling (Dwarf, Elf)
    species_opt = recipe.get("species", recipe.get("body", "human")).lower()
    arm = bpy.data.objects.get("Armature")
    if arm:
        if species_opt == "dwarf":
            arm.scale = mathutils.Vector((1.25, 1.2, 0.82))
        elif species_opt == "elf":
            arm.scale = mathutils.Vector((0.92, 0.92, 1.08))
        else:
            arm.scale = mathutils.Vector((1.0, 1.0, 1.0))

    # 9. Colors & Material Tinting
    def set_mat_color(obj_name, col_val):
        rgba = parse_color(col_val)
        obj = bpy.data.objects.get(obj_name)
        if obj and obj.data.materials:
            mat = obj.data.materials[0].copy()
            obj.data.materials[0] = mat
            bsdf = mat.node_tree.nodes.get('Principled BSDF')
            if bsdf and 'Base Color' in bsdf.inputs:
                bsdf.inputs['Base Color'].default_value = rgba
            # Color ramp for skirt
            ramp = mat.node_tree.nodes.get('Color Ramp')
            if ramp and len(ramp.color_ramp.elements) > 1:
                ramp.color_ramp.elements[1].color = rgba

    colors = recipe.get("colors", {})
    if "hair" in colors and hair_opt in hair_map:
        set_mat_color(hair_map[hair_opt], colors["hair"])
    if "skirt" in colors and skirt:
        set_mat_color("Modular_Combat_Skirt", colors["skirt"])
    if "pants" in colors and pants:
        set_mat_color("Modular_Adventurer_Pants", colors["pants"])
    if "tunic" in colors:
        set_mat_color("Modular_Adventurer_Tunic", colors["tunic"])
    if "cape" in colors and cape:
        set_mat_color("Modular_Knight_Cape", colors["cape"])
    if "skin" in colors:
        set_mat_color("Mannequin", colors["skin"])

    print(f"[Synthesizer] Assembled character: {recipe.get('name', 'Custom')} (Species: {species_opt})")

def render_preview(out_png: str, res: int = 512):
    scene = bpy.context.scene
    scene.render.resolution_x = res
    scene.render.resolution_y = res
    scene.render.film_transparent = True
    
    arm = bpy.data.objects.get("Armature")
    if arm and arm.animation_data:
        act = bpy.data.actions.get("Idle_Loop")
        if act:
            arm.animation_data.action = act
            scene.frame_set(1)

    tmp_path = os.path.abspath("temp_tiles/custom_preview_raw.png")
    scene.render.filepath = tmp_path
    
    bpy.context.view_layer.update()
    bpy.ops.render.render(write_still=True)
    
    raw = Image.open(tmp_path)
    painted = apply_miniature_cel(raw)
    painted.save(out_png)
    print(f"[Synthesizer] Saved preview to {out_png}")

def render_actions(cid: str, actions_to_render: list):
    scene = bpy.context.scene
    scene.render.resolution_x = 256
    scene.render.resolution_y = 256
    scene.render.film_transparent = True

    arm = bpy.data.objects.get('Armature')
    tile_tmp = os.path.join(DIR_TEMP, f"{cid}_tile_raw.png")
    scene.render.filepath = tile_tmp

    rendered = {}
    for act_key, b_act_name in ACTIONS_MAP:
        if actions_to_render and act_key not in actions_to_render:
            continue

        b_act = bpy.data.actions.get(b_act_name)
        if not b_act: continue

        arm.animation_data.action = b_act
        f_start = int(b_act.frame_range[0])
        f_end = int(b_act.frame_range[1])
        f_len = max(1, f_end - f_start)
        sample_frames = [int(round(f_start + i * (f_len / 8.0))) for i in range(8)]

        sheet = Image.new('RGBA', (2048, 2048), (0, 0, 0, 0))

        for row_idx, deg in enumerate(DIR_ANGLES):
            arm.rotation_euler = (0, 0, math.radians(deg))
            for col_idx, f in enumerate(sample_frames):
                scene.frame_set(f)
                bpy.context.view_layer.update()
                bpy.ops.render.render(write_still=True)

                raw_tile = Image.open(tile_tmp)
                cel_tile = apply_miniature_cel(raw_tile, outline_px=2)
                sheet.paste(cel_tile, (col_idx * 256, row_idx * 256))

        arm.rotation_euler = (0, 0, 0)
        filename = f"{cid}_{act_key}_loop.png"
        out_path = os.path.join(DIR_ACTIONS, filename)
        sheet.save(out_path)

        # 1024 downsample
        fn_1024 = f"{cid}_{act_key}_1024.png"
        sheet.resize((1024, 1024), Image.Resampling.LANCZOS).save(os.path.join(DIR_ACTIONS, fn_1024))

        rendered[act_key] = f"/actions/{filename}"
        print(f"[Synthesizer] Rendered action '{act_key}' -> {filename}")

    return rendered

def update_manifest(recipe: dict, rendered_actions: dict, preview_url: str):
    cid = recipe.get("id", "custom_character")
    manifest_path = os.path.abspath('apps/web/public/textures/avatars/myos_sprites_manifest.json')
    if os.path.exists(manifest_path):
        with open(manifest_path, 'r', encoding='utf-8') as f:
            manifest_data = json.load(f)

        manifest_data['sprites'][cid] = {
            "id": cid,
            "name": recipe.get("name", "Custom Hero"),
            "category": "heroes",
            "badge": recipe.get("badge", "CUSTOM HERO"),
            "badgeColor": "bg-gradient-to-r from-purple-500/30 to-indigo-500/30 text-purple-300 border-purple-500/50",
            "description": recipe.get("description", "Custom synthesized 2.5D miniature-painted character."),
            "tileSize": 256,
            "grid": { "cols": 8, "rows": 8 },
            "scale": 1.0,
            "defaultAction": "idle",
            "previewUrl": preview_url,
            "actions": rendered_actions,
            "pillarAlignment": "unity"
        }

        with open(manifest_path, 'w', encoding='utf-8') as f:
            json.dump(manifest_data, f, indent=2)
        print(f"[Synthesizer] Injected '{cid}' into myos_sprites_manifest.json!")

if __name__ == "__main__":
    argv = sys.argv
    if "--" in argv:
        args = argv[argv.index("--") + 1:]
    else:
        args = []

    recipe_path = None
    render_full = False

    for i, a in enumerate(args):
        if a in ["--recipe", "-r"] and i + 1 < len(args):
            recipe_path = args[i + 1]
        elif a in ["--full", "-f"]:
            render_full = True

    if recipe_path and os.path.exists(recipe_path):
        with open(recipe_path, "r", encoding="utf-8-sig") as f:
            recipe = json.load(f)
    else:
        recipe = {
            "id": "custom_hero",
            "name": "Custom Hero",
            "hair": "fighter",
            "headwear": "none",
            "bottom": "skirt_and_pants",
            "mainhand": "sword",
            "offhand": "shield"
        }

    cid = recipe.get("id", "custom_hero")
    assemble_character(recipe)

    # Preview
    preview_filename = f"{cid}_preview.png"
    preview_path = os.path.join(DIR_ACTIONS, preview_filename)
    render_preview(preview_path, res=512)
    preview_url = f"/actions/{preview_filename}"

    # Actions
    actions_to_render = recipe.get("actions", ["idle", "walk", "run", "spellcast", "slash"] if render_full else ["idle"])
    rendered = render_actions(cid, actions_to_render)

    update_manifest(recipe, rendered, preview_url)

    result = {
        "success": True,
        "id": cid,
        "name": recipe.get("name"),
        "previewUrl": preview_url,
        "actions": rendered
    }
    print("RESULT_JSON:" + json.dumps(result))
