# Technical Analysis & Architecture Specification: `tools/generate_lpc_sheet.py`

**Target File**: `tools/generate_lpc_sheet.py`  
**Author**: Explorer 3 (`teamwork_preview_explorer_m1_3`)  
**Date**: 2026-08-01  
**Milestone**: Milestone 1 - LPC Sprite Sheet Generation Pipeline Technical Analysis & Architecture Spec  

---

## 1. Executive Summary

This report establishes the complete technical requirements, architectural design, prompt engineering methodology, background alpha conversion algorithms, and production implementation specification for `tools/generate_lpc_sheet.py`.

The generator script serves as the core automated AI asset creation engine for the Liberated Pixel Cup (LPC) sprite sheet pipeline on host hardware equipped with an **NVIDIA GeForce RTX 4060 Ti GPU (8 GB VRAM)** running inside the `tools/comfy_env` virtual environment.

---

## 2. Technical Requirements Breakdown

### 2.1 Target Sprite Sheet Grid & Dimensions
- **Canvas Resolution**: **832 x 1344 pixels** (Width x Height).
- **Frame Tile Dimensions**: **64 x 64 pixels**.
- **Grid Layout**: **13 columns x 21 rows** = **273 frame slots**.
- **LPC Standard Animation Row Layout**:
  - **Rows 0–3**: Spellcast (Up, Left, Down, Right) — 7 frames per direction (cols 0..6).
  - **Rows 4–7**: Thrust / Spear (Up, Left, Down, Right) — 8 frames per direction (cols 0..7).
  - **Rows 8–11**: Walk Cycle (Up, Left, Down, Right) — 9 frames per direction (cols 0..8).
  - **Rows 12–15**: Slash / Sword Attack (Up, Left, Down, Right) — 6 frames per direction (cols 0..5).
  - **Rows 16–19**: Shoot / Bow (Up, Left, Down, Right) — 13 frames per direction (cols 0..12).
  - **Row 20**: Hurt / Collapse — 6 frames (cols 0..5).
- **Canvas Scale Compliance**: The output PNG file must be rendered at exactly 832x1344 px. If the diffusion pipeline generates at a different aspect ratio or resolution (e.g. 512x512, 768x768, or 1024x1024), nearest-neighbor or high-quality Lanczos resampling with aspect preservation must format the final sheet to exactly 832x1344 px without blurring pixel edges.

---

### 2.2 Diffusers Pipeline & Hardware Optimization Architecture

#### Hardware Constraints
- **GPU**: NVIDIA GeForce RTX 4060 Ti (8 GB VRAM, Ada Lovelace architecture, CUDA compute 8.9 / CUDA 12.4).
- **Python Environment**: `tools/comfy_env/Scripts/python.exe` (Python 3.13.5).

#### Pipeline Selection & Execution Strategy
The generator supports loading HuggingFace `diffusers` pipelines (`StableDiffusionPipeline` for SD 1.5 or `StableDiffusionXLPipeline` for SDXL):
1. **Primary Model Target**: `runwayml/stable-diffusion-v1-5` or local checkpoint/LoRA fine-tuned for pixel art.
2. **VRAM Memory Optimization (8 GB Cap)**:
   - **Precision**: `torch.float16` to halve VRAM allocation (~3.5 GB peak VRAM).
   - **Attention Slicing**: `pipe.enable_attention_slicing()` to split attention computation into sequential steps.
   - **VAE Slicing & Tiling**: `pipe.enable_vae_slicing()` and `pipe.enable_vae_tiling()` to avoid OOM during decoding large canvas frames.
   - **CPU Offloading**: `pipe.enable_model_cpu_offload()` dynamically swaps model components between System RAM and GPU VRAM if required.
3. **Offline / Fallback Architecture**:
   - In environments without internet access or when model weights cannot be fetched dynamically, the pipeline catches network/import errors gracefully and falls back to an offline synthetic pattern generator that renders an exact 832x1344 64x64 grid layout with solid background keying for pipeline testing.

---

### 2.3 Prompt Engineering Strategy for LPC Pixel Art

#### Prompt Structure Design
AI generation of full sprite sheets requires explicit stylistic constraints to prevent 3D rendering, anti-aliased gradients, or uneven grid spacing.

- **Positive Prompt Pattern**:
  ```text
  LPC sprite sheet, 64x64 character animations, 2D pixel art style, Liberated Pixel Cup, walk cycle, hurt animation, slash attack, spellcast, 13x21 uniform grid layout, solid green background, sharp pixel outlines, 16-bit RPG sprite sheet, full body character
  ```

