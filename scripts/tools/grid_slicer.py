import cv2
import os
import glob

def slice_grid(file_path, output_dir, columns=10, rows=7, card_w=819, card_h=1118, max_cards=70):
    print(f"Slicing {os.path.basename(file_path)}...")
    img = cv2.imread(file_path, cv2.IMREAD_UNCHANGED)
    if img is None:
        print(f"Failed to load {file_path}")
        return

    base_name = os.path.splitext(os.path.basename(file_path))[0]
    count = 0
    
    for r in range(rows):
        for c in range(columns):
            if count >= max_cards:
                break
                
            x = c * card_w
            y = r * card_h
            
            # Ensure we don't go out of bounds due to rounding
            x2 = min(x + card_w, img.shape[1])
            y2 = min(y + card_h, img.shape[0])
            
            card_img = img[y:y2, x:x2]
            
            # Save
            out_name = f"{base_name}_card_{count+1:03d}.png"
            out_path = os.path.join(output_dir, out_name)
            cv2.imwrite(out_path, card_img)
            count += 1
            
    print(f"  -> Extracted {count} cards from {base_name}")

if __name__ == "__main__":
    target_dir = r"C:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\integrations\5e spell cards individual"
    output_dir = os.path.join(target_dir, "sliced_grid")
    
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    composites = sorted(glob.glob(os.path.join(target_dir, "5espells*.png")))
    
    for comp in composites:
        # Sheet 5 explicitly says (42cards) in the filename
        if "42cards" in comp:
            slice_grid(comp, output_dir, max_cards=42)
        else:
            slice_grid(comp, output_dir, max_cards=70)
            
    print("Mathematical grid slicing complete! Check the 'sliced_grid' folder.")
