# Project: PyTorch + Diffusers LPC Sprite Sheet Pipeline

## Architecture
- **Framework & Libraries**: PyTorch (with CUDA GPU support), `diffusers`, `transformers`, `accelerate`, `pillow`.
- **Environment**: Virtual Environment at `tools/comfy_env` (`tools/comfy_env/Scripts/python.exe`).
- **GPU Target**: NVIDIA GeForce RTX 4060 Ti.
- **Generator Script**: `tools/generate_lpc_sheet.py`.
- **Target Format**: 64x64 LPC-format sprite sheet grid (832x1344 dimensions = 13 columns x 21 rows of 64x64 frames).
- **Background Processing**: Background alpha removal to transparent PNG.
- **Output Destination**: `apps/web/public/assets/lpc/generated/`.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Local Environment Verification | Verify/install PyTorch with CUDA support, `diffusers`, `transformers`, `accelerate`, and `pillow` in `tools/comfy_env`. Confirm GeForce RTX 4060 Ti is detected without errors. | None | IN_PROGRESS |
| 2 | Automated LPC Sprite Generator | Create `tools/generate_lpc_sheet.py` to generate 64x64 LPC-format sprite sheets (832x1344 grid), strip background to transparent PNG, and output to `apps/web/public/assets/lpc/generated/`. | M1 | PLANNED |
| 3 | Verification & Forensic Integrity Audit | Execute end-to-end verification, confirm transparent PNG file generation at 832x1344 grid, and pass Forensic Integrity Audit. | M2 | PLANNED |

## Interface Contracts
### Generator Script Protocol (`tools/generate_lpc_sheet.py`)
- Executable: `tools/comfy_env/Scripts/python.exe tools/generate_lpc_sheet.py`
- Input arguments (optional/default parameters): `--prompt`, `--output`, `--seed`, `--height 1344`, `--width 832`
- Output artifact: Transparent PNG image with dimension exactly 832x1344 located in `apps/web/public/assets/lpc/generated/`

## Code Layout
- `tools/comfy_env/` - Virtual environment with PyTorch + Diffusers stack.
- `tools/generate_lpc_sheet.py` - Automated LPC sprite sheet generator & alpha stripper.
- `apps/web/public/assets/lpc/generated/` - Output directory for generated transparent LPC sprite sheets.
