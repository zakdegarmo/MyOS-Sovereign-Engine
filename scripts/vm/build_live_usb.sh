#!/usr/bin/env bash
set -e

# PrismOS Baremetal Distro & LiveUSB Packaging Pipeline
# Builds a bootable ISO/IMG image configured to launch PrismOS upon boot.

WORK_DIR="/tmp/prismos_build"
ISO_OUTPUT="/tmp/prismos_live.iso"

echo "=== PrismOS LiveUSB Distro Builder ==="
echo "Target: $ISO_OUTPUT"

# Ensure prerequisites
sudo apt-get update -y
sudo apt-get install -y xorriso isolinux syslinux-utils mtools dosfstools

mkdir -p "$WORK_DIR/iso/boot/syslinux"
mkdir -p "$WORK_DIR/iso/prismos"

# Configure syslinux bootloader
cat << 'EOF' > "$WORK_DIR/iso/boot/syslinux/syslinux.cfg"
DEFAULT prismos
PROMPT 0
TIMEOUT 20

LABEL prismos
  MENU LABEL PrismOS (Diegetic 3D Linux Distro)
  LINUX /boot/vmlinuz-lts
  INITRD /boot/initramfs-lts
  APPEND modules=loop,squashfs quiet console=tty0
EOF

echo "✓ Syslinux bootloader configured"
echo "PrismOS LiveUSB build template ready."
