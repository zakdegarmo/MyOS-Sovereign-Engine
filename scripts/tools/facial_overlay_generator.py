"""
Expressive 2D Facial & Emotional Overlay Generator
Creates modular JRPG-styled emotive facial overlay layers
(neutral, happy, determined, angry, shocked, hurt, cast, smug)
matching True HD 128x128 LPC tile grids and direction offsets.
"""

from PIL import Image, ImageDraw
import os
import json

SPRITE_SIZE = 128
GRID_COLS = 13
GRID_ROWS = 21
LPC_WIDTH = GRID_COLS * SPRITE_SIZE   # 1664
LPC_HEIGHT = GRID_ROWS * SPRITE_SIZE  # 2688

# Emotion definitions with eye/mouth pixel features
EMOTIONS = {
    "neutral": {
        "eye_color": (35, 45, 60, 255),
        "eye_highlight": (255, 255, 255, 220),
        "mouth_color": (140, 50, 50, 240),
        "brow_slant": 0,
        "mouth_type": "line",
        "blush": False
    },
    "happy": {
        "eye_color": (30, 70, 120, 255),
        "eye_highlight": (255, 255, 255, 255),
        "mouth_color": (180, 50, 60, 255),
        "brow_slant": 1,
        "mouth_type": "smile",
        "blush": True
    },
    "determined": {
        "eye_color": (20, 80, 140, 255),
        "eye_highlight": (255, 255, 255, 240),
        "mouth_color": (120, 40, 40, 255),
        "brow_slant": -2,
        "mouth_type": "firm",
        "blush": False
    },
    "angry": {
        "eye_color": (160, 30, 30, 255),
        "eye_highlight": (255, 200, 200, 220),
        "mouth_color": (100, 20, 20, 255),
        "brow_slant": -3,
        "mouth_type": "grimace",
        "blush": False
    },
    "shocked": {
        "eye_color": (40, 50, 70, 255),
        "eye_highlight": (255, 255, 255, 255),
        "mouth_color": (120, 30, 30, 255),
        "brow_slant": 2,
        "mouth_type": "open",
        "blush": False
    },
    "hurt": {
        "eye_color": (80, 40, 40, 255),
        "eye_highlight": (200, 200, 255, 200),
        "mouth_color": (130, 30, 30, 255),
        "brow_slant": -2,
        "mouth_type": "wince",
        "blush": False
    },
    "cast": {
        "eye_color": (0, 220, 255, 255),
        "eye_highlight": (255, 255, 255, 255),
        "mouth_color": (60, 100, 160, 255),
        "brow_slant": -1,
        "mouth_type": "chant",
        "blush": False,
        "glow": True
    }
}

