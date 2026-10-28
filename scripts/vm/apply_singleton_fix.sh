#!/bin/bash
set -e

MOUNT_DIR="/tmp/pimg"
mkdir -p "$MOUNT_DIR"
mount -o loop,rw "/mnt/c/Users/zakde/Desktop/AntiGravity projects/MyOS/vm/prismos.img" "$MOUNT_DIR"

echo "[1/4] Wiping all stale Chromium locks and profile caches..."
rm -rf "$MOUNT_DIR/root/.config/chromium"
mkdir -p "$MOUNT_DIR/root/.config/chromium"

echo "[2/4] Updating /opt/prism-os/dist with clean pure PrismOS bundle..."
rm -rf "$MOUNT_DIR/opt/prism-os/dist"
cp -r "/mnt/c/Users/zakde/Desktop/AntiGravity projects/MyOS/apps/prism-os/dist" "$MOUNT_DIR/opt/prism-os/"

echo "[3/4] Writing bulletproof /root/.xinitrc..."
cat << 'EOF' > "$MOUNT_DIR/root/.xinitrc"
#!/bin/sh
xset -dpms
xset s off
xset s noblank

# Ensure audio and DRI video node permissions
chmod 666 /dev/dri/* 2>/dev/null || true

# Bring up loopback interface if down
ifconfig lo 127.0.0.1 up 2>/dev/null || ip link set lo up 2>/dev/null || true

# Start local PrismOS Python Server (Frontend UI + POSIX Kernel Bridge)
PORT=3333 PRISMOS_STATIC_DIR=/opt/prism-os/dist python3 /opt/prism-os/server/linux_fs_bridge.py > /tmp/bridge.log 2>&1 &

# Wait for local Python bridge to be active on 127.0.0.1:3333
for i in $(seq 1 50); do
  if nc -z 127.0.0.1 3333 2>/dev/null; then
    break
  fi
  sleep 0.1
done

# Wipe any potential singleton profile locks
rm -rf /root/.config/chromium/Singleton* /tmp/chromium_profile

# Launch Chromium in dedicated Kiosk Mode pointing directly to IPv4
exec /usr/bin/chromium-browser \
  --no-sandbox \
  --disable-gpu-sandbox \
  --user-data-dir=/tmp/chromium_profile \
  --kiosk \
  --start-maximized \
  --start-fullscreen \
  --window-position=0,0 \
  --force-device-scale-factor=1.0 \
  --high-dpi-support=1 \
  --ignore-gpu-blocklist \
  --enable-webgl \
  --enable-webgl2 \
  --default-background-color=00030712 \
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
  http://127.0.0.1:3333
EOF
chmod +x "$MOUNT_DIR/root/.xinitrc"

echo "[4/4] Verifying image..."
sync
umount "$MOUNT_DIR"
echo "PATCH_SUCCESS"
