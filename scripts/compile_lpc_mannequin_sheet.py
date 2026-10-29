import os
import glob
import json
from PIL import Image

RAW_DIR = os.path.abspath('artifacts/lpc_filming/raw_frames')
TILE_SIZE = 128  # True HD LPC standard tile size
SHEET_COLS = 13
SHEET_ROWS = 21
SHEET_WIDTH = SHEET_COLS * TILE_SIZE   # 1664
SHEET_HEIGHT = SHEET_ROWS * TILE_SIZE  # 2688

OUT_SHEET_DIR = os.path.abspath('apps/web/public/actions/lpc_mannequin')
os.makedirs(OUT_SHEET_DIR, exist_ok=True)
OUT_SHEET_PATH = os.path.join(OUT_SHEET_DIR, 'lpc_mannequin_sheet.png')
VERIF_SHEET_PATH = os.path.abspath('artifacts/verification/lpc_mannequin_sheet.png')
GIF_PATH = os.path.abspath('artifacts/verification/lpc_mannequin_walk_preview.gif')

# Create empty transparent master sheet
master_sheet = Image.new('RGBA', (SHEET_WIDTH, SHEET_HEIGHT), (0, 0, 0, 0))

# Directions and their standard LPC rows
ROWS = {
    'north': 8,
    'west': 9,
    'south': 10,
    'east': 11
}

walk_frames = {d: [] for d in ROWS}

print("Downsampling raw 512px frames and pasting into 128px True HD LPC sheet...")

for d_name, row_idx in ROWS.items():
    pattern = os.path.join(RAW_DIR, f"walk_{d_name}_r{row_idx:02d}_c*.png")
    frame_files = sorted(glob.glob(pattern))
    
    if len(frame_files) != 9:
        print(f"Warning: Expected 9 frames for {d_name}, found {len(frame_files)}")
    
    for col_idx, fpath in enumerate(frame_files):
        with Image.open(fpath) as raw_img:
            # High-quality Lanczos downsampling to 128x128
            tile_128 = raw_img.resize((TILE_SIZE, TILE_SIZE), Image.Resampling.LANCZOS)
            walk_frames[d_name].append(tile_128)
            
            # Paste into master sheet
            x_pos = col_idx * TILE_SIZE
            y_pos = row_idx * TILE_SIZE
            master_sheet.paste(tile_128, (x_pos, y_pos), tile_128)

# Save Master Sheet
master_sheet.save(OUT_SHEET_PATH)
master_sheet.save(VERIF_SHEET_PATH)
print(f"Saved master LPC sheet -> {OUT_SHEET_PATH}")
print(f"Saved verification sheet -> {VERIF_SHEET_PATH}")

# -----------------------------------------------------------------------------
# CREATE 4-DIRECTION ANIMATED GIF PREVIEW
# -----------------------------------------------------------------------------
# 2x2 grid:
# [North, East]
# [West,  South]
gif_frames = []
for f_idx in range(9):
    grid_img = Image.new('RGBA', (TILE_SIZE * 2, TILE_SIZE * 2), (24, 24, 32, 255))
    grid_img.paste(walk_frames['north'][f_idx], (0, 0), walk_frames['north'][f_idx])
    grid_img.paste(walk_frames['east'][f_idx], (TILE_SIZE, 0), walk_frames['east'][f_idx])
    grid_img.paste(walk_frames['west'][f_idx], (0, TILE_SIZE), walk_frames['west'][f_idx])
    grid_img.paste(walk_frames['south'][f_idx], (TILE_SIZE, TILE_SIZE), walk_frames['south'][f_idx])
    
    # Scale 2x for preview crispness (256x256 -> 512x512)
    preview_large = grid_img.resize((TILE_SIZE * 4, TILE_SIZE * 4), Image.Resampling.NEAREST)
    gif_frames.append(preview_large.convert('P', palette=Image.Palette.ADAPTIVE))

gif_frames[0].save(
    GIF_PATH,
    save_all=True,
    append_images=gif_frames[1:],
    duration=110, # ~9 fps walk loop
    loop=0
)
print(f"Saved animated preview GIF -> {GIF_PATH}")

# -----------------------------------------------------------------------------
# REGISTER IN MANIFEST
# -----------------------------------------------------------------------------
manifest_path = os.path.abspath('apps/web/public/textures/avatars/lpc/mephit_manifest.json')
if os.path.exists(manifest_path):
    try:
        with open(manifest_path, 'r', encoding='utf-8') as f:
            manifest = json.load(f)
        
        manifest['lpc_mannequin'] = {
            "name": "LPC Decivoxel Mannequin",
            "category": "base_humanoid",
            "sheet_path": "/actions/lpc_mannequin/lpc_mannequin_sheet.png",
            "tile_size": 128,
            "actions": {
                "walk_north": {"row": 8, "frames": 9},
                "walk_west": {"row": 9, "frames": 9},
                "walk_south": {"row": 10, "frames": 9},
                "walk_east": {"row": 11, "frames": 9}
            }
        }
        
        with open(manifest_path, 'w', encoding='utf-8') as f:
            json.dump(manifest, f, indent=2)
        print(f"Successfully registered 'lpc_mannequin' in {manifest_path}")
    except Exception as e:
        print(f"Note: Failed to update manifest: {e}")
