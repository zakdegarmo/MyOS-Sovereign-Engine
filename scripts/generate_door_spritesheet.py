import math
from PIL import Image, ImageDraw, ImageFilter

# 5 wide by 2 high sprite sheet
FRAME_W = 200
FRAME_H = 320
COLS = 5
ROWS = 2

SHEET_W = FRAME_W * COLS # 1000px
SHEET_H = FRAME_H * ROWS # 640px

sheet = Image.new("RGBA", (SHEET_W, SHEET_H), (0, 0, 0, 0))

def draw_door_frame(frame_idx):
    """
    Generates a single frame (200x320) of an Exit Door portal.
    Frame 0: Fully closed door.
    Frame 9: Fully open portal archway with glowing vortex.
    """
    img = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    cx, cy = FRAME_W // 2, FRAME_H // 2 + 10
    arch_w, arch_h = 75, 120

    # Progress factor: 0.0 (closed) to 1.0 (fully open)
    open_factor = frame_idx / 9.0

    # 1. Outer Glow Aura (Soft transparent cyan)
    if open_factor > 0:
        glow_img = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
        glow_draw = ImageDraw.Draw(glow_img)
        aura_r = int(arch_w + 15 * open_factor)
        aura_color = (0, 240, 255, int(120 * open_factor))
        glow_draw.ellipse(
            [cx - aura_r, cy - arch_h - 10, cx + aura_r, cy + arch_h + 10],
            fill=aura_color
        )
        glow_img = glow_img.filter(ImageFilter.GaussianBlur(12))
        img.paste(glow_img, (0, 0), glow_img)

    # 2. Portal Interior (Vortex Rings)
    if open_factor > 0.05:
        portal_w = int((arch_w - 12) * open_factor)
        portal_h = int((arch_h - 12) * open_factor)

        # Draw concentric swirling portal rings
        num_rings = 6
        for r_idx in range(num_rings, 0, -1):
            t = r_idx / num_rings
            r_x = int(portal_w * t)
            r_y = int(portal_h * t)
            
            # Color transition: Deep Violet -> Neon Cyan -> White Center
            if r_idx % 2 == 0:
                color = (0, 240, 255, int(220 * open_factor)) # Cyan
            else:
                color = (180, 0, 255, int(200 * open_factor)) # Violet

            draw.ellipse(
                [cx - r_x, cy - r_y, cx + r_x, cy + r_y],
                fill=color
            )

        # Center core white burst
        core_r = int(18 * open_factor)
        draw.ellipse(
            [cx - core_r, cy - core_r, cx + core_r, cy + core_r],
            fill=(255, 255, 255, int(240 * open_factor))
        )

    # 3. Sliding Wooden/Iron Door Panels
    # As open_factor increases, door panels slide outward to the left and right!
    panel_slide = int((arch_w - 8) * open_factor)
    
    # Left Door Panel
    left_x1 = cx - arch_w + 4 - panel_slide
    left_x2 = cx - panel_slide
    if left_x2 > left_x1:
        draw.rectangle([left_x1, cy - arch_h + 6, left_x2, cy + arch_h - 6], fill=(45, 30, 20, 255), outline=(90, 60, 35, 255), width=2)
        # Iron studs
        draw.rectangle([left_x1 + 4, cy - 40, left_x2 - 4, cy - 35], fill=(120, 130, 140, 255))
        draw.rectangle([left_x1 + 4, cy + 35, left_x2 - 4, cy + 40], fill=(120, 130, 140, 255))

    # Right Door Panel
    right_x1 = cx + panel_slide
    right_x2 = cx + arch_w - 4 + panel_slide
    if right_x2 > right_x1:
        draw.rectangle([right_x1, cy - arch_h + 6, right_x2, cy + arch_h - 6], fill=(45, 30, 20, 255), outline=(90, 60, 35, 255), width=2)
        # Iron studs
        draw.rectangle([right_x1 + 4, cy - 40, right_x2 - 4, cy - 35], fill=(120, 130, 140, 255))
        draw.rectangle([right_x1 + 4, cy + 35, right_x2 - 4, cy + 40], fill=(120, 130, 140, 255))

    # 4. Stone & Iron Archway Frame
    # Pillars
    draw.rectangle([cx - arch_w - 12, cy - arch_h, cx - arch_w + 4, cy + arch_h], fill=(70, 75, 85, 255), outline=(30, 35, 45, 255), width=3)
    draw.rectangle([cx + arch_w - 4, cy - arch_h, cx + arch_w + 12, cy + arch_h], fill=(70, 75, 85, 255), outline=(30, 35, 45, 255), width=3)

    # Top Arch Header / Keystone
    draw.rectangle([cx - arch_w - 18, cy - arch_h - 20, cx + arch_w + 18, cy - arch_h + 4], fill=(85, 90, 100, 255), outline=(30, 35, 45, 255), width=3)
    draw.rectangle([cx - 20, cy - arch_h - 26, cx + 20, cy - arch_h + 6], fill=(0, 200, 240, 255), outline=(255, 255, 255, 255), width=2) # Keystone Rune

    # Threshold Base
    draw.rectangle([cx - arch_w - 24, cy + arch_h - 4, cx + arch_w + 24, cy + arch_h + 16], fill=(40, 45, 55, 255), outline=(20, 25, 30, 255), width=3)

    return img

print("Generating 5x2 Exit Door Sprite Sheet...")
for idx in range(10):
    col = idx % COLS
    row = idx // COLS
    frame_img = draw_door_frame(idx)
    sheet.paste(frame_img, (col * FRAME_W, row * FRAME_H), frame_img)

out_path = "apps/web/public/textures/objects/door_exit.png"
sheet.save(out_path, "PNG")
print(f"Saved pristine RGBA transparent sprite sheet to {out_path} ({SHEET_W}x{SHEET_H})!")
