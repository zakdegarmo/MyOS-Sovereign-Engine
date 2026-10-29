#!/bin/bash
set -e

umount -l /tmp/check_pimg 2>/dev/null || true
mkdir -p /tmp/check_pimg
mount -o loop,rw "/mnt/c/Users/zakde/Desktop/AntiGravity projects/MyOS/vm/prismos.img" /tmp/check_pimg
mount -t proc proc /tmp/check_pimg/proc
mount -t sysfs sys /tmp/check_pimg/sys
mount --bind /dev /tmp/check_pimg/dev
mount -t tmpfs shm /tmp/check_pimg/dev/shm

# Start python bridge
chroot /tmp/check_pimg /usr/bin/python3 /opt/prism-os/server/linux_fs_bridge.py &
PID=$!

# Test wget readiness check
for i in $(seq 1 30); do
  if chroot /tmp/check_pimg /usr/bin/wget -q -O /dev/null http://127.0.0.1:3333/ ; then
    echo "Bridge responded 200 OK after iteration $i!"
    break
  fi
  sleep 0.2
done

# Take screenshot with full WebGL bypass flags
chroot /tmp/check_pimg /usr/bin/chromium-browser \
  --headless \
  --no-sandbox \
  --disable-gpu-sandbox \
  --ignore-gpu-blocklist \
  --enable-webgl \
  --enable-webgl2 \
  --enable-unsafe-webgl \
  --in-process-gpu \
  --window-size=1920,1080 \
  --screenshot=/tmp/screen_fixed.png \
  http://127.0.0.1:3333/

cp /tmp/check_pimg/tmp/screen_fixed.png "/mnt/c/Users/zakde/Desktop/AntiGravity projects/MyOS/tmp/screen_fixed.png" 2>/dev/null || true

kill $PID 2>/dev/null || true
umount -l /tmp/check_pimg/dev/shm
umount -l /tmp/check_pimg/dev
umount -l /tmp/check_pimg/sys
umount -l /tmp/check_pimg/proc
umount -l /tmp/check_pimg
echo "TEST_COMPLETE"
