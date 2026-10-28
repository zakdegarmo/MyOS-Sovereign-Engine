#!/usr/bin/env bash
# ==============================================================================
# MyOS Sovereign Kiosk Session Launcher
# Runs under Wayland Cage compositor or minimal X11 session.
# ==============================================================================

set -euo pipefail

echo "[MyOS-Kiosk] Initializing Sovereign Display Session..."

# 1. Export Environment Variables for GPU Acceleration
export WAYLAND_DISPLAY=wayland-0
export XDG_RUNTIME_DIR="/run/user/$(id -u)"
export MOZ_ENABLE_WAYLAND=1
export LIBVA_DRIVER_NAME=radeonsi  # or nouveau / i965 auto-detected
export VK_ICD_FILENAMES=/usr/share/vulkan/icd.d/radeon_icd.x86_64.json:/usr/share/vulkan/icd.d/intel_icd.x86_64.json:/usr/share/vulkan/icd.d/nvidia_icd.json

# 2. Wait for MyOS Background Daemons to be Online
echo "[MyOS-Kiosk] Verifying MyOS Web Service (localhost:5173)..."
for i in {1..30}; do
    if curl -s -I "http://127.0.0.1:5173" > /dev/null 2>&1; then
        echo "[MyOS-Kiosk] Web service ready!"
        break
    fi
    sleep 1
done

# 3. Launch Chromium in Dedicated Kiosk Mode with Full WebGL Acceleration
echo "[MyOS-Kiosk] Launching Hardware-Accelerated 3D Viewport..."
exec chromium \
    --kiosk \
    --no-first-run \
    --noerrdialogs \
    --disable-infobars \
    --disable-session-crashed-bubble \
    --disable-pinch \
    --overscroll-history-navigation=0 \
    --enable-features=OverlayScrollbar,VaapiVideoDecoder \
    --enable-gpu-rasterization \
    --enable-zero-copy \
    --enable-webgl \
    --enable-webgl2-compute-context \
    --ignore-gpu-blocklist \
    --autoplay-policy=no-user-gesture-required \
    --check-for-update-interval=31536000 \
    --user-data-dir="/home/myos/.config/myos-kiosk-profile" \
    "http://127.0.0.1:5173"
