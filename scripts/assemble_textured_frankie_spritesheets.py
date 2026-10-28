import os
import shutil
from PIL import Image, ImageFilter
import numpy as np
from scipy.ndimage import binary_dilation

BASE_DIR = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\actions\hemp_crew"
ARTIFACT_DIR = r"C:\Users\zakde\.gemini\antigravity\brain\5d778f69-db13-4232-9d87-80fc4f0ece4e"
PUBLIC_ACTIONS_DIR = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\actions"

DIRECTIONS = [
    ("north", 0), # Row 0: North
    ("west",  1), # Row 1: West
    ("south", 2), # Row 2: South
    ("east",  3), # Row 3: East
]

SPRITE_SIZE = 128
SHEET_WIDTH = SPRITE_SIZE * 8   # 1024 px
SHEET_HEIGHT = SPRITE_SIZE * 4  # 512 px

def process_textured_comic_frame(im_raw):
    """
    Applies clean comic book inking:
    - 100% matte cel color
    - Solid black comic ink outlines (bold silhouette & structural feature line art)
    - Zero procedural noise / sandpaper 'TV static'
    - Downscaled to 128x128 with Lanczos + clean edge preservation
    """
    im_rgba = im_raw.convert("RGBA")
    alpha = im_rgba.split()[3]
    
    # 1. Bold Silhouette Outline (2 iterations dilation at 512px -> crisp 1-2px line at 128px)
    alpha_edge = alpha.filter(ImageFilter.FIND_EDGES)
    silhouette = (np.array(alpha_edge) > 20)
    silhouette_bold = binary_dilation(silhouette, iterations=2)

    # 2. Structural Line Art (Heavy pre-blur strips micro-noise while keeping major seams)
    gray = im_rgba.convert("L")
    gray_smooth = gray.filter(ImageFilter.GaussianBlur(radius=1.8))
    edges = gray_smooth.filter(ImageFilter.FIND_EDGES)
    edge_arr = np.array(edges)
    alpha_arr = np.array(alpha)

    # Internal threshold (35 captures genuine geometry seams: jaw, teeth, collar, eyes without noise)
    internal_ink = (edge_arr > 35) & (alpha_arr > 120)
    internal_ink_bold = binary_dilation(internal_ink, iterations=1)

    # Total Comic Lineart
    total_ink = silhouette_bold | internal_ink_bold

    # Solid Comic Book Black Ink (RGB 14, 14, 18, Alpha 255)
    arr = np.array(im_rgba)
    arr[total_ink, 0] = 14
    arr[total_ink, 1] = 14
    arr[total_ink, 2] = 18
    arr[total_ink, 3] = np.maximum(arr[total_ink, 3], 245)

    inked_512 = Image.fromarray(arr, "RGBA")

    # Downscale with Lanczos to 128x128
    im_128 = inked_512.resize((SPRITE_SIZE, SPRITE_SIZE), Image.Resampling.LANCZOS)
    im_128_crisp = im_128.filter(ImageFilter.UnsharpMask(radius=1.0, percent=80, threshold=2))

    # Crisp 256 preview for animated GIF
    im_256 = inked_512.resize((256, 256), Image.Resampling.LANCZOS).filter(
        ImageFilter.UnsharpMask(radius=1.0, percent=90, threshold=2)
    )

    return im_128_crisp, im_256

def assemble_action(action_name, raw_folder_name, output_base_name):
    raw_dir = os.path.join(BASE_DIR, raw_folder_name)
    if not os.path.exists(raw_dir):
        print(f"Directory not found: {raw_dir}")
        return

    master_sheet = Image.new("RGBA", (SHEET_WIDTH, SHEET_HEIGHT), (0, 0, 0, 0))
    south_preview_frames = []

    print(f"\n=== Assembling {action_name.upper()} with Textured Comic Inking ===")
    for d_name, d_row in DIRECTIONS:
        for f_idx in range(8):
            frame_filename = f"{action_name}_{d_name}_f{f_idx:02d}.png"
            raw_path = os.path.join(raw_dir, frame_filename)
            if os.path.exists(raw_path):
                with Image.open(raw_path) as im:
                    im_128, im_256 = process_textured_comic_frame(im)
                    master_sheet.paste(im_128, (f_idx * SPRITE_SIZE, d_row * SPRITE_SIZE), im_128)

                    if d_name == "south":
                        south_preview_frames.append(im_256)
            else:
                print(f"Warning: Missing frame {raw_path}")

    # Save PNG spritesheet in hemp_crew dir
    sheet_path = os.path.join(BASE_DIR, f"{output_base_name}.png")
    master_sheet.save(sheet_path, "PNG")
    print(f"Saved: {sheet_path}")

    # Save to public/actions for Sprite Lab
    pub_sheet = os.path.join(PUBLIC_ACTIONS_DIR, f"{output_base_name}.png")
    master_sheet.save(pub_sheet, "PNG")
    print(f"Saved: {pub_sheet}")

    # Save to artifact dir
    art_sheet = os.path.join(ARTIFACT_DIR, f"{output_base_name}.png")
    master_sheet.save(art_sheet, "PNG")

    # Save animated GIF
    if south_preview_frames:
        gif_path = os.path.join(BASE_DIR, f"{output_base_name}.gif")
        south_preview_frames[0].save(
            gif_path,
            save_all=True,
            append_images=south_preview_frames[1:],
            duration=125,
            loop=0,
            disposal=2
        )
        print(f"Saved: {gif_path}")
        
        art_gif = os.path.join(ARTIFACT_DIR, f"{output_base_name}.gif")
        shutil.copyfile(gif_path, art_gif)

# 1. Assemble Phonetic Speech Visemes
assemble_action("viseme", "raw_textured_viseme_frames", "frankie_textured_visemes")

# 2. Assemble Walk Cycle
assemble_action("walk", "raw_textured_walk_frames", "frankie_textured_walk")

# 3. Assemble Idle Rant
assemble_action("idle", "raw_textured_idle_frames", "frankie_textured_idle")

print("\n=== ALL TEXTURED SPRITESHEETS ASSEMBLED ===")
