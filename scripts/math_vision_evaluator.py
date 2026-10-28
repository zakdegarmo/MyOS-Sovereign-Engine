import os
import json
from PIL import Image

def get_bounding_box(image_path):
    try:
        with Image.open(image_path) as img:
            img = img.convert("RGBA")
            # The standard idle front-facing frame (walk down, frame 0)
            # x: 0 to 64, y: 640 to 704
            frame = img.crop((0, 640, 64, 704))
            
            # Find bounding box of non-transparent pixels
            bbox = frame.getbbox()
            return bbox # (left, upper, right, lower)
    except Exception as e:
        return None

def evaluate_assets():
    base_dir = os.path.join("apps", "web", "public", "textures", "avatars", "lpc")
    out_file = os.path.join(base_dir, "math_ontology.json")
    
    results = {
        "Hat_or_Hair": [],
        "Feet_or_Shoes": [],
        "Full_Body": [],
        "Empty_or_Anomaly": [],
        "Other": []
    }
    
    count = 0
    # Evaluate a subset to see how accurate our math is
    for root, _, files in os.walk(base_dir):
        for f in files:
            if not f.endswith(".png"): continue
                
            file_path = os.path.join(root, f)
            bbox = get_bounding_box(file_path)
            
            rel_path = os.path.relpath(file_path, base_dir).replace("\\", "/")
            
            if not bbox:
                results["Empty_or_Anomaly"].append(rel_path)
            else:
                left, upper, right, lower = bbox
                height = lower - upper
                
                # Heuristics based on 64x64 grid
                if lower < 32:
                    # Everything is in the top half of the grid
                    results["Hat_or_Hair"].append(rel_path)
                elif upper > 48:
                    # Everything is in the very bottom of the grid
                    results["Feet_or_Shoes"].append(rel_path)
                elif height > 40:
                    # Spans most of the vertical space
                    results["Full_Body"].append(rel_path)
                else:
                    results["Other"].append(f"{rel_path} (Y: {upper}-{lower})")
                    
            count += 1
            if count > 500: # Just testing first 500
                break
        if count > 500:
            break
            
    with open(out_file, "w") as f:
        json.dump(results, f, indent=4)
        
    print(f"Evaluated {count} assets using mathematical bounding boxes.")
    print("Results saved to math_ontology.json")

if __name__ == "__main__":
    evaluate_assets()