- **Negative Prompt Pattern**:
  ```text
  3D render, photorealistic, smooth gradients, blurred edges, anti-aliasing, photographic background, noisy texture, distorted limbs, incomplete grid, shadows on background color, extra frames
  ```

- **Inference Hyperparameters**:
  - **Seed**: Configurable via `--seed` (default: `42`) for deterministic output.
  - **Guidance Scale (CFG)**: `7.5` – `9.0` to enforce strong style adherence.
  - **Inference Steps**: `30` – `50` steps.

---

### 2.4 Alpha Transparency Conversion Algorithm (Pillow + NumPy)

The diffusion pipeline outputs a solid background (e.g. Pure Green `#00FF00`, Magenta `#FF00FF`, Solid White `#FFFFFF`, or Solid Black `#000000`). The script transforms this solid color background into a true PNG 32-bit RGBA alpha channel using high-performance vector processing.

#### Algorithm Steps:
1. **Load Image & Convert to RGBA**:
   - Open Pillow `Image` and ensure mode is `"RGBA"`.
2. **Auto Corner Color Detection**:
   - Sample four extreme corner pixels: `(0, 0)`, `(W-1, 0)`, `(0, H-1)`, `(W-1, H-1)`.
   - Calculate dominant background RGB tuple $C_{bg} = (R_{bg}, G_{bg}, B_{bg})$ if `--bg-color auto` is specified.
3. **Color Distance Keying (Euclidean Thresholding)**:
   - For every pixel $(R, G, B)$ in the image, compute Euclidean distance to background color:
     $$D(p) = \sqrt{(R - R_{bg})^2 + (G - G_{bg})^2 + (B - B_{bg})^2}$$
   - Apply user tolerance threshold $T$ (default: `30`):
     - If $D(p) \le T \implies \text{Alpha} = 0$ (Transparent).
     - If $D(p) > T \implies \text{Alpha} = 255$ (Opaque).
4. **NumPy Array Vectorization**:
   - Perform calculation across the $(1344, 832, 4)$ uint8 array in C speed using NumPy indexing:
     ```python
     img_np = np.array(img)
     rgb = img_np[:, :, :3].astype(np.int32)
     bg_rgb = np.array(target_bg_color, dtype=np.int32)
     dist = np.sqrt(np.sum((rgb - bg_rgb) ** 2, axis=2))
     img_np[dist <= tolerance, 3] = 0
     result_img = Image.fromarray(img_np, mode="RGBA")
     ```

---

### 2.5 Output Management & Validation
- **Target Output Directory**: `apps/web/public/assets/lpc/generated/`
- **Directory Creation**: `os.makedirs(target_dir, exist_ok=True)`
- **File Validation Post-Generation**:
  - Image size must match `(832, 1344)`.
  - Image mode must be `"RGBA"`.
  - At least one pixel must have alpha `< 255` (verifying transparency keying occurred).

---

## 3. Architecture Specification for `tools/generate_lpc_sheet.py`

### 3.1 Proposed Implementation Code

