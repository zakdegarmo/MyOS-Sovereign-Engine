#!/usr/bin/env python3
import os

xinit_content = """#!/bin/sh
xset -dpms
xset s off
xset s noblank

# Ensure 16:9 1280x720 video mode
xrandr -s 1280x720 2>/dev/null || true

mkdir -p /root/.config/chromium
touch "/root/.config/chromium/First Run"

exec /usr/bin/chromium-browser \\
  --no-sandbox \\
  --test-type \\
  --kiosk \\
  --start-maximized \\
  --start-fullscreen \\
  --window-size=1280,720 \\
  --window-position=0,0 \\
  --in-process-gpu \\
  --ignore-gpu-blocklist \\
  --enable-webgl \\
  --enable-webgl2 \\
  --enable-unsafe-webgl \\
  --enable-accelerated-2d-canvas \\
  --enable-gpu-rasterization \\
  --no-first-run \\
  --disable-fre \\
  --no-default-browser-check \\
  --password-store=basic \\
  --disable-dev-shm-usage \\
  --disable-features=Translate \\
  --disable-infobars \\
  --noerrdialogs \\
  --disable-pinch \\
  --overscroll-history-navigation=0 \\
  http://10.0.2.2:3333
"""

mount_dir = '/tmp/prisms_mount'
os.makedirs(mount_dir, exist_ok=True)
os.system(f"modprobe nbd && qemu-nbd -d /dev/nbd0 2>/dev/null && qemu-nbd -c /dev/nbd0 '/mnt/c/Users/zakde/Desktop/AntiGravity projects/MyOS/vm/prismos.qcow2' && mount /dev/nbd0 {mount_dir}")

if os.path.exists(os.path.join(mount_dir, 'root')):
    with open(os.path.join(mount_dir, 'root/.xinitrc'), 'w') as f:
        f.write(xinit_content)
    os.chmod(os.path.join(mount_dir, 'root/.xinitrc'), 0o755)
    
    cfg_dir = os.path.join(mount_dir, 'root/.config/chromium')
    os.makedirs(cfg_dir, exist_ok=True)
    with open(os.path.join(cfg_dir, 'First Run'), 'w') as f:
        f.write('')
        
    print("SUCCESS: Patched .xinitrc with in-process-gpu and WebGL flags.")

os.system(f"sync && umount {mount_dir} && qemu-nbd -d /dev/nbd0")
