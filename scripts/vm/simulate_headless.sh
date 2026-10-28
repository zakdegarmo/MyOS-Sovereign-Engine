#!/bin/bash
set -e
mkdir -p /mnt/prismos_inspect
mount -o loop,offset=0 /mnt/c/Users/zakde/Desktop/AntiGravity\ projects/MyOS/vm/prismos.img /mnt/prismos_inspect

cat << 'EOF' > /mnt/prismos_inspect/tmp/run_sim_headless.sh
#!/bin/sh
PORT=3333 PRISMOS_STATIC_DIR=/opt/prism-os/dist python3 /opt/prism-os/server/linux_fs_bridge.py > /tmp/bridge.log 2>&1 &
BRIDGE_PID=$!
sleep 2

echo "=== TESTING WGET ==="
wget -q -O - http://127.0.0.1:3333/api/system/status

echo -e "\n=== TESTING CHROMIUM HEADLESS DUMP-DOM ==="
chromium-browser \
  --no-sandbox \
  --disable-gpu-sandbox \
  --headless=new \
  --dump-dom \
  --enable-logging=stderr \
  --v=1 \
  http://127.0.0.1:3333/ > /tmp/chrome_dom.html 2> /tmp/chrome_err.log

echo "=== CHROMIUM ERRORS / LOGS ==="
cat /tmp/chrome_err.log | grep -E -i "error|warn|fail|uncaught|exception|webgl|crash" || cat /tmp/chrome_err.log | tail -n 30

echo "=== CHROMIUM DUMPED DOM HEAD (30 lines) ==="
head -n 30 /tmp/chrome_dom.html

kill $BRIDGE_PID 2>/dev/null || true
EOF

chmod +x /mnt/prismos_inspect/tmp/run_sim_headless.sh
chroot /mnt/prismos_inspect /tmp/run_sim_headless.sh || true
rm -f /mnt/prismos_inspect/tmp/run_sim_headless.sh
umount /mnt/prismos_inspect