```python
"""
tools/generate_lpc_sheet.py
Automated Local PyTorch + Diffusers LPC 64x64 Sprite Sheet Generator & Alpha Stripper.
Target Grid: 832x1344 pixels (13 columns x 21 rows of 64x64 pixel frames = 273 frames).
Output Path: apps/web/public/assets/lpc/generated/
"""

import os
import sys
import argparse
import time
import torch
import numpy as np
from PIL import Image, ImageDraw

def parse_args():
    parser = argparse.ArgumentParser(description="LPC 64x64 Sprite Sheet AI Generator & Alpha Stripper")
    parser.add_argument("--prompt", type=str, default="LPC sprite sheet, 64x64 character animations, walk, hurt, slash, spellcast, transparent background grid, pixel art", help="Positive prompt")
    parser.add_argument("--negative-prompt", type=str, default="3D, photorealistic, gradient, blur, anti-aliased edges, noisy background", help="Negative prompt")
    parser.add_argument("--model-id", type=str, default="runwayml/stable-diffusion-v1-5", help="HuggingFace model ID or local weights path")
    parser.add_argument("--output", type=str, default="apps/web/public/assets/lpc/generated/lpc_generated_sheet.png", help="Output PNG path")
    parser.add_argument("--width", type=int, default=832, help="Target width (default 832 px)")
    parser.add_argument("--height", type=int, default=1344, help="Target height (default 1344 px)")
    parser.add_argument("--seed", type=int, default=42, help="Random seed")
    parser.add_argument("--num-steps", type=int, default=30, help="Inference steps")
    parser.add_argument("--guidance-scale", type=float, default=7.5, help="CFG scale")
    parser.add_argument("--bg-color", type=str, default="auto", help="Background keying color: 'auto', 'green', 'magenta', 'white', 'black', or hex RGB like '#00FF00'")
    parser.add_argument("--tolerance", type=int, default=30, help="Color keying tolerance threshold (0-255)")
    parser.add_argument("--cpu-only", action="store_true", help="Force CPU inference mode")
    parser.add_argument("--offline-test", action="store_true", help="Generate synthetic test grid without loading diffusers model")
    return parser.parse_args()

def detect_corner_bg_color(img: Image.Image) -> tuple:
    """Samples four corners to determine the dominant background color."""
    w, h = img.size
    corners = [
        img.getpixel((0, 0)),
        img.getpixel((w - 1, 0)),
        img.getpixel((0, h - 1)),
        img.getpixel((w - 1, h - 1))
    ]
    # Extract RGB tuple
    rgb_corners = [c[:3] for c in corners]
    # Return average or mode
    avg_r = int(sum(c[0] for c in rgb_corners) / 4)
    avg_g = int(sum(c[1] for c in rgb_corners) / 4)
    avg_b = int(sum(c[2] for c in rgb_corners) / 4)
    return (avg_r, avg_g, avg_b)

def parse_bg_color_arg(bg_arg: str, img: Image.Image) -> tuple:
    bg_arg_lower = bg_arg.lower().strip()
    if bg_arg_lower == "auto":
        return detect_corner_bg_color(img)
    elif bg_arg_lower in ("green", "#00ff00"):
        return (0, 255, 0)
    elif bg_arg_lower in ("magenta", "#ff00ff"):
        return (255, 0, 255)
    elif bg_arg_lower in ("white", "#ffffff"):
        return (255, 255, 255)
    elif bg_arg_lower in ("black", "#000000"):
        return (0, 0, 0)
    elif bg_arg_lower.startswith("#") and len(bg_arg_lower) == 7:
        r = int(bg_arg_lower[1:3], 16)
        g = int(bg_arg_lower[3:5], 16)
        b = int(bg_arg_lower[5:7], 16)
        return (r, g, b)
    else:
        return detect_corner_bg_color(img)

def strip_background_alpha(img: Image.Image, bg_color: tuple, tolerance: int = 30) -> Image.Image:
    """Converts background color pixels to transparent PNG alpha channel using NumPy."""
    rgba_img = img.convert("RGBA")
    img_np = np.array(rgba_img)
    
    rgb = img_np[:, :, :3].astype(np.int32)
    bg_rgb = np.array(bg_color, dtype=np.int32)
    
    # Calculate Euclidean distance in RGB space
    dist = np.sqrt(np.sum((rgb - bg_rgb) ** 2, axis=2))
    
    # Set Alpha channel to 0 for pixels within tolerance
    img_np[dist <= tolerance, 3] = 0
    
    return Image.fromarray(img_np, mode="RGBA")

def create_synthetic_lpc_test_sheet(width: int = 832, height: int = 1344) -> Image.Image:
    """Generates an offline synthetic LPC 64x64 grid test sheet with solid green background."""
    img = Image.new("RGBA", (width, height), (0, 255, 0, 255))
    draw = ImageDraw.Draw(img)
    
    cols, rows = 13, 21
    tile_w, tile_h = 64, 64
    
    # Draw placeholder 64x64 sprite silhouettes on grid slots
    for r in range(rows):
        for c in range(cols):
            x0 = c * tile_w
            y0 = r * tile_h
            x1 = x0 + tile_w
            y1 = y0 + tile_h
            
            # Draw sample pixel art character body silhouette inside tile
            cx, cy = x0 + 32, y0 + 32
            draw.rectangle([cx - 12, cy - 20, cx + 12, cy + 20], fill=(70, 130, 180, 255), outline=(0, 0, 0, 255))
            draw.ellipse([cx - 10, cy - 26, cx + 10, cy - 10], fill=(240, 200, 160, 255), outline=(0, 0, 0, 255))
            
    return img

def generate_lpc_sheet(args):
    print("=" * 70)
    print("🛡️ MyOS LPC Sprite Sheet AI Pipeline Engine")
    print("=" * 70)
    
    output_path = os.path.abspath(args.output)
    output_dir = os.path.dirname(output_path)
    os.makedirs(output_dir, exist_ok=True)
    
    # Determine device
    device = "cpu" if args.cpu_only or not torch.cuda.is_available() else "cuda"
    print(f"[1/4] Compute Device Target: {device.upper()}")
    if device == "cuda":
        print(f"      GPU Model: {torch.cuda.get_device_name(0)}")
        
    raw_img = None
    
    if args.offline_test:
        print("[2/4] Offline Test Mode: Generating synthetic LPC 832x1344 test sheet...")
        raw_img = create_synthetic_lpc_test_sheet(args.width, args.height)
    else:
        try:
            from diffusers import StableDiffusionPipeline
            
            print(f"[2/4] Loading Diffusers Model: {args.model_id}...")
            dtype = torch.float16 if device == "cuda" else torch.float32
            pipe = StableDiffusionPipeline.from_pretrained(args.model_id, torch_dtype=dtype)
            pipe = pipe.to(device)
            
            if device == "cuda":
                pipe.enable_attention_slicing()
                if hasattr(pipe, "enable_vae_slicing"):
                    pipe.enable_vae_slicing()
            
            generator = torch.Generator(device=device).manual_seed(args.seed)
            print(f"      Running Diffusion Inference ({args.num_steps} steps, CFG {args.guidance_scale})...")
            
            # Note: SD 1.5 generates at multiples of 64 (512x512 or 768x768)
            # We generate high resolution grid frame or scale to target (832x1344)
            gen_width = (args.width // 64) * 64
            gen_height = (args.height // 64) * 64
            
            result = pipe(
                prompt=args.prompt,
                negative_prompt=args.negative_prompt,
                width=gen_width,
                height=gen_height,
                num_inference_steps=args.num_steps,
                guidance_scale=args.guidance_scale,
                generator=generator
            )
            raw_img = result.images[0]
            
            # Rescale if needed to exact target width x height using Nearest Neighbor for pixel art
            if raw_img.size != (args.width, args.height):
                raw_img = raw_img.resize((args.width, args.height), Image.NEAREST)
                
        except Exception as e:
            print(f"[⚠️ WARNING] Diffusers loading failed or offline ({e}).")
            print("      Falling back to synthetic LPC grid template generator...")
            raw_img = create_synthetic_lpc_test_sheet(args.width, args.height)

    # Convert background to transparent PNG alpha
    print("[3/4] Executing Alpha Transparency Background Keying...")
    bg_color = parse_bg_color_arg(args.bg_color, raw_img)
    print(f"      Target Background Keying Color RGB: {bg_color}, Tolerance: {args.tolerance}")
    
    final_img = strip_background_alpha(raw_img, bg_color, tolerance=args.tolerance)
    
    # Save output
    print(f"[4/4] Saving Final Transparent LPC Sprite Sheet to: {output_path}...")
    final_img.save(output_path, "PNG")
    
    # Verification assertions
    assert os.path.exists(output_path), f"Failed to save output image at {output_path}"
    assert final_img.size == (args.width, args.height), f"Invalid dimensions: {final_img.size}"
    assert final_img.mode == "RGBA", f"Invalid color mode: {final_img.mode}"
    
    print("\n✅ LPC Sprite Sheet Pipeline Execution Complete!")
    print(f"   Saved Image Size: {final_img.size[0]}x{final_img.size[1]} px")
    print(f"   Alpha Channel Status: Converted (RGBA 32-bit)")

if __name__ == "__main__":
    args = parse_args()
    generate_lpc_sheet(args)
```

