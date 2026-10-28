"""
demonstrate_layered_parallax.py
Demonstrates the multi-layer sprite pointcloud / strata compositing engine:
Layer 0: Octahedral Skeletal Rig (rig_tpose_8way.png)
Layer 1: Internal Incandescent Core / Tissue
Layer 2: Decivoxel Flesh Mannequin (flesh_tpose_8way.png) with battle wound cutaways
Layer 3: Shredded Battle Armor / Vest with tears
Layer 4: Aetherial Arc / Spell Glow VFX

Generates an Exploded Anatomical Layer Breakdown and an 8-way Turntable GIF.
"""

import sys
import os
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

def build_demonstration():
    root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    actions_dir = os.path.join(root, "apps", "web", "public", "actions")
    artifacts_dir = os.path.join(root, "artifacts")
    os.makedirs(artifacts_dir, exist_ok=True)
    
    rig_strip_path = os.path.join(actions_dir, "rig_tpose_8way.png")
    flesh_strip_path = os.path.join(actions_dir, "flesh_tpose_8way.png")
    
    if not os.path.exists(rig_strip_path) or not os.path.exists(flesh_strip_path):
        raise FileNotFoundError("Prerequisite 8-way T-pose sheets not found!")
        
    rig_img = Image.open(rig_strip_path).convert('RGBA')
    flesh_img = Image.open(flesh_strip_path).convert('RGBA')
    
    tile_size = 256
    num_dirs = 8
    dir_names = ["South", "Southwest", "West", "Northwest", "North", "Northeast", "East", "Southeast"]
    angles_deg = [0, 45, 90, 135, 180, 225, 270, 315]
    
    # Extract 8 tiles for rig and flesh
    rig_tiles = [rig_img.crop((i * tile_size, 0, (i + 1) * tile_size, tile_size)) for i in range(num_dirs)]
    flesh_tiles = [flesh_img.crop((i * tile_size, 0, (i + 1) * tile_size, tile_size)) for i in range(num_dirs)]
    
    composite_tiles = []
    exploded_panels = []
    
    for d_idx in range(num_dirs):
        rig_tile = rig_tiles[d_idx]
        flesh_tile = flesh_tiles[d_idx]
        
        # 1. Internal Incandescent Core Layer
        # Tint flesh silhouette into incandescent orange/crimson tissue
        core_tile = Image.new('RGBA', (tile_size, tile_size), (0, 0, 0, 0))
        f_arr = np.array(flesh_tile)
        alpha = f_arr[:, :, 3]
        core_arr = np.zeros_like(f_arr)
        core_arr[:, :, 0] = np.where(alpha > 20, 255, 0)
        core_arr[:, :, 1] = np.where(alpha > 20, 90, 0)
        core_arr[:, :, 2] = np.where(alpha > 20, 20, 0)
        core_arr[:, :, 3] = np.where(alpha > 20, 240, 0)
        core_tile = Image.fromarray(core_arr)
        
        # 2. Battle Armor / Vest Layer (Deep Slate Charcoal Vest over chest/torso)
        armor_tile = Image.new('RGBA', (tile_size, tile_size), (0, 0, 0, 0))
        draw_armor = ImageDraw.Draw(armor_tile)
        # Armor coverage: torso bounds (Y: 100 to 180, X: 95 to 160)
        draw_armor.polygon([(100, 115), (156, 115), (165, 175), (91, 175)], fill=(35, 40, 50, 255))
        # Mask armor to flesh alpha
        armor_arr = np.array(armor_tile)
        armor_arr[:, :, 3] = np.minimum(armor_arr[:, :, 3], alpha)
        
        # 3. 3D Surface-Anchored Battle Wound on Chest
        # The chest is on the FRONT surface (local normal pointing South/Front).
        # When camera rotates or character turns:
        # - facing = cos(rad) determines visibility.
        # - If facing <= 0 (NW, N, NE): The chest is on the FAR side of the 3D body,
        #   completely occluded by the back of the torso. Wound is 0% visible!
        # - If facing > 0 (S, SW, W, E, SE): The wound projects onto the 3D torso hull,
        #   foreshortening horizontally by 'facing', shifting laterally by sin(rad),
        #   and creating genuine cavity depth parallax against the central spine bone.
        wound_mask = Image.new('L', (tile_size, tile_size), 0)
        
        rad = math.radians(angles_deg[d_idx])
        # Facing dot product: normal (0, -1, 0) against camera look direction
        facing = math.cos(rad)
        
        # Only render wound if surface is facing the camera (Backface Culling)
        if facing > 0.05:
            draw_wound = ImageDraw.Draw(wound_mask)
            
            # Torso radius in pixels
            R_chest = 22.0
            # Lateral surface shift along the chest cylinder
            x_shift = -math.sin(rad) * R_chest
            
            # Center of the wound on the chest (anchor: Spine01, Y ~ 140)
            cx = 128.0 + x_shift
            cy = 138.0
            
            # Foreshortened width and height
            w_half = max(2.0, 18.0 * facing)
            h_half = 14.0
            
            # Diagonal slash polygon mapped to 3D surface projection
            # Slanted cut from top-left to bottom-right across chest
            p1 = (cx - w_half * 0.9, cy - h_half * 0.8)
            p2 = (cx + w_half * 0.9, cy + h_half * 0.8)
            p3 = (cx + w_half * 0.6, cy + h_half * 1.1)
            p4 = (cx - w_half * 1.1, cy - h_half * 0.5)
            
            draw_wound.polygon([p1, p2, p3, p4], fill=255)
            
            # Central impact breach
            ellipse_w = max(3.0, 10.0 * facing)
            ellipse_h = 9.0
            draw_wound.ellipse([
                (cx - ellipse_w, cy - ellipse_h),
                (cx + ellipse_w, cy + ellipse_h)
            ], fill=255)
            
            # Soften edges slightly for organic laceration feel
            wound_mask = wound_mask.filter(ImageFilter.GaussianBlur(0.8))
            
        w_arr = np.array(wound_mask)
        
        # Cut wound into armor and flesh only where wound is visible
        armor_arr[:, :, 3] = np.where(w_arr > 80, 0, armor_arr[:, :, 3])
        armor_tile = Image.fromarray(armor_arr)
        
        flesh_arr = np.array(flesh_tile)
        flesh_arr[:, :, 3] = np.where(w_arr > 80, 0, flesh_arr[:, :, 3])
        flesh_wounded = Image.fromarray(flesh_arr)
        
        # 4. Aetherial Magic VFX Spark Layer around hands
        vfx_tile = Image.new('RGBA', (tile_size, tile_size), (0, 0, 0, 0))
        draw_vfx = ImageDraw.Draw(vfx_tile)
        # Orbiting mana sparkles around hands
        draw_vfx.ellipse([(20, 140), (32, 152)], fill=(0, 229, 255, 180))
        draw_vfx.ellipse([(224, 140), (236, 152)], fill=(255, 180, 0, 180))
        draw_vfx.ellipse([(124, 60), (132, 68)], fill=(0, 229, 255, 200))
        vfx_tile = vfx_tile.filter(ImageFilter.GaussianBlur(1.5))
        
        # --- COMPOSITE PASS (Back to Front) ---
        # Layer 0: Skeletal Rig
        comp = Image.new('RGBA', (tile_size, tile_size), (0, 0, 0, 0))
        comp.alpha_composite(rig_tile)
        
        # Layer 1: Internal Tissue Core (masked to wound area so only exposed at cuts)
        core_exposed_arr = np.array(core_tile)
        core_exposed_arr[:, :, 3] = np.where(w_arr > 50, 255, 0)
        comp.alpha_composite(Image.fromarray(core_exposed_arr))
        
        # Layer 2: Flesh (with wound cutout)
        comp.alpha_composite(flesh_wounded)
        
        # Layer 3: Armor (with shredded tears)
        comp.alpha_composite(armor_tile)
        
        # Layer 4: Aetherial VFX
        comp.alpha_composite(vfx_tile)
        
        composite_tiles.append(comp)
        
        # If front direction (d_idx == 0: South), also create an Exploded Anatomical Breakdown Panel
        if d_idx == 0:
            exploded_w = tile_size * 5
            exploded = Image.new('RGBA', (exploded_w, tile_size + 40), (16, 20, 28, 255))
            draw_exp = ImageDraw.Draw(exploded)
            
            layers = [
                ("1. Octahedral Rig", rig_tile),
                ("2. Internal Tissue", Image.fromarray(core_exposed_arr)),
                ("3. Decivoxel Flesh", flesh_wounded),
                ("4. Shredded Armor", armor_tile),
                ("5. Composite Sprite", comp)
            ]
            for li, (label, limg) in enumerate(layers):
                x_pos = li * tile_size
                draw_exp.text((x_pos + 12, 12), label, fill=(180, 200, 220, 255))
                exploded.alpha_composite(limg, (x_pos, 40))
            exploded_path = os.path.join(artifacts_dir, "layered_anatomy_breakdown.png")
            exploded.save(exploded_path)
            print(f"[OK] Saved Exploded Anatomy Breakdown: {exploded_path}")

    # Save 8-directional composite strip
    comp_strip = Image.new('RGBA', (tile_size * num_dirs, tile_size), (0, 0, 0, 0))
    for i, ct in enumerate(composite_tiles):
        comp_strip.paste(ct, (i * tile_size, 0), ct)
        
    preview_path = os.path.join(artifacts_dir, "layered_parallax_composite_preview.png")
    comp_strip.save(preview_path)
    print(f"[OK] Saved 8-Directional Composite Strip: {preview_path}")
    
    # Save animated 8-way Turntable GIF
    gif_path = os.path.join(artifacts_dir, "layered_parallax_turntable.gif")
    composite_tiles[0].save(
        gif_path,
        save_all=True,
        append_images=composite_tiles[1:],
        duration=180,
        loop=0,
        disposal=2
    )
    print(f"[OK] Saved Layered Parallax Turntable GIF: {gif_path}")
    return preview_path, gif_path

if __name__ == "__main__":
    build_demonstration()
