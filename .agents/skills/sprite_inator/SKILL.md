---
name: sprite-inator
description: >-
  Automates the conversion of raw 3D character screen recordings into mathematically perfect, True HD (128x128) Universal LPC Spritesheets, and dynamically registers them into the Sprite Lab engine UI.
---

# Sprite-Inator (LPC Asset Manifestation Pipeline)

## Overview
The Sprite-Inator automates the complex pipeline of extracting raw 3D character animation videos (e.g., from Meshy captures), mathematically calculating seamless loop bounds using Mean Squared Error (MSE), stripping the background (accounting for vignette), mapping the frames to the Universal LPC (Liberated Pixel Cup) 832x1344 standard grid, and dynamically injecting the new archetype into the MyOS engine manifest for immediate UI use.

## Dependencies
This skill relies on local Python tools that require `opencv-python`, `numpy`, and `Pillow`.

## Quick Start
When a user asks to "process a new sprite" or run the Sprite-Inator:
1. Ensure the user has recorded the required 4-directional videos (North, West, South, East) for at least the `walk` cycle.
2. Run the `lpc_compiler.py` script.
3. Run the `register_character.py` script.
4. Manually inject a Preset into `LpcLibraryExplorer.tsx` if the user requests one-click access.

## Utility Scripts

### 1. The Compiler (`lpc_compiler.py`)
Extracts the frames, loops them, and builds the Master Sheet.

**Usage:**
```powershell
python scripts\tools\lpc_compiler.py --name character_name --input_dir "C:\Path\To\Videos" --out_dir "apps\web\public\assets\lpc\body\bodies"
```

### 2. The Registrar (`register_character.py`)
Injects the generated asset into the giant `mephit_manifest.json` so the Sprite Lab UI can detect it.

**Usage:**
```powershell
python scripts\tools\register_character.py --name character_name
```

## Common Mistakes
- Not matching the file naming convention: The compiler expects `[name]_walkNorth.mp4`, `[name]_walkWest.mp4`, etc.
- If a specific animation (like `swing`) is missing, the compiler will gracefully skip it, leaving those rows transparent.
- Forgetting to refresh the browser: The Sprite Lab UI caches the JSON manifest on load.
