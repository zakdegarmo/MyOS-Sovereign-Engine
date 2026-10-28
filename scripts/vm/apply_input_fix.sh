#!/bin/bash
set -e

MOUNT_DIR="/tmp/pimg_fix"
mkdir -p "$MOUNT_DIR"
mount -o loop,rw "/mnt/c/Users/zakde/Desktop/AntiGravity projects/MyOS/vm/prismos.img" "$MOUNT_DIR"

echo "[1/4] Reconfiguring OpenRC runlevels for full eudev hardware hotplug..."
chroot "$MOUNT_DIR" rc-update del mdev sysinit 2>/dev/null || true
chroot "$MOUNT_DIR" rc-update add udev sysinit 2>/dev/null || true
chroot "$MOUNT_DIR" rc-update add udev-trigger sysinit 2>/dev/null || true
chroot "$MOUNT_DIR" rc-update add udev-settle sysinit 2>/dev/null || true
chroot "$MOUNT_DIR" rc-update add udev-postmount default 2>/dev/null || true

echo "[2/4] Removing conflicting 50-direct-input.conf so libinput governs all pointers & keyboards..."
rm -f "$MOUNT_DIR/etc/X11/xorg.conf.d/50-direct-input.conf"

echo "[3/4] Adding udev trigger safety and cursor pointer to /root/.profile and /root/.xinitrc..."
cat << 'EOF' > "$MOUNT_DIR/root/.profile"
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
if [ -z "$DISPLAY" ] && [ "$XDG_VTNR" = 1 ]; then
  udevadm trigger --action=add 2>/dev/null || true
  udevadm settle --timeout=2 2>/dev/null || true
  exec xinit -- :0 vt1
fi
EOF

# Update .xinitrc to set visible mouse cursor and ensure permissions
sed -i 's/xsetroot -solid "#030712" 2>\/dev\/null || true/xsetroot -solid "#030712" 2>\/dev\/null || true\nxsetroot -cursor_name left_ptr 2>\/dev\/null || true/g' "$MOUNT_DIR/root/.xinitrc"

echo "[4/4] Verifying runlevels in image..."
chroot "$MOUNT_DIR" rc-update show sysinit

sync
umount "$MOUNT_DIR"
echo "[Done] Input fix applied cleanly to prismos.img!"
