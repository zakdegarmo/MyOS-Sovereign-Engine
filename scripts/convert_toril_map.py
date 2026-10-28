import os
from PIL import Image, ImageOps, ImageEnhance

# Disable decompression bomb limit for high-res TIFs
Image.MAX_IMAGE_PIXELS = None

tif_path = "apps/web/src/assets/HandsomeRobs_map_of_Toril-TorilMap.tif"
out_dir = "apps/web/public/assets/textures"
os.makedirs(out_dir, exist_ok=True)

out_heightmap = os.path.join(out_dir, "toril_heightmap.png")
out_texture = os.path.join(out_dir, "toril_texture.png")

print(f"[Toril Map Converter] Loading TIF from {tif_path}...")
img = Image.open(tif_path)
print(f"[Toril Map Converter] Original Dimensions: {img.size}, Mode: {img.mode}")

# 1. Downsample for WebGL Performance (1024x1024 optimal heightmap size)
target_size = (1024, 1024)
print(f"[Toril Map Converter] Resizing map to {target_size} for web engine...")
resized_color = img.resize(target_size, Image.Resampling.LANCZOS).convert("RGB")
resized_color.save(out_texture, "PNG")
print(f"[Toril Map Converter] Saved color texture to {out_texture}")

# 2. Convert to Grayscale Heightmap
grayscale = ImageOps.grayscale(resized_color)

# Enhance contrast for sharp terrain displacement
enhancer = ImageEnhance.Contrast(grayscale)
heightmap = enhancer.enhance(1.8)

heightmap.save(out_heightmap, "PNG")
print(f"[Toril Map Converter] Saved heightmap to {out_heightmap}")
print("[Toril Map Converter] Conversion complete!")
