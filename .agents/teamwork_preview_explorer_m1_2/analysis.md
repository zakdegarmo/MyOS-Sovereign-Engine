# LPC Sprite Sheet Pipeline Analysis Report

**Author:** Explorer 2  
**Date:** 2026-08-01  
**Working Directory:** `c:\Users\zakde\Desktop\AntiGravity projects\MyOS\.agents\teamwork_preview_explorer_m1_2`  
**Milestone:** Milestone 1 - LPC Sprite Sheet Pipeline Analysis

---

## 1. Executive Summary

This report documents the architectural structure, algorithms, helper functions, asset organization, and code patterns for Liberated Pixel Cup (LPC) sprite sheets and paperdoll compositing in the MyOS project. 

The analysis covers:
1. Existing Python tools in `tools/` (`lpc_sprite_generator.py`, `lpc_paperdoll_compositor.py`, `b_team.py`).
2. The `/transparent-inator` skill (`C:\Users\zakde\.gemini\config\skills\transparent_inator\scripts\transparent_inator.py`).
3. Frontend integration points (`old_sprite.tsx`, `apps/web/src/Logic/AOGenerator.ts`, `apps/web/public/assets/lpc/lpc_registry.json`).
4. LPC standard grid layouts, background transparency mechanisms, layer hierarchy, and paperdoll compositing logic.

---

## 2. Inventory & Analysis of Existing Components

### 2.1 `tools/lpc_paperdoll_compositor.py`
- **Location:** `c:\Users\zakde\Desktop\AntiGravity projects\MyOS\tools\lpc_paperdoll_compositor.py`
- **Purpose:** Composites separate 64x64 LPC layers (typically full sheets of 832x1344 pixels) into a unified character sprite sheet.
- **Key Function:** `composite_lpc_character(base_body_path, armor_path=None, hair_path=None, weapon_path=None, output_path="output.png")`
- **Logic & Flow:**
  1. Opens base body image using Pillow: `Image.open(base_body_path).convert("RGBA")`.
  2. Extracts canvas width `w` and height `h` (e.g., `832 x 1344`).
  3. Initializes a new blank RGBA canvas: `Image.new("RGBA", (w, h), (0, 0, 0, 0))`.
  4. Sequentially pastes layers using alpha masking (`canvas.paste(layer, (0, 0), layer)`):
     - Step 1: Base Body (`base`)
     - Step 2: Armor (`armor_path`)
     - Step 3: Hair (`hair_path`)
     - Step 4: Weapon (`weapon_path`)
  5. Validates dimension matching (`layer.size == (w, h)`) before pasting.
  6. Creates parent directories if missing and saves the composited image as PNG.

### 2.2 `tools/lpc_sprite_generator.py`
- **Location:** `c:\Users\zakde\Desktop\AntiGravity projects\MyOS\tools\lpc_sprite_generator.py`
- **Purpose:** Environment readiness script for local PyTorch / GPU sprite generation.
- **Logic & Flow:**
  1. Checks for CUDA availability (`torch.cuda.is_available()`).
  2. Verifies GPU device name.
  3. Ensures target output directory exists (`apps/web/public/assets/lpc/generated`).

### 2.3 `transparent-inator` Skill & Tool
- **Location:** `C:\Users\zakde\.gemini\config\skills\transparent_inator\scripts\transparent_inator.py` (and `SKILL.md`)
- **Purpose:** Automatic background transparency stripping, BFS flood-fill of painted checkerboards or solid backgrounds, bounding box cropping, and tile grid slicing.
- **Key Functions & Subcommands:**
  - `remove_background(img: Image.Image, color_threshold=15, min_brightness=120) -> Image.Image`:
    - Performs BFS flood-fill starting from the four image corners: `[(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]`.
    - Evaluates pixel color against background heuristics:
      - `a == 0`: Already transparent.
      - Grayscale check: `diff = max(|r-g|, |g-b|, |r-b|) <= color_threshold`.
      - Brightness check: `r >= min_brightness and g >= min_brightness and b >= min_brightness`.
    - Replaces matched background pixels with fully transparent `(0, 0, 0, 0)`.
  - Subcommand `transparent`:
    - Batches single file or directory of images (`*.png`, `*.jpg`).
    - Strips background via `remove_background()`.
    - Auto-crops non-transparent content using `clean_img.getbbox()`.
    - Saves transparent PNGs and exports structured JSON summary manifest if `--output` is specified.
  - Subcommand `slice`:
    - Slices sprite sheets into individual tile assets based on tile dimensions (`--tile-width`, `--tile-height`).
    - Calculates grid columns and rows (`cols = w // tile_w`, `rows = h // tile_h`).
    - For each cell, crops tile, runs `remove_background()`, and discards empty tiles via `getbbox()`.
    - Outputs files formatted as `<basename>_r<row>_c<col>.png` and generates JSON manifest with grid metadata (`file`, `name`, `row`, `col`, `width`, `height`).

### 2.4 Frontend Integration & WebGL Rendering (`old_sprite.tsx`)
- **Location:** `c:\Users\zakde\Desktop\AntiGravity projects\MyOS\old_sprite.tsx`
- **Purpose:** Demonstrates frontend rendering of LPC sprite sheets using React Three Fiber / Three.js.
- **Key Patterns:**
  - **Pixel Art Clarity:** Texture filtering configured with `magFilter = THREE.NearestFilter` and `minFilter = THREE.NearestFilter`.
  - **Grid UV Splitting:** Texture repeat scale set to `tex.repeat.set(1 / totalCols, 1 / totalRows)`.
  - **Frame Animation Offsets:** Dynamic UV offsets:
    ```typescript
    const xOffset = (charCol * framesPerAnim) + currentFrame;
    const yOffset = (totalRows - 1) - absRow; // Inverted Y for Three.js UV space
    clonedTexture.offset.set(xOffset / totalCols, yOffset / totalRows);
    ```
  - **Alpha Edge Discard:** `meshStandardMaterial` uses `transparent={true}` and `alphaTest={0.5}` to discard transparent pixels without depth sorting artifacts.

