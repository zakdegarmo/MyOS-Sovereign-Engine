#!/bin/bash
set -e

MOUNT_DIR="/tmp/pimg"
mkdir -p "$MOUNT_DIR"
mount -o loop,rw "/mnt/c/Users/zakde/Desktop/AntiGravity projects/MyOS/vm/prismos.img" "$MOUNT_DIR"

echo "[1/4] Updating /opt/prism-os/dist with 2/3 + 1/3 Golden Layout & Centered Prism..."
rm -rf "$MOUNT_DIR/opt/prism-os/dist"
cp -r "/mnt/c/Users/zakde/Desktop/AntiGravity projects/MyOS/apps/prism-os/dist" "$MOUNT_DIR/opt/prism-os/"

echo "[2/4] Updating /opt/prism-os/server/linux_fs_bridge.py..."
mkdir -p "$MOUNT_DIR/opt/prism-os/server"
cp "/mnt/c/Users/zakde/Desktop/AntiGravity projects/MyOS/apps/prism-os/server/linux_fs_bridge.py" "$MOUNT_DIR/opt/prism-os/server/linux_fs_bridge.py"
chmod +x "$MOUNT_DIR/opt/prism-os/server/linux_fs_bridge.py"

echo "[3/4] Copying Sovereign Boot Splash (/opt/prism-os/splash.html)..."
cp "/mnt/c/Users/zakde/Desktop/AntiGravity projects/MyOS/apps/prism-os/splash.html" "$MOUNT_DIR/opt/prism-os/splash.html"

echo "[4/4] Updating /root/.xinitrc with Keyboard Mapping & Cursor..."
cat << 'EOF' > "$MOUNT_DIR/root/.xinitrc"
#!/bin/sh
xset -dpms
xset s off
xset s noblank

# 1. Force native 16:9 widescreen 1080p, cursor, keyboard layout, and dark root background
xrandr -s 1920x1080 2>/dev/null || xrandr --auto 2>/dev/null || true
setxkbmap us 2>/dev/null || true
xsetroot -solid "#030712" 2>/dev/null || true
xsetroot -cursor_name left_ptr 2>/dev/null || true

# 2. Ensure GPU DRI & input device permissions
chmod 666 /dev/dri/* 2>/dev/null || true
chmod 666 /dev/input/* 2>/dev/null || true

# 3. Start local PrismOS Python Server (POSIX Kernel Bridge)
PORT=3333 PRISMOS_STATIC_DIR=/opt/prism-os/dist python3 /opt/prism-os/server/linux_fs_bridge.py > /tmp/bridge.log 2>&1 &

# 4. First run bypass & clean profile
mkdir -p /root/.config/chromium
touch "/root/.config/chromium/First Run"

# 5. Launch Chromium pointing to local Sovereign Splash
exec /usr/bin/chromium-browser \
  --no-sandbox \
  --disable-gpu-sandbox \
  --test-type \
  --kiosk \
  --start-maximized \
  --start-fullscreen \
  --window-size=1920,1080 \
  --window-position=0,0 \
  --ignore-gpu-blocklist \
  --enable-webgl \
  --enable-webgl2 \
  --enable-unsafe-webgl \
  --enable-gpu-rasterization \
  --enable-zero-copy \
  --disable-gpu-watchdog \
  --default-background-color=0xff030712 \
  --allow-file-access-from-files \
  --no-first-run \
  --disable-fre \
  --no-default-browser-check \
  --password-store=basic \
  --disable-dev-shm-usage \
  --disable-features=Translate \
  --disable-infobars \
  --noerrdialogs \
  --disable-pinch \
  --overscroll-history-navigation=0 \
  file:///opt/prism-os/splash.html
EOF
chmod +x "$MOUNT_DIR/root/.xinitrc"

sync
umount "$MOUNT_DIR"
echo "[Done] prismos.img updated with 2/3 + 1/3 layout and unmounted cleanly!"