---

## 4. Verification & Protocol Compliance

### 4.1 CLI Interface Contract
- **Command Syntax**:
  ```powershell
  tools/comfy_env/Scripts/python.exe tools/generate_lpc_sheet.py --output apps/web/public/assets/lpc/generated/test_sheet.png --offline-test
  ```
- **Validation Criteria**:
  1. The output file `apps/web/public/assets/lpc/generated/test_sheet.png` must be created.
  2. The image dimensions must equal **832 x 1344**.
  3. The image mode must be **RGBA**.
  4. Non-opaque pixels must exist in the alpha channel where the solid background color was keyed out.

---

## 5. Summary Matrix of Requirements

| Requirement | Specification | Implementation Detail |
|---|---|---|
| Grid Size | 832x1344 px | 13 cols x 21 rows of 64x64 px frames (273 frames) |
| Environment | `tools/comfy_env` | Python 3.13 + PyTorch CUDA 12.4 + Diffusers |
| Hardware Target | NVIDIA RTX 4060 Ti | `torch.float16`, attention slicing, VAE slicing |
| Prompting | LPC Pixel Art | Positive + Negative prompt templates, seed parameter |
| Alpha Stripping | Color distance keying | NumPy Euclidean distance mask on RGBA arrays |
| Output Directory | `apps/web/public/assets/lpc/generated/` | Auto-created via `os.makedirs` |
