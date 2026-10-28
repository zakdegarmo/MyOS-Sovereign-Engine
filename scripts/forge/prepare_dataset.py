import os
import json

DATASET_DIR = r"C:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\textures\avatars\custom\training_set"

def main():
    metadata_path = os.path.join(DATASET_DIR, "metadata.jsonl")
    
    pngs = [f for f in os.listdir(DATASET_DIR) if f.endswith(".png")]
    count = 0
    
    with open(metadata_path, "w", encoding="utf-8") as f_out:
        for png_file in pngs:
            txt_file = png_file.replace(".png", ".txt")
            txt_path = os.path.join(DATASET_DIR, txt_file)
            
            if os.path.exists(txt_path):
                with open(txt_path, "r", encoding="utf-8") as f_in:
                    caption = f_in.read().strip()
                    
                # Append the common LPC suffix
                prompt = f"{caption}, lpc spritesheet, 832x1344 grid, multiple animation frames, pixel art"
                
                entry = {
                    "file_name": png_file,
                    "text": prompt
                }
                f_out.write(json.dumps(entry) + "\n")
                count += 1
                
    print(f"Generated metadata.jsonl with {count} entries.")

if __name__ == "__main__":
    main()
