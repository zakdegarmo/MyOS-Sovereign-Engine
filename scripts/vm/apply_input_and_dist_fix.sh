#!/bin/bash
set -e

MOUNT_DIR="/tmp/pimg"
mkdir -p "$MOUNT_DIR"
mount -o loop,rw "/mnt/c/Users/zakde/Desktop/AntiGravity projects/MyOS/vm/prismos.img" "$MOUNT_DIR"

echo "[1/5] Updating /opt/prism-os/dist with new Input Telemetry & Navigation Paddles..."
rm -rf "$MOUNT_DIR/opt/prism-os/dist"
cp -r "/mnt/c/Users/zakde/Desktop/AntiGravity projects/MyOS/apps/prism-os/dist" "$MOUNT_DIR/opt/prism-os/"

echo "[2/5] Ensuring Xorg input configuration exists in /etc/X11/xorg.conf.d..."
mkdir -p "$MOUNT_DIR/etc/X11/xorg.conf.d"
cp -f "$MOUNT_DIR/usr/share/X11/xorg.conf.d/40-libinput.conf" "$MOUNT_DIR/etc/X11/xorg.conf.d/" 2>/dev/null || true
cp -f "$MOUNT_DIR/usr/share/X11/xorg.conf.d/10-evdev.conf" "$MOUNT_DIR/etc/X11/xorg.conf.d/" 2>/dev/null || true

echo "[2.5/5] Ensuring input and joystick kernel modules are autoloaded..."
mkdir -p "$MOUNT_DIR/etc"
cat << 'MODS' > "$MOUNT_DIR/etc/modules"
evdev
uinput
joydev
xpad
usbhid
hid-generic
MODS

echo "[3/5] Updating /root/.profile to restore mouse cursor..."
cat << 'EOF' > "$MOUNT_DIR/root/.profile"
if [ -z "$DISPLAY" ] && [ "$(tty)" = "/dev/tty1" ]; then
  echo "PrismOS: Initializing Diegetic 3D Spatial Environment..."
  exec xinit -- :0 vt1
fi
EOF

echo "[4/5] Updating /root/.xinitrc with input permissions & diagnostics..."
cat << 'EOF' > "$MOUNT_DIR/root/.xinitrc"
#!/bin/sh
xset -dpms
xset s off
xset s noblank

# Ensure input modules are probed
modprobe evdev 2>/dev/null || true
modprobe uinput 2>/dev/null || true
modprobe joydev 2>/dev/null || true
modprobe xpad 2>/dev/null || true

# Mount FAT32 partition to record diagnostic logs for Windows
mkdir -p /mnt/log
mount -t vfat /dev/disk/by-label/FEDORA-WS-L /mnt/log 2>/dev/null || \
mount -t vfat /dev/sda1 /mnt/log 2>/dev/null || \
mount -t vfat /dev/sdb1 /mnt/log 2>/dev/null || \
mount -t vfat /dev/sdc1 /mnt/log 2>/dev/null || true

LOG="/mnt/log/prismos_flight_recorder.log"
echo "=== PRISMOS FLIGHT RECORDER INITIALIZED: $(date) ===" > "$LOG" 2>&1

# Hardware, Video, & Input node permissions
chmod 666 /dev/dri/* 2>/dev/null || true
chmod 666 /dev/input/* 2>/dev/null || true

echo "=== DRI & GPU NODES ===" >> "$LOG"
ls -la /dev/dri/ >> "$LOG" 2>&1

echo "=== INPUT NODES ===" >> "$LOG"
ls -la /dev/input/ >> "$LOG" 2>&1

echo "=== XINPUT CONNECTED HARDWARE ===" >> "$LOG"
xinput list >> "$LOG" 2>&1 || true

echo "=== X11 LOG HIGHLIGHTS ===" >> "$LOG"
cat /var/log/Xorg.0.log 2>/dev/null | grep -E '\(EE\)|\(WW\)|amdgpu|modeset|glamor|input|libinput|evdev' >> "$LOG" 2>&1

# Bring up loopback interface
ifconfig lo 127.0.0.1 up 2>/dev/null || ip link set lo up 2>/dev/null || true
echo "=== NETWORK INTERFACES ===" >> "$LOG"
ifconfig >> "$LOG" 2>&1

# Start local PrismOS Python Server (Unbuffered IO with explicit MIME mapping)
echo "=== LAUNCHING PYTHON SERVER ===" >> "$LOG"
PORT=3333 PRISMOS_STATIC_DIR=/opt/prism-os/dist python3 -u /opt/prism-os/server/linux_fs_bridge.py > /mnt/log/bridge.log 2>&1 &
BRIDGE_PID=$!
echo "Bridge started with PID: $BRIDGE_PID" >> "$LOG"

# Wait for local Python bridge to be active on 127.0.0.1:3333
for i in $(seq 1 40); do
  if nc -z 127.0.0.1 3333 2>/dev/null; then
    echo "Bridge port 3333 responded after $i checks!" >> "$LOG"
    break
  fi
  sleep 0.15
done

# Wipe any potential singleton profile locks
rm -rf /root/.config/chromium/Singleton* /tmp/chromium_profile

# Ensure Google update domains loopback immediately to prevent offline DNS stalls
echo "127.0.0.1 update.googleapis.com android.clients.google.com googleapis.com google.com" >> /etc/hosts

echo "=== LAUNCHING CHROMIUM KIOSK (INSTANT OFFLINE & GPU ENABLED) ===" >> "$LOG"
exec /usr/bin/chromium-browser \
  --no-sandbox \
  --disable-gpu-sandbox \
  --user-data-dir=/tmp/chromium_profile \
  --default-background-color=00030712 \
  --host-rules="MAP * 127.0.0.1" \
  --enable-logging=stderr \
  --v=1 \
  --kiosk \
  --start-maximized \
  --start-fullscreen \
  --window-position=0,0 \
  --window-size=1920,1080 \
  --ignore-gpu-blocklist \
  --enable-webgl \
  --enable-webgl2 \
  --no-first-run \
  --disable-fre \
  --no-default-browser-check \
  --password-store=basic \
  --disable-dev-shm-usage \
  --disable-background-networking \
  --disable-component-update \
  --disable-domain-reliability \
  --disable-sync \
  --disable-client-side-phishing-detection \
  --dns-prefetch-disable \
  --disable-background-timer-throttling \
  --disable-renderer-backgrounding \
  --disable-backgrounding-occluded-windows \
  --disable-features=Translate,OptimizationGuideModelDownloading,OptimizationHints,MediaRouter,DialMediaRouteProvider \
  --enable-features=NetworkServiceInProcess \
  --allow-file-access-from-files \
  --disable-infobars \
  --disable-pinch \
  --overscroll-history-navigation=0 \
  file:///opt/prism-os/dist/index.html >> /mnt/log/chromium.log 2>&1
EOF
chmod +x "$MOUNT_DIR/root/.xinitrc"

echo "[5/5] Syncing filesystem cache..."
sync
umount "$MOUNT_DIR"
echo "PRISMOS_INPUT_FIX_DEPLOYED"
