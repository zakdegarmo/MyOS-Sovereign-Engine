import cv2
import numpy as np
import os
import glob

def slice_composite(file_path, output_dir):
    print(f"Processing {os.path.basename(file_path)}...")
    
    # Load the image
    img = cv2.imread(file_path, cv2.IMREAD_UNCHANGED)
    if img is None:
        print(f"Failed to load {file_path}")
        return

    # If image has alpha channel, create a mask from it
    if img.shape[2] == 4:
        # Extract alpha channel
        alpha = img[:, :, 3]
        # Binarize: anything mostly opaque becomes white (255)
        _, thresh = cv2.threshold(alpha, 10, 255, cv2.THRESH_BINARY)
    else:
        # Grayscale and threshold
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        # Assuming cards are dark/light against a contrasting background
        blur = cv2.GaussianBlur(gray, (5, 5), 0)
        _, thresh = cv2.threshold(blur, 240, 255, cv2.THRESH_BINARY_INV)

    # Find contours
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    # Filter and sort contours (top-to-bottom, left-to-right approximation)
    cards = []
    min_area = 50000 # Minimum pixels to be considered a card (e.g., 200x250)
    
    for cnt in contours:
        x, y, w, h = cv2.boundingRect(cnt)
        area = w * h
        aspect_ratio = float(w) / h
        
        # D&D cards are typically portrait (aspect ratio around 0.65 to 0.8) 
        # but let's be generous just in case they are slightly different.
        if area > min_area and 0.4 < aspect_ratio < 1.5:
            cards.append((x, y, w, h))
            
    # Sort by Y first (rows), then X (columns)
    # We round Y to nearest ~100 to group by rows
    cards.sort(key=lambda b: (round(b[1]/200)*200, b[0]))
    
    base_name = os.path.splitext(os.path.basename(file_path))[0]
    
    for i, (x, y, w, h) in enumerate(cards):
        # Crop
        card_img = img[y:y+h, x:x+w]
        
        # Save
        out_name = f"{base_name}_card_{i+1:03d}.png"
        out_path = os.path.join(output_dir, out_name)
        cv2.imwrite(out_path, card_img)
        
    print(f"  -> Extracted {len(cards)} cards from {base_name}")

if __name__ == "__main__":
    target_dir = r"C:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\integrations\5e spell cards individual"
    output_dir = os.path.join(target_dir, "sliced")
    
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    # Find all composite images
    composites = glob.glob(os.path.join(target_dir, "5espells*.png"))
    
    for comp in composites:
        slice_composite(comp, output_dir)
        
    print("Slicing complete. Check the 'sliced' folder!")
