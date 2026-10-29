import cv2
import numpy as np
import os
import argparse
from PIL import Image

def process_image(img_path, out_dir):
    print(f"Processing: {img_path}")
    try:
        pil_img = Image.open(img_path).convert("RGBA")
    except Exception as e:
        print(f"Error loading {img_path}: {e}")
        return
        
    img = np.array(pil_img)
    r, g, b, a = cv2.split(img)
    img_bgra = cv2.merge((b, g, r, a))

    gray = cv2.cvtColor(cv2.merge((b, g, r)), cv2.COLOR_BGR2GRAY)
    _, non_black_mask = cv2.threshold(gray, 5, 255, cv2.THRESH_BINARY)
    _, non_transparent_mask = cv2.threshold(a, 5, 255, cv2.THRESH_BINARY)
    
    final_mask = cv2.bitwise_and(non_black_mask, non_transparent_mask)

    # Use RETR_EXTERNAL to get only the outer islands
    contours, _ = cv2.findContours(final_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    debug_img = img_bgra.copy()
    base_name = os.path.splitext(os.path.basename(img_path))[0]
    save_dir = os.path.join(out_dir, base_name)
    os.makedirs(save_dir, exist_ok=True)

    island_count = 0
    for contour in contours:
        # Ignore tiny 1-5 pixel noise artifacts
        if cv2.contourArea(contour) < 10:
            continue
            
        x, y, w, h = cv2.boundingRect(contour)
        
        cv2.rectangle(debug_img, (x, y), (x+w, y+h), (0, 0, 255, 255), 1)
        cv2.putText(debug_img, str(island_count), (x, y-5), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 255, 0, 255), 1)

        cropped = img_bgra[y:y+h, x:x+w].copy()
        
        b_c, g_c, r_c, a_c = cv2.split(cropped)
        crop_gray = cv2.cvtColor(cv2.merge((b_c, g_c, r_c)), cv2.COLOR_BGR2GRAY)
        _, crop_non_black = cv2.threshold(crop_gray, 5, 255, cv2.THRESH_BINARY)
        
        final_a_c = cv2.bitwise_and(a_c, crop_non_black)
        final_cropped = cv2.merge((b_c, g_c, r_c, final_a_c))

        out_path = os.path.join(save_dir, f"{base_name}_part_{island_count}.png")
        cv2.imwrite(out_path, final_cropped)
        island_count += 1

    debug_path = os.path.join(save_dir, f"_DEBUG_OVERVIEW_{base_name}.png")
    cv2.imwrite(debug_path, debug_img)
    print(f"  -> Extracted {island_count} assets.")

def process_directory(input_path, out_dir):
    if os.path.isfile(input_path):
        process_image(input_path, out_dir)
    elif os.path.isdir(input_path):
        for root, _, files in os.walk(input_path):
            for file in files:
                if file.lower().endswith(".png"):
                    process_image(os.path.join(root, file), out_dir)
    else:
        print("Input path is neither a file nor a directory.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Extract individual assets using alpha/black island detection.")
    parser.add_argument("--input", required=True, help="Path to input PNG or Directory containing PNGs")
    parser.add_argument("--out_dir", required=True, help="Directory to save extracted billboards")
    args = parser.parse_args()
    
    process_directory(args.input, args.out_dir)
