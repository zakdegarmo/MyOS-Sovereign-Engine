#!/usr/bin/env python3
"""
LPC Multi-Sprite Sheet Slicer & Transparent Alpha Background Remover (`slice_lpc_sheet.py`)
Scans LPC sprite sheets, slices individual objects using bounding box contour detection,
strips solid background colors to transparent PNG alpha, and indexes metadata into MyOS SQLite Vector Store.
"""

import argparse
import datetime
import json
import os
import sqlite3
import struct
import urllib.request
import uuid
from PIL import Image

def parse_args():
    parser = argparse.ArgumentParser(description="Slice LPC multi-sprite sheets and strip background to transparent alpha PNG.")
    parser.add_argument("--sheet", type=str, required=True, help="Path to input sprite sheet image file.")
    parser.add_argument("--category", type=str, default="furniture", help="Category: furniture, props, monsters, set_dressing, weapons.")
    parser.add_argument("--output-dir", type=str, default="apps/web/public/assets/lpc/sliced", help="Directory to save sliced transparent PNGs.")
    parser.add_argument("--db-path", type=str, default="data/myos_vector_store.db", help="Path to SQLite database file.")
    parser.add_argument("--min-size", type=int, default=16, help="Minimum pixel dimension to slice.")
    return parser.parse_args()

def remove_background(img):
    """Converts image to RGBA and strips white/solid background colors to transparent alpha."""
    img = img.convert("RGBA")
    datas = img.getdata()
    
    # Get corner pixel color as background reference
    bg_color = datas[0]
    
    new_data = []
    for item in datas:
        # If pixel matches background color (with tolerance), make transparent
        if abs(item[0] - bg_color[0]) < 15 and abs(item[1] - bg_color[1]) < 15 and abs(item[2] - bg_color[2]) < 15:
            new_data.append((0, 0, 0, 0))
        else:
            new_data.append(item)
            
    img.putdata(new_data)
    return img

def slice_grid(img_path, min_size=16):
    img = Image.open(img_path)
    img_transparent = remove_background(img)
    
    # Quick grid bounding box detection (32x32 / 64x64 tiles)
    width, height = img_transparent.size
    slices = []
    
    tile_w, tile_h = 32, 32
    if width % 64 == 0 and height % 64 == 0:
        tile_w, tile_h = 64, 64

    for y in range(0, height, tile_h):
        for x in range(0, width, tile_w):
            box = (x, y, x + tile_w, y + tile_h)
            crop = img_transparent.crop(box)
            
            # Check if crop has visible non-transparent content
            extrema = crop.getextrema()
            alpha_extrema = extrema[3] if len(extrema) == 4 else None
            
            if alpha_extrema and alpha_extrema[1] > 0:
                slices.append((crop, x, y))
                
    return slices

def main():
    args = parse_args()
    if not os.path.exists(args.sheet):
        print(f"[!] Sprite sheet not found: {args.sheet}")
        return

    sheet_name = os.path.splitext(os.path.basename(args.sheet))[0]
    out_folder = os.path.join(args.output_dir, sheet_name)
    os.makedirs(out_folder, exist_ok=True)

    print(f"[*] Slicing and stripping background for: {args.sheet}...")
    slices = slice_grid(args.sheet, args.min_size)
    print(f"[+] Found {len(slices)} non-empty sprite objects.")

    db_abs = os.path.abspath(args.db_path)
    os.makedirs(os.path.dirname(db_abs), exist_ok=True)
    conn = sqlite3.connect(db_abs)
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS vectors (
            id TEXT PRIMARY KEY,
            type TEXT,
            timestamp TEXT,
            text TEXT,
            embedding BLOB
        );
    """)
    conn.commit()

    saved_count = 0
    for idx, (crop_img, x, y) in enumerate(slices):
        filename = f"{sheet_name}_x{x}_y{y}.png"
        file_path = os.path.join(out_folder, filename)
        crop_img.save(file_path, "PNG")
        saved_count += 1
        
        # Web relative path for loading in Three.js
        rel_web_path = f"/assets/lpc/sliced/{sheet_name}/{filename}"
        
        node_id = str(uuid.uuid4())
        ts = datetime.datetime.now(datetime.timezone.utc).isoformat()
        metadata_text = f"SPRITE: {filename}\nSHEET: {sheet_name}\nCATEGORY: {args.category}\nURL: {rel_web_path}\nGRID_OFFSET: ({x}, {y})"
        
        cursor.execute(
            "INSERT INTO vectors (id, type, timestamp, text, embedding) VALUES (?, ?, ?, ?, ?)",
            (node_id, "sprite_asset", ts, metadata_text, None)
        )

    conn.commit()
    conn.close()
    print(f"[SUCCESS] Sliced and indexed {saved_count} transparent PNG sprites to: {out_folder}")

if __name__ == "__main__":
    main()
