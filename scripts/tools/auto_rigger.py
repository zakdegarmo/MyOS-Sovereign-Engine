from PIL import Image, ImageDraw
import os

LPC_BODY_PATH = r"C:\Users\zakde\Desktop\AntiGravity projects\MyOS\assets\chargen_data\textures\character\body\humanoid_f1.png"
LPC_HEAD_PATH = r"C:\Users\zakde\Desktop\AntiGravity projects\MyOS\assets\chargen_data\textures\character\head\human_f.png"
OUTPUT_DIR = r"C:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\textures\avatars\custom"

def get_joints_for_walk_down(col):
    """Returns chibi/caricature joint coordinates for the LPC Walk Down cycle."""
    # Chibi proportions (Big head, short torso, short legs)
    head = (32, 23)
    neck = (32, 34)
    pelvis = (32, 45)
    l_sho, r_sho = (24, 34), (40, 34)
    l_hip, r_hip = (27, 45), (37, 45)
    
    # Defaults for Idle (Cols 0, 4, 8)
    l_elb, r_elb = (21, 42), (43, 42)
    l_wri, r_wri = (19, 51), (45, 51)
    l_kne, r_kne = (26, 53), (38, 53)
    l_ank, r_ank = (26, 60), (38, 60)

    if col in [1, 2, 3]: # Right leg step
        swing = 3 if col == 2 else 1
        l_elb, l_wri = (21, 42 + swing), (19, 51 + swing*2)
        r_elb, r_wri = (43, 42 - swing), (45, 51 - swing*2)
        r_kne, r_ank = (38, 53 + swing), (38, 60 + swing*2)
        l_kne, l_ank = (26, 53 - swing), (26, 60 - swing*2)
        
    elif col in [5, 6, 7]: # Left leg step
        swing = 3 if col == 6 else 1
        r_elb, r_wri = (43, 42 + swing), (45, 51 + swing*2)
        l_elb, l_wri = (21, 42 - swing), (19, 51 - swing*2)
        l_kne, l_ank = (26, 53 + swing), (26, 60 + swing*2)
        r_kne, r_ank = (38, 53 - swing), (38, 60 - swing*2)

    return {
        "head": head, "neck": neck, "pelvis": pelvis,
        "l_sho": l_sho, "r_sho": r_sho, "l_hip": l_hip, "r_hip": r_hip,
        "l_elb": l_elb, "r_elb": r_elb, "l_wri": l_wri, "r_wri": r_wri,
        "l_kne": l_kne, "r_kne": r_kne, "l_ank": l_ank, "r_ank": r_ank
    }

def create_canny_rig(img_frame, col):
    """Builds the silhouette and draws the chibi rig inside."""
    silhouette = Image.new("RGB", (64, 64), (0, 0, 0))
    pixels = img_frame.load()
    sil_pixels = silhouette.load()
    
    # Fill silhouette with dark grey
    for y in range(64):
        for x in range(64):
            if pixels[x, y][3] > 0:
                sil_pixels[x, y] = (80, 80, 80) 
                
    # Draw Bones
    draw = ImageDraw.Draw(silhouette)
    j = get_joints_for_walk_down(col)
    
    bones = [
        ("head", "neck"), ("neck", "pelvis"),
        ("neck", "l_sho"), ("l_sho", "l_elb"), ("l_elb", "l_wri"),
        ("neck", "r_sho"), ("r_sho", "r_elb"), ("r_elb", "r_wri"),
        ("pelvis", "l_hip"), ("l_hip", "l_kne"), ("l_kne", "l_ank"),
        ("pelvis", "r_hip"), ("r_hip", "r_kne"), ("r_kne", "r_ank"),
        ("l_sho", "r_sho"), ("l_hip", "r_hip") # Connect shoulders and hips like user drew
    ]
    
    for p1, p2 in bones:
        draw.line([j[p1], j[p2]], fill=(255, 255, 255), width=1)
        
    # Draw Massive Head Circle (Chibi style)
    hx, hy = j["head"]
    draw.ellipse([hx-9, hy-9, hx+9, hy+9], outline=(255, 255, 255), width=1)
    
    # Draw Hands (User's yellow circles)
    lwx, lwy = j["l_wri"]
    rwx, rwy = j["r_wri"]
    draw.ellipse([lwx-2, lwy-1, lwx+2, lwy+1], outline=(255, 255, 255), width=1)
    draw.ellipse([rwx-2, rwy-1, rwx+2, rwy+1], outline=(255, 255, 255), width=1)
    
    # Draw Feet (User's yellow circles)
    lax, lay = j["l_ank"]
    rax, ray = j["r_ank"]
    draw.ellipse([lax-3, lay-1, lax+3, lay+1], outline=(255, 255, 255), width=1)
    draw.ellipse([rax-3, ray-1, rax+3, ray+1], outline=(255, 255, 255), width=1)

    return silhouette.resize((512, 512), Image.Resampling.NEAREST)

def main():
    print("Compositing Modular Head onto Body...")
    body_base = Image.open(LPC_BODY_PATH).convert("RGBA")
    head_base = Image.open(LPC_HEAD_PATH).convert("RGBA")
    
    # Merge them so the silhouette has a head!
    full_character = Image.alpha_composite(body_base, head_base)
    
    row = 10 # Walk Down
    
    print("Auto-Rigging Anatomical Skeletons with Head attached...")
    for col in range(3):
        crop_box = (col * 64, row * 64, (col + 1) * 64, (row + 1) * 64)
        frame = full_character.crop(crop_box)
        
        rig_map = create_canny_rig(frame, col)
        out_path = os.path.join(OUTPUT_DIR, f"canny_rig_full_frame_{col}.png")
        rig_map.save(out_path)
        print(f"Saved Full Rig: {out_path}")

if __name__ == "__main__":
    main()
