import os
from PIL import Image

def canonicalize():
    input_path = r"c:\Users\zakde\.gemini\antigravity\scratch\MyOS\apps\web\public\textures\multi_spritesheet.jpg"
    output_path = r"c:\Users\zakde\.gemini\antigravity\scratch\MyOS\apps\web\public\textures\canonical_sprites.png"
    
    if not os.path.exists(input_path):
        print(f"Error: Input file {input_path} not found.")
        return

    # Load original
    img = Image.open(input_path).convert("RGBA")
    width, height = img.size
    
    # Discovery parameters (Based on SpriteSheetAvatar.tsx)
    slot_size = 64
    cols_of_characters = 5
    frames_per_anim = 3
    num_animations = 4
    num_characters = 10
    
    # Background color to remove: #D7DCE2 (215, 220, 226)
    bg_color = (215, 220, 226)
    
    # Target grid: 12 frames wide (4 anims * 3 frames), 10 characters high
    # We'll use 128x128 slots for the output for future-proofing and better spacing
    target_slot = 128
    out_w = (frames_per_anim * num_animations) * target_slot # 12 * 128 = 1536
    out_h = num_characters * target_slot # 10 * 128 = 1280
    
    output_img = Image.new("RGBA", (out_w, out_h), (0, 0, 0, 0))
    
    for char_idx in range(num_characters):
        char_col = char_idx % cols_of_characters
        char_row = char_idx // cols_of_characters
        
        for anim_idx in range(num_animations):
            for frame_idx in range(frames_per_anim):
                # Calculate source coordinates
                src_x = (char_col * frames_per_anim + frame_idx) * slot_size
                src_y = (char_row * num_animations + anim_idx) * slot_size
                
                # Check bounds
                if src_x + slot_size > width or src_y + slot_size > height:
                    # Fill with empty if out of bounds (The 547px height issues)
                    print(f"Warning: Frame {char_idx}/{anim_idx}/{frame_idx} out of bounds at ({src_x}, {src_y})")
                    continue
                
                # Crop frame
                frame = img.crop((src_x, src_y, src_x + slot_size, src_y + slot_size))
                
                # Remove background (Alpha Keying)
                data = frame.getdata()
                new_data = []
                for item in data:
                    # Tolerance for JPEG artifacts
                    dist = sum((a - b)**2 for a, b in zip(item[:3], bg_color))**0.5
                    if dist < 30: # Tolerance threshold
                        new_data.append((0, 0, 0, 0))
                    else:
                        new_data.append(item)
                frame.putdata(new_data)
                
                # Paste into output grid
                # Output layout: X-axis = Animations (0..3) then Frames (0..2), Y-axis = Characters (0..9)
                dest_x = (anim_idx * frames_per_anim + frame_idx) * target_slot
                dest_y = char_idx * target_slot
                
                # Center the 64px frame in the 128px slot
                offset = (target_slot - slot_size) // 2
                output_img.paste(frame, (dest_x + offset, dest_y + offset), frame)

    output_img.save(output_path, "PNG")
    print(f"Success: Canonical spritesheet saved to {output_path}")

if __name__ == "__main__":
    canonicalize()
