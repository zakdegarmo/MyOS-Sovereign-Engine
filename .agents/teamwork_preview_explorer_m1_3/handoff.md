# Handoff Report: LPC Sprite Sheet AI Pipeline Technical Analysis & Generator Spec

**Agent**: Explorer 3 (`teamwork_preview_explorer_m1_3`)  
**Target Path**: `tools/generate_lpc_sheet.py`  
**Date**: 2026-08-01  
**Milestone**: Milestone 1 - LPC Sprite Sheet AI Pipeline Requirements & Architectural Design Specification  

---

## 1. Observation

1. **Working Directory & Requirements**:
   - Primary target file: `tools/generate_lpc_sheet.py`.
   - Grid specification: 832x1344 pixels (13 columns x 21 rows of 64x64 pixel frames = 273 frames).
   - Target output folder: `apps/web/public/assets/lpc/generated/`.
2. **Existing Project Baseline**:
   - `tools/lpc_sprite_generator.py` exists as a starter placeholder (26 lines):
     ```python
     output_dir = "apps/web/public/assets/lpc/generated"
     os.makedirs(output_dir, exist_ok=True)
     ```
   - `tools/lpc_paperdoll_compositor.py` exists for compositing 832x1344 LPC layers.
3. **Environment Audit Findings** (from `teamwork_preview_explorer_m1_1/analysis.md`):
   - Virtual environment: `tools/comfy_env/Scripts/python.exe` running Python 3.13.5.
   - Host GPU: NVIDIA GeForce RTX 4060 Ti (8 GB VRAM, Driver 591.86, CUDA 13.1 capability).
4. **Project Architecture Specifications** (`PROJECT.md` & `plan.md`):
   - Mandatory grid dimensions: Exactly 832x1344 pixels.
   - Background keying: Auto-detect or solid color (green/magenta/white/black) converted to 32-bit RGBA PNG alpha channel.

---

## 2. Logic Chain

1. **Observation 1 & 4** establish the precise canvas requirements (832x1344 px grid containing 273 64x64 pixel frames).
2. **Observation 3** confirms host hardware is an NVIDIA GeForce RTX 4060 Ti with 8 GB VRAM. Standard float32 diffusers pipeline loads may exceed 8 GB VRAM during high-resolution generation; therefore, the pipeline must enforce `torch.float16` precision, `enable_attention_slicing()`, and `enable_vae_slicing()` to operate within the 8 GB budget.
3. **Observation 1 & 4** specify background alpha removal. Diffusion models render solid raster backgrounds. Using Pillow and NumPy vectorized Euclidean distance color keying ($D = \sqrt{\Delta R^2 + \Delta G^2 + \Delta B^2} \le T$) converts background pixels to transparent alpha values (`alpha = 0`) efficiently without altering character sprite outlines.
4. **Observation 1, 2 & 4** dictate the output location (`apps/web/public/assets/lpc/generated/`). The architecture includes automatic directory creation (`os.makedirs`) and post-generation validation assertions (dimensions == 832x1344, mode == RGBA, transparent pixels present).
5. **Robustness & Offline Tolerance**: In offline mode or when external HuggingFace models are not cached locally, an offline synthetic LPC template generator (`create_synthetic_lpc_test_sheet()`) ensures testability and prevents pipeline breakage.

---

## 3. Caveats

1. **Offline Model Cache**: In CODE_ONLY network mode, downloading new pretrained models directly from Hugging Face Hub at runtime will fail unless weights are already cached locally in HuggingFace cache directory (`~/.cache/huggingface/hub`) or supplied via `--offline-test` / local `--model-id`.
2. **Resampling Quality**: Standard diffusion pipelines generate images at resolutions like 512x512 or 768x768. Rescaling to 832x1344 px requires Nearest Neighbor (`Image.NEAREST`) interpolation to preserve sharp 2D pixel art edges rather than bilinear/bicubic blur.

---

## 4. Conclusion

The technical requirements and architectural design for `tools/generate_lpc_sheet.py` have been fully formulated and specified in `analysis.md`. The design includes:
- Production CLI parameter specification (`argparse`).
- VRAM-optimized PyTorch/Diffusers pipeline loading (`float16`, attention slicing).
- High-performance NumPy color distance background keying for 32-bit RGBA PNG transparency.
- Guaranteed 832x1344 output dimensions and automatic output folder provisioning at `apps/web/public/assets/lpc/generated/`.
- Fallback synthetic grid generator for offline test verification.

---

## 5. Verification Method

To verify the proposed specification independently:
1. Inspect the written report `analysis.md` in `c:\Users\zakde\Desktop\AntiGravity projects\MyOS\.agents\teamwork_preview_explorer_m1_3\analysis.md`.
2. Check that the script architecture provides:
   - CLI flags: `--prompt`, `--negative-prompt`, `--model-id`, `--output`, `--bg-color`, `--tolerance`, `--seed`, `--offline-test`.
   - Grid layout: 832x1344 px (13 cols x 21 rows of 64x64 px).
   - Alpha channel conversion using NumPy Euclidean color distance.
   - Save path handling for `apps/web/public/assets/lpc/generated/`.
