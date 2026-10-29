import os
from PIL import Image

out_dir = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\actions\hemp_crew"
raw_frames_dir = os.path.join(out_dir, "raw_frankie_frames")

directions = [
    ("north", 0),
    ("west",  1),
    ("south", 2),
    ("east",  3),
]

sprite_size = 128
sheet_width = sprite_size * 8   # 1024 px
sheet_height = sprite_size * 4  # 512 px

master_sheet = Image.new("RGBA", (sheet_width, sheet_height), (0, 0, 0, 0))
front_frames_256 = []

for d_name, d_row in directions:
    for f_idx in range(8):
        frame_num = f_idx + 1
        raw_path = os.path.join(raw_frames_dir, f"frankie_{d_name}_f{frame_num:02d}.png")
        if os.path.exists(raw_path):
            with Image.open(raw_path) as im:
                im_128 = im.resize((sprite_size, sprite_size), Image.Resampling.LANCZOS)
                master_sheet.paste(im_128, (f_idx * sprite_size, d_row * sprite_size), im_128)

                if d_name == "south":
                    im_256 = im.resize((256, 256), Image.Resampling.LANCZOS)
                    front_frames_256.append(im_256)
        else:
            print(f"Warning: Missing frame {raw_path}")

spritesheet_path = os.path.join(out_dir, "frankie_squirrel_idle.png")
master_sheet.save(spritesheet_path, "PNG")
print("Saved Master Spritesheet:", spritesheet_path)

gif_path = os.path.join(out_dir, "frankie_squirrel_idle.gif")
if front_frames_256:
    front_frames_256[0].save(
        gif_path,
        save_all=True,
        append_images=front_frames_256[1:],
        duration=120,
        loop=0,
        disposal=2
    )
    print("Saved Animated Preview GIF:", gif_path)

# Also copy to root actions dir for easy access by Sprite Lab
root_actions_sheet = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\actions\frankie_squirrel_idle.png"
master_sheet.save(root_actions_sheet, "PNG")
print("Saved Root Actions Spritesheet:", root_actions_sheet)

print("=== SPRITESHEET COMPILATION COMPLETE ===")
