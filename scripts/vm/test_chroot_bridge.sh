#!/bin/bash
set -e
mkdir -p /mnt/prismos_inspect
mount -o loop,offset=0 /mnt/c/Users/zakde/Desktop/AntiGravity\ projects/MyOS/vm/prismos.img /mnt/prismos_inspect
echo "=== PRISMOS SERVER FILE ==="
head -n 25 /mnt/prismos_inspect/opt/prism-os/server/linux_fs_bridge.py
echo "=== TESTING PYTHON IN CHROOT ==="
chroot /mnt/prismos_inspect python3 --version
echo "=== TESTING LINUX_FS_BRIDGE SYNTAX ==="
chroot /mnt/prismos_inspect python3 -m py_compile /opt/prism-os/server/linux_fs_bridge.py
echo "=== COMPILATION SUCCEEDED ==="
umount /mnt/prismos_inspect
