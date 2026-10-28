#!/bin/bash
set -e
mkdir -p /mnt/prismos_inspect
mount -o loop,offset=0 /mnt/c/Users/zakde/Desktop/AntiGravity\ projects/MyOS/vm/prismos.img /mnt/prismos_inspect

cat << 'EOF' > /mnt/prismos_inspect/tmp/run_sim.sh
#!/bin/sh
Xvfb :99 -screen 0 1920x1080x24 &
XVFB_PID=$!
export DISPLAY=:99
sleep 2

PORT=3333 PRISMOS_STATIC_DIR=/opt/prism-os/dist python3 /opt/prism-os/server/linux_fs_bridge.py > /tmp/bridge.log 2>&1 &
BRIDGE_PID=$!
sleep 2

chromium-browser \
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
  --use-gl=angle \
  --use-angle=gl \
  --enable-gpu-rasterization \
  --enable-zero-copy \
  --disable-gpu-watchdog \
  --default-background-color=FF030712 \
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
  http://127.0.0.1:3333/ > /tmp/chromium_test.log 2>&1 &
CHROME_PID=$!

sleep 6
echo "=== CHROMIUM LOG ==="
cat /tmp/chromium_test.log
echo "=== BRIDGE LOG ==="
cat /tmp/bridge.log

kill $CHROME_PID $BRIDGE_PID $XVFB_PID 2>/dev/null || true
EOF

chmod +x /mnt/prismos_inspect/tmp/run_sim.sh
chroot /mnt/prismos_inspect /tmp/run_sim.sh || true
rm -f /mnt/prismos_inspect/tmp/run_sim.sh
umount /mnt/prismos_inspect
