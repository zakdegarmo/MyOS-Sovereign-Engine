import os
import shutil
from PIL import Image, ImageFilter, ImageEnhance
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

def process_comic_ink_frame(im_raw):
    """
    Applies authentic underground comic book inking:
    - 100% matte cel color (zero specular shine)
    - Solid black comic ink outlines (silhouette & structural line art)
    - Distinguishes head from tail and outlines every facial/costume seam
    - Downscaled to 128x128 with Lanczos + UnsharpMask to ensure crisp inked linework
    """
    im_rgba = im_raw.convert("RGBA")
    alpha = im_rgba.split()[3]
    
    # 1. Bold Silhouette Outline (2 iterations dilation at 512px -> solid 1-2px line at 128px)
    alpha_edge = alpha.filter(ImageFilter.FIND_EDGES)
    silhouette = (np.array(alpha_edge) > 20)
    silhouette_bold = binary_dilation(silhouette, iterations=2)

    # 2. Structural Comic Inking (Head-tail boundary, suit, collar, tie, buck teeth, whiskers, joint, eyes)
    gray = im_rgba.convert("L")
    gray_smooth = gray.filter(ImageFilter.GaussianBlur(radius=0.8))
    edges = gray_smooth.filter(ImageFilter.FIND_EDGES)
    edge_arr = np.array(edges)
    alpha_arr = np.array(alpha)

    # Threshold for internal feature lines (22 detects head-tail contrast cleanly)
    internal_ink = (edge_arr > 22) & (alpha_arr > 100)
    internal_ink_bold = binary_dilation(internal_ink, iterations=1)

    # Total Comic Lineart
    total_ink = silhouette_bold | internal_ink_bold

    # Solid Comic Book Black Ink (RGB 10, 10, 14, Alpha 255)
    arr = np.array(im_rgba)
    arr[total_ink, 0] = 10
    arr[total_ink, 1] = 10
    arr[total_ink, 2] = 14
    arr[total_ink, 3] = np.maximum(arr[total_ink, 3], 240)

    inked_512 = Image.fromarray(arr, "RGBA")

    # Downscale with Lanczos to 128x128
    im_128 = inked_512.resize((SPRITE_SIZE, SPRITE_SIZE), Image.Resampling.LANCZOS)
    im_128_crisp = im_128.filter(ImageFilter.UnsharpMask(radius=1.0, percent=150, threshold=1))

    # Crisp 256 preview for GIF
    im_256 = inked_512.resize((256, 256), Image.Resampling.LANCZOS).filter(
        ImageFilter.UnsharpMask(radius=1.0, percent=130, threshold=1)
    )

    return im_128_crisp, im_256

def assemble_action(action_name, raw_folder_name, output_base_name):
    raw_dir = os.path.join(BASE_DIR, raw_folder_name)
    if not os.path.exists(raw_dir):
        print(f"Directory not found: {raw_dir}")
        return

    master_sheet = Image.new("RGBA", (SHEET_WIDTH, SHEET_HEIGHT), (0, 0, 0, 0))
    south_preview_frames = []

    print(f"\n=== Assembling {action_name.upper()} with Solid Comic Inking ===")
    for d_name, d_row in DIRECTIONS:
        for f_idx in range(8):
            frame_filename = f"{action_name}_{d_name}_f{f_idx:02d}.png"
            raw_path = os.path.join(raw_dir, frame_filename)
            if os.path.exists(raw_path):
                with Image.open(raw_path) as im:
                    im_128, im_256 = process_comic_ink_frame(im)
                    master_sheet.paste(im_128, (f_idx * SPRITE_SIZE, d_row * SPRITE_SIZE), im_128)

                    if d_name == "south":
                        south_preview_frames.append(im_256)
            else:
                print(f"Warning: Missing frame {raw_path}")

    # Save PNG spritesheet in hemp_crew dir
    sheet_path = os.path.join(BASE_DIR, f"{output_base_name}.png")
    master_sheet.save(sheet_path, "PNG")
    print(f"Saved: {sheet_path}")

    # Save to public/actions for Mephit / Sprite Lab
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
        
        # Copy gif to artifact dir
        art_gif = os.path.join(ARTIFACT_DIR, f"{output_base_name}.gif")
        shutil.copyfile(gif_path, art_gif)

# 1. Assemble Phonetic Speech Visemes
assemble_action("viseme", "raw_viseme_frames", "frankie_squirrel_visemes")

# 2. Assemble Walk Cycle
assemble_action("walk", "raw_walk_frames", "frankie_squirrel_walk")

# 3. Assemble Idle Rant
assemble_action("idle", "raw_idle_frames", "frankie_squirrel_idle")

print("\n=== ALL SPRITESHEETS ASSEMBLED WITH SOLID COMIC INKING ===")