### 2.5 Entity Genome Definition (`apps/web/src/Logic/AOGenerator.ts`)
- Demonstrates how character paperdoll genomes are structured in MyOS logic:
  ```typescript
  genome: {
      body: 'body/bodies/body_bodies_male.png',
      legs: 'legs/pants/legs_pants_male_brown.png',
      torso: 'torso/clothes/torso_clothes_male_longsleeve_brown.png',
      arms: 'arms/armor/arms_armor_male_plate_shoulders.png',
      head: 'head/heads/head_heads_human_male.png',
      hair: 'hat/helmets/hat_helmets_male_plate_helm.png',
      weapon: 'LPC_weapons_pack/1.png'
  }
  ```

### 2.6 Asset Registry (`apps/web/public/assets/lpc/lpc_registry.json`)
- **Size:** ~36.6 MB JSON file containing over 1.2M lines indexing LPC sprite sheets.
- **Schema:**
  ```json
  {
    "path": "adult_universal_ears_medium.png",
    "width": 832,
    "height": 1344,
    "type": "sheet",
    "bias": "mid",
    "category": "uncategorized",
    "tags": []
  }
  ```

---

## 3. LPC Grid Standards & Layout Specification

Standard Liberated Pixel Cup (LPC) character sprite sheets adhere to strict layout standards:

| Property | Value | Notes |
|---|---|---|
| **Frame Dimensions** | `64 x 64` pixels | Standard tile size |
| **Full Sheet Dimensions** | `832 x 1344` pixels | 13 columns x 21 rows of 64x64 cells |
| **Expanded Sheet Dimensions**| `832 x 2944` pixels | Extended animation sets (jumping, sitting, combat) |
| **Color Mode** | RGBA | 8-bit PNG alpha transparency |

### Standard LPC 832x1344 Row & Direction Layout

| Rows | Directions | Action | Frame Count |
|---|---|---|---|
| **0 - 3** | Up (0), Left (1), Down (2), Right (3) | Spellcasting / Magic | 7 frames |
| **4 - 7** | Up (4), Left (5), Down (6), Right (7) | Thrusting / Spear Attack | 8 frames |
| **8 - 11** | Up (8), Left (9), Down (10), Right (11) | Walking Cycle | 9 frames |
| **12 - 15** | Up (12), Left (13), Down (14), Right (15) | Slash / Sword Attack | 6 frames |
| **16 - 19** | Up (16), Left (17), Down (18), Right (19) | Bow / Archery Attack | 13 frames |
| **20** | Single row | Hurt / Collapse / Death | 6 frames |

---

## 4. Reusable Code Patterns & Helper Functions

| Function / Component | File Source | Purpose | Reusable Code Pattern |
|---|---|---|---|
| `composite_lpc_character` | `lpc_paperdoll_compositor.py` | Layer compositing | `PIL.Image.new("RGBA")` + iterative `paste(layer, (0,0), layer)` |
| `remove_background` | `transparent_inator.py` | BFS background removal | BFS flood-fill queue checking color grayscale threshold and brightness |
| `cmd_slice` | `transparent_inator.py` | Grid slicing | Cell crop (`img.crop(box)`), `remove_background()`, bounding box filter (`getbbox()`) |
| `SpriteSheetAvatar` | `old_sprite.tsx` | WebGL 2.5D rendering | UV scale (`1/cols`, `1/rows`), offset calculations, `NearestFilter`, `alphaTest=0.5` |
| `EntitySpawn.genome` | `AOGenerator.ts` | Layer ordering config | Canonical paperdoll order: `body` -> `legs` -> `torso` -> `arms` -> `head` -> `hair` -> `weapon` |

---

## 5. Architectural Gaps & Recommendations for Milestone 1

1. **Layer Ordering Rigidity:**
   - Existing `lpc_paperdoll_compositor.py` has hardcoded layer ordering (`base` -> `armor` -> `hair` -> `weapon`).
   - *Recommendation:* Introduce a dynamic Z-index configuration array (e.g. `['behind_hair', 'body', 'legs', 'torso', 'head', 'hair', 'arms', 'weapon', 'front_gear']`).

2. **Background Removal Integration:**
   - `transparent_inator.py` exists as a separate skill script.
   - *Recommendation:* Import `remove_background` from `transparent_inator.py` into the paperdoll compositor to strip artifacts automatically before layering.

3. **Validation & Fallback Handling:**
   - Currently, `lpc_paperdoll_compositor.py` skips layers silently if dimensions do not match.
   - *Recommendation:* Implement explicit image scaling or detailed warning logs when layer sizes differ (e.g. standard 832x1344 vs expanded 832x2944).

4. **Asset Registry Integration:**
   - `lpc_registry.json` contains metadata for all available sheets.
   - *Recommendation:* Connect the compositor to `lpc_registry.json` for category-based layer resolution (resolving requested gear names to exact file paths).

---

## 6. Summary of Findings

- The LPC pipeline in MyOS relies on PIL RGBA compositing for paperdoll generation and BFS flood-fill algorithms for background transparency removal.
- Standard 64x64 grid layout (832x1344 sheet size) is universally adhered to across frontend WebGL components and backend tools.
- Reusable components (`transparent_inator.py`, `lpc_paperdoll_compositor.py`, `old_sprite.tsx`) provide a solid foundation for building an end-to-end automated LPC asset creation and paperdoll compositing workflow.