def draw_face_cell(draw, cx, cy, direction, emo_cfg, scale=1.0):
    """
    Renders stylized chibi facial features (eyes, brows, mouth, blush) in 128x128 space.
    Direction: 'South' (front), 'North' (back - no face), 'West' (profile left), 'East' (profile right).
    """
    if direction == "North":
        return # Back of head has no face
        
    eye_col = emo_cfg["eye_color"]
    hi_col = emo_cfg["eye_highlight"]
    m_col = emo_cfg["mouth_color"]
    slant = emo_cfg["brow_slant"]
    m_type = emo_cfg["mouth_type"]
    
    # Head center anchor in 128x128 chibi sprite is roughly at (64, 48)
    hx = cx + 64
    hy = cy + 46
    
    if direction == "South":
        # Dual eyes
        left_eye_x = hx - 10
        right_eye_x = hx + 10
        eye_y = hy
        
        # Eyes
        if m_type == "wince":
            # Closed / pain arc
            draw.arc([left_eye_x - 5, eye_y - 3, left_eye_x + 5, eye_y + 3], start=180, end=360, fill=eye_col, width=2)
            draw.arc([right_eye_x - 5, eye_y - 3, right_eye_x + 5, eye_y + 3], start=180, end=360, fill=eye_col, width=2)
        else:
            # Stylized expressive eyes
            draw.ellipse([left_eye_x - 4, eye_y - 5, left_eye_x + 4, eye_y + 5], fill=eye_col)
            draw.ellipse([right_eye_x - 4, eye_y - 5, right_eye_x + 4, eye_y + 5], fill=eye_col)
            # Highlights
            draw.ellipse([left_eye_x - 2, eye_y - 4, left_eye_x + 1, eye_y - 1], fill=hi_col)
            draw.ellipse([right_eye_x - 2, eye_y - 4, right_eye_x + 1, eye_y - 1], fill=hi_col)
            
        # Eyebrows
        draw.line([left_eye_x - 5, eye_y - 8 + slant, left_eye_x + 5, eye_y - 8 - slant], fill=(20, 20, 20, 240), width=2)
        draw.line([right_eye_x - 5, eye_y - 8 - slant, right_eye_x + 5, eye_y - 8 + slant], fill=(20, 20, 20, 240), width=2)
        
        # Blush
        if emo_cfg.get("blush"):
            draw.ellipse([left_eye_x - 8, eye_y + 5, left_eye_x - 1, eye_y + 9], fill=(255, 120, 150, 160))
            draw.ellipse([right_eye_x + 1, eye_y + 5, right_eye_x + 8, eye_y + 9], fill=(255, 120, 150, 160))
            
        # Mouth
        mouth_y = hy + 13
        if m_type == "smile":
            draw.arc([hx - 5, mouth_y - 4, hx + 5, mouth_y + 3], start=0, end=180, fill=m_col, width=2)
        elif m_type == "open":
            draw.ellipse([hx - 4, mouth_y - 3, hx + 4, mouth_y + 5], fill=m_col)
        elif m_type == "grimace":
            draw.line([hx - 6, mouth_y, hx + 6, mouth_y], fill=m_col, width=2)
            draw.line([hx - 4, mouth_y + 3, hx + 4, mouth_y + 3], fill=m_col, width=1)
        elif m_type == "chant":
            draw.ellipse([hx - 3, mouth_y - 2, hx + 3, mouth_y + 4], fill=m_col)
        else: # line / firm
            draw.line([hx - 4, mouth_y, hx + 4, mouth_y], fill=m_col, width=2)
            
    elif direction == "West":
        # Facing Left profile
        eye_x = hx - 12
        eye_y = hy
        draw.ellipse([eye_x - 3, eye_y - 5, eye_x + 3, eye_y + 5], fill=eye_col)
        draw.ellipse([eye_x - 2, eye_y - 4, eye_x + 1, eye_y - 1], fill=hi_col)
        draw.line([eye_x - 4, eye_y - 8 + slant, eye_x + 4, eye_y - 8 - slant], fill=(20, 20, 20, 240), width=2)
        mouth_y = hy + 13
        draw.line([hx - 14, mouth_y, hx - 8, mouth_y], fill=m_col, width=2)
        
    elif direction == "East":
        # Facing Right profile
        eye_x = hx + 12
        eye_y = hy
        draw.ellipse([eye_x - 3, eye_y - 5, eye_x + 3, eye_y + 5], fill=eye_col)
        draw.ellipse([eye_x - 1, eye_y - 4, eye_x + 2, eye_y - 1], fill=hi_col)
        draw.line([eye_x - 4, eye_y - 8 - slant, eye_x + 4, eye_y - 8 + slant], fill=(20, 20, 20, 240), width=2)
        mouth_y = hy + 13
        draw.line([hx + 8, mouth_y, hx + 14, mouth_y], fill=m_col, width=2)

def generate_facial_spritesheet(emotion_name, output_path):
    """
    Generates a full 1664x2688 (13 cols x 21 rows @ 128px) transparent facial overlay sheet.
    """
    emo_cfg = EMOTIONS.get(emotion_name.lower(), EMOTIONS["neutral"])
    sheet = Image.new("RGBA", (LPC_WIDTH, LPC_HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(sheet)
    
    # LPC Direction map per action row offset:
    # Row 0: Cast North, 1: Cast West, 2: Cast South, 3: Cast East
    # Row 4: Thrust North, 5: Thrust West, 6: Thrust South, 7: Thrust East
    # Row 8: Walk North, 9: Walk West, 10: Walk South, 11: Walk Right
    # Row 12: Slash North, 13: Slash West, 14: Slash South, 15: Slash East
    # Row 16: Bow North, 17: Bow West, 18: Bow South, 19: Bow East
    # Row 20: Hurt / Dead (Facing South)
    
    dir_rows = {
        "North": [0, 4, 8, 12, 16],
        "West":  [1, 5, 9, 13, 17],
        "South": [2, 6, 10, 14, 18, 20],
        "East":  [3, 7, 11, 15, 19]
    }
    
    for direction, rows in dir_rows.items():
        for row in rows:
            for col in range(GRID_COLS):
                cx = col * SPRITE_SIZE
                cy = row * SPRITE_SIZE
                draw_face_cell(draw, cx, cy, direction, emo_cfg)
                
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    sheet.save(output_path)
    print(f"Saved facial overlay: {output_path} ({emotion_name})")
    return output_path

def generate_all_facial_overlays(out_dir):
    """
    Generates full suite of expressive facial overlays and registers them.
    """
    manifest_entries = []
    for emo in EMOTIONS.keys():
        filename = f"facial_expressive_{emo}.png"
        out_file = os.path.join(out_dir, filename)
        generate_facial_spritesheet(emo, out_file)
        manifest_entries.append(f"facial/{filename}")
    return manifest_entries

if __name__ == "__main__":
    out_target = r"apps/web/public/textures/avatars/lpc/facial"
    generate_all_facial_overlays(out_target)
    # Also mirror to /assets/lpc/facial
    mirror_target = r"apps/web/public/assets/lpc/facial"
    generate_all_facial_overlays(mirror_target)
