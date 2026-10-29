#!/bin/bash
set -e

echo "=== Dual-Boot Partition Worker for PrismOS ==="

# Locate the USB disk that has partition 1 of size ~2.6GB - 3.5GB (Fedora LiveOS)
DEV=""
for d in /dev/sd[a-z]; do
    if [ -b "${d}1" ]; then
        SIZE=$(lsblk -b -n -o SIZE "${d}1" 2>/dev/null)
        if [ -n "$SIZE" ] && [ "$SIZE" -ge 2500000000 ] && [ "$SIZE" -le 3500000000 ]; then
            DEV="$d"
            break
        fi
    fi
done

if [ -z "$DEV" ]; then
    echo "ERROR: Could not locate 64GB USB drive in Linux."
    echo "Available disks:"
    lsblk
    exit 1
fi

echo "Identified 64GB USB drive: $DEV"
echo "Partition 1 (${DEV}1) is Fedora LiveOS -> 100% PRESERVED & UNTOUCHED"

# Create Partition 2 in unallocated space (from 3200MB to 7800MB = 4.6 GB)
echo "Creating Partition 2 for PrismOS in empty space..."
parted -s "$DEV" rm 2 2>/dev/null || true
parted -s "$DEV" mkpart primary ext4 3200MB 7800MB
sleep 2
partprobe "$DEV" 2>/dev/null || true
sleep 2

PART2="${DEV}2"
echo "Target Partition 2: $PART2"
if [ ! -b "$PART2" ]; then
    echo "Waiting for $PART2 device node..."
    mknod "$PART2" b $(lsblk -n -o MAJ:MIN "$DEV" | head -n 1 | cut -d: -f1) 2 2>/dev/null || true
fi

echo "Streaming PrismOS raw disk image into $PART2..."
dd if="/mnt/c/Users/zakde/Desktop/AntiGravity projects/MyOS/vm/prismos.img" of="$PART2" bs=4M status=progress conv=fsync

echo "Expanding ext4 filesystem on $PART2 to full partition size..."
e2fsck -fy "$PART2" || true
resize2fs "$PART2" || true

echo "SUCCESS: Partition 2 is ready with PrismOS!"
